import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats } from '../services/chatService';

/**
 * Custom hook to track unread messages count in real-time.
 * Returns:
 * - unreadTotal: Total number of unread messages across all chats
 * - unreadByChat: Map of chatId -> unreadCount for the current user
 */
export function useUnreadMessages() {
  const { currentUser } = useAuth();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [unreadByChat, setUnreadByChat] = useState({});

  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadTotal(0);
      setUnreadByChat({});
      return;
    }

    const unsub = subscribeToUserChats(currentUser.uid, (chats) => {
      let total = 0;
      const byChat = {};

      chats.forEach((chat) => {
        const count = Number(chat.unreadCounts?.[currentUser.uid]) || 0;
        byChat[chat.id] = count;
        total += count;
      });

      setUnreadTotal(total);
      setUnreadByChat(byChat);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  return { unreadTotal, unreadByChat };
}

export default useUnreadMessages;
