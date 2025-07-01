import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/chat';
export const useTyping = (roomId, userId) => {
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const chatService = new ChatService();
    useEffect(() => {
        if (!roomId)
            return;
        const unsubscribe = chatService.subscribeToTypingStatus(roomId, (typingUsers) => {
            // Convert typing users object to array and filter out current user
            const usersArray = Object.entries(typingUsers)
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
    const setTyping = useCallback((isTyping) => {
        if (!userId || !roomId)
            return;
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
        }
        else {
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
                }
                catch (error) {
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
//# sourceMappingURL=useTyping.js.map