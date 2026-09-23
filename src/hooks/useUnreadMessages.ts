"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUnreadMessagesCount } from "@/actions/contact";

/**
 * Custom hook to listen to unread messages count in real-time.
 * Strictly restricted to users with the "admin" role.
 * If user is not admin, returns 0 and does not launch any Firestore queries.
 */
export function useUnreadMessages(sessionProp?: any) {
  const { data: clientSession } = useSession();
  const session = sessionProp || clientSession;
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isAdmin = (session?.user?.role || "").toLowerCase() === "admin";

  useEffect(() => {
    // If user is not admin, return 0 and do not launch any query
    if (!isAdmin) {
      setUnreadCount(0);
      return;
    }

    let unsubscribeMessages: (() => void) | null = null;
    let unsubscribeContactMessages: (() => void) | null = null;
    let countMessages = 0;
    let countContact = 0;

    const updateCombined = () => {
      setUnreadCount(countMessages + countContact);
    };

    // 1. Initial count check via Server Action
    getUnreadMessagesCount()
      .then((count) => {
        setUnreadCount(count);
      })
      .catch((err) => {
        console.debug("Server count fetch error:", err);
      });

    // 2. Real-time Firestore onSnapshot listeners
    if (db) {
      try {
        const qMessages = query(
          collection(db, "messages"),
          where("status", "==", "unread")
        );
        unsubscribeMessages = onSnapshot(
          qMessages,
          (snapshot) => {
            countMessages = snapshot.size;
            updateCombined();
          },
          (error) => {
            console.debug("Messages onSnapshot listener notice:", error.message);
          }
        );
      } catch (err) {
        console.debug("Failed to attach messages listener:", err);
      }

      try {
        const qContact = query(
          collection(db, "contact_messages"),
          where("status", "==", "unread")
        );
        unsubscribeContactMessages = onSnapshot(
          qContact,
          (snapshot) => {
            countContact = snapshot.size;
            updateCombined();
          },
          (error) => {
            console.debug("Contact messages onSnapshot listener notice:", error.message);
          }
        );
      } catch (err) {
        console.debug("Failed to attach contact_messages listener:", err);
      }
    }

    // 3. Listen to local event when messages are updated in admin panel
    const handleLocalUpdate = () => {
      getUnreadMessagesCount().then((count) => {
        setUnreadCount(count);
      });
    };
    window.addEventListener("messages-updated", handleLocalUpdate);

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeContactMessages) unsubscribeContactMessages();
      window.removeEventListener("messages-updated", handleLocalUpdate);
    };
  }, [isAdmin, session?.user?.id]);

  return unreadCount;
}
