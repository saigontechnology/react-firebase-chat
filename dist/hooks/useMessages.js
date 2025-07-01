import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/chat';
export const useMessages = (roomId, initialLimit = 50) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const lastMessageDocRef = useRef(null);
    const chatService = new ChatService();
    useEffect(() => {
        if (!roomId)
            return;
        setLoading(true);
        setError(null);
        setMessages([]);
        setHasMore(true);
        const unsubscribe = chatService.subscribeToMessages(roomId, (newMessages, lastDoc) => {
            // Store the last document for pagination
            if (lastDoc) {
                lastMessageDocRef.current = lastDoc;
            }
            // Convert IMessage to Message format (same conversion as in useChat)
            const convertedMessages = newMessages.map((msg) => ({
                id: msg._id,
                text: msg.text || '',
                userId: typeof msg.user._id === 'string' ? msg.user._id : msg.user._id.toString(),
                user: {
                    uid: typeof msg.user._id === 'string' ? msg.user._id : msg.user._id.toString(),
                    email: '', // Not available in IMessage
                    displayName: msg.user.name || 'Unknown User',
                    photoURL: msg.user.avatar,
                    isOnline: false, // Default status
                    lastSeen: new Date(), // Default last seen
                    status: 'offline', // Default status
                },
                createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
                type: msg.image ? 'image' : msg.audio ? 'file' : msg.video ? 'file' : msg.system ? 'system' : 'text',
                status: msg.pending ? 'sending' : msg.sent ? 'sent' : msg.received ? 'delivered' : 'read',
                metadata: msg.image ? {
                    imageUrl: msg.image,
                    fileType: 'image'
                } : undefined,
            }));
            setMessages(convertedMessages);
            setLoading(false);
            // If we received fewer messages than the limit, there are no more
            if (convertedMessages.length < initialLimit) {
                setHasMore(false);
            }
        });
        return unsubscribe;
    }, [roomId, initialLimit, chatService]);
    const loadMore = useCallback(async () => {
        if (!hasMore || loading || !lastMessageDocRef.current)
            return;
        try {
            setLoading(true);
            setError(null);
            // Get older messages using pagination
            const olderMessages = await chatService.getMessagesWithPagination(roomId, initialLimit, lastMessageDocRef.current);
            if (olderMessages.length === 0) {
                setHasMore(false);
                return;
            }
            // Convert and append older messages
            const convertedOlderMessages = olderMessages.map((msg) => ({
                id: msg._id,
                text: msg.text || '',
                userId: typeof msg.user._id === 'string' ? msg.user._id : msg.user._id.toString(),
                user: {
                    uid: typeof msg.user._id === 'string' ? msg.user._id : msg.user._id.toString(),
                    email: '', // Not available in IMessage
                    displayName: msg.user.name || 'Unknown User',
                    photoURL: msg.user.avatar,
                    isOnline: false, // Default status
                    lastSeen: new Date(), // Default last seen
                    status: 'offline', // Default status
                },
                createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
                type: msg.image ? 'image' : msg.audio ? 'file' : msg.video ? 'file' : msg.system ? 'system' : 'text',
                status: msg.pending ? 'sending' : msg.sent ? 'sent' : msg.received ? 'delivered' : 'read',
                metadata: msg.image ? {
                    imageUrl: msg.image,
                    fileType: 'image'
                } : undefined,
            }));
            setMessages(prevMessages => [...prevMessages, ...convertedOlderMessages]);
            // If we received fewer messages than the limit, there are no more
            if (olderMessages.length < initialLimit) {
                setHasMore(false);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load more messages');
        }
        finally {
            setLoading(false);
        }
    }, [hasMore, loading, roomId, initialLimit, chatService]);
    return {
        messages,
        loading,
        error,
        hasMore,
        loadMore,
    };
};
//# sourceMappingURL=useMessages.js.map