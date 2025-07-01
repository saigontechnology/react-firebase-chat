import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/chat';
import { TypingUser, UseTypingReturn } from '../types';

export const useTyping = (roomId: string, userId: string): UseTypingReturn => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const chatService = new ChatService();

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = chatService.subscribeToTypingStatus(roomId, (typingUsers: Record<string, boolean>) => {
      // Convert typing users object to array and filter out current user
      const usersArray: TypingUser[] = Object.entries(typingUsers)
        .filter(([uid, isTyping]) => uid !== userId && isTyping)
        .map(([uid]) => ({
          uid,
          displayName: `User ${uid}`, // We'd need to get actual user data
          timestamp: new Date(),
        }));

      setTypingUsers(usersArray);
    });

    return unsubscribe;
  }, [roomId, userId, chatService]);

  const setTyping = useCallback((isTyping: boolean): void => {
    if (!userId || !roomId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTyping) {
      // Only send typing indicator if not already typing
      if (!isTypingRef.current) {
        chatService.updateTypingStatus(roomId, userId, true);
        isTypingRef.current = true;
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        chatService.updateTypingStatus(roomId, userId, false);
        isTypingRef.current = false;
      }, 3000); // Stop typing after 3 seconds of inactivity
    } else {
      // Immediately stop typing
      chatService.updateTypingStatus(roomId, userId, false);
      isTypingRef.current = false;
    }
  }, [roomId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && roomId && userId) {
        try {
          chatService.updateTypingStatus(roomId, userId, false);
        } catch (error) {
          console.error('Error cleanup typing:', error);
        }
      }
    };
  }, [roomId, userId, chatService]);

  return {
    typingUsers,
    setTyping,
  };
};
