"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getUnreadMessagesCount } from "@/actions/contact";

/**
 * Custom hook to track unread messages count.
 * Uses secure Server Actions (adminDb count queries) with event-driven updates,
 * tab focus sync, and periodic polling, avoiding unstable client-side WebChannel connections.
 * - For Admin: counts unread incoming messages across contact_messages and messages.
 * - For Authenticated User: counts unread replies/messages intended for their userId.
 */
export function useUnreadMessages(sessionProp?: any) {
  const { data: clientSession } = useSession();
  const session = sessionProp || clientSession;
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isAdmin = (session?.user?.role || "").toLowerCase() === "admin";
  const userId = session?.user?.id;

  const refreshCount = useCallback(async () => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadMessagesCount(isAdmin ? undefined : userId);
      setUnreadCount(count);
    } catch (err) {
      console.debug("Failed to refresh unread messages count:", err);
    }
  }, [isAdmin, userId, session?.user]);

  useEffect(() => {
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    // 1. Initial count check
    refreshCount();

    // 2. Event-driven updates when messages are modified locally
    const handleLocalUpdate = () => {
      refreshCount();
    };
    window.addEventListener("messages-updated", handleLocalUpdate);

    // 3. Tab focus / visibility change update
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshCount();
      }
    };
    window.addEventListener("focus", handleLocalUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 4. Periodic polling every 30 seconds when tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshCount();
      }
    }, 30000);

    return () => {
      window.removeEventListener("messages-updated", handleLocalUpdate);
      window.removeEventListener("focus", handleLocalUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [refreshCount, session?.user]);

  return unreadCount;
}
