import { useState, useEffect, useCallback } from 'react';
import { ChatService } from '../services/chat';
import { Message, User, UseChatReturn } from '../types';

export interface UseChatProps {
  userId: string;
  conversationId?: string;
}

export const useChat = ({ userId, conversationId }: UseChatProps): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chatService = new ChatService();

  // Send a text message
  const sendMessage = useCallback(async (text: string) => {
    try {
      if (!conversationId) {
        throw new Error('No conversation selected');
      }

      // Create a temporary message object that matches IMessage interface for the service
      const messageData = {
        _id: '', // Will be set by service
        text,
        user: {
          _id: userId,
          name: 'Current User', // This should come from user context
        },
        createdAt: new Date(),
      };

      await chatService.sendMessage(conversationId, messageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [conversationId, userId, chatService]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      if (!conversationId) {
        throw new Error('No conversation selected');
      }
      await chatService.deleteMessage(conversationId, messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      throw err;
    }
  }, [conversationId, chatService]);

  // Update a message
  const updateMessage = useCallback(async (messageId: string, text: string) => {
    try {
      if (!conversationId) {
        throw new Error('No conversation selected');
      }
      await chatService.updateMessage(conversationId, messageId, { text });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
      throw err;
    }
  }, [conversationId, chatService]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      // Implementation would mark the message as read
      console.log('Marking message as read:', messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
      throw err;
    }
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToMessages(conversationId, (newMessages) => {
      // Convert IMessage to Message format
      const convertedMessages: Message[] = newMessages.map((msg) => ({
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
          status: 'offline' as const, // Default status
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
    });

    return () => {
      unsubscribe?.();
    };
  }, [conversationId, chatService]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    updateMessage,
    markAsRead,
  };
};
