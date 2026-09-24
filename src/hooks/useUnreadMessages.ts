"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUnreadMessagesCount } from "@/actions/contact";

/**
 * Custom hook to listen to unread messages count in real-time.
 * - For Admin: listens to unread incoming messages across contact_messages and messages.
 * - For Authenticated User: listens to unread replies/messages intended for their userId.
 */
export function useUnreadMessages(sessionProp?: any) {
  const { data: clientSession } = useSession();
  const session = sessionProp || clientSession;
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isAdmin = (session?.user?.role || "").toLowerCase() === "admin";
  const userId = session?.user?.id;

  useEffect(() => {
    // If not authenticated, count is 0
    if (!session?.user) {
      setUnreadCount(0);
      return;
    }

    let unsubscribeMessages: (() => void) | null = null;
    let unsubscribeContactMessages: (() => void) | null = null;

    if (isAdmin) {
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

      // 3. Listen to local event when messages are updated
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
    } else if (userId) {
      // Regular user: fetch unread replies/messages
      getUnreadMessagesCount(userId)
        .then((count) => {
          setUnreadCount(count);
        })
        .catch((err) => {
          console.debug("Server user count fetch error:", err);
        });

      if (db) {
        try {
          const qUserMessages = query(
            collection(db, "contact_messages"),
            where("userId", "==", userId)
          );
          unsubscribeContactMessages = onSnapshot(
            qUserMessages,
            (snapshot) => {
              const unreadUserCount = snapshot.docs.filter(
                (d) => d.data()?.userUnread === true
              ).length;
              setUnreadCount(unreadUserCount);
            },
            (error) => {
              console.debug("User messages onSnapshot listener notice:", error.message);
            }
          );
        } catch (err) {
          console.debug("Failed to attach user messages listener:", err);
        }
      }

      const handleUserLocalUpdate = () => {
        getUnreadMessagesCount(userId).then((count) => {
          setUnreadCount(count);
        });
      };
      window.addEventListener("messages-updated", handleUserLocalUpdate);

      return () => {
        if (unsubscribeContactMessages) unsubscribeContactMessages();
        window.removeEventListener("messages-updated", handleUserLocalUpdate);
      };
    }
  }, [isAdmin, userId, session?.user]);

  return unreadCount;
}
