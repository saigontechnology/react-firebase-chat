import {useState, useEffect, useCallback} from 'react';
import {ChatService} from '../services/chat';
import {Message, IUser, UseChatReturn, MediaType, MessageStatus} from '../types';

export interface UseChatProps {
  user: IUser;
  conversationId?: string;
  memberIds?: string[];
  name?: string;
}

export const useChat = ({user, conversationId, memberIds, name}: UseChatProps): UseChatReturn => {
  const chatService = ChatService.getInstance();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send a text message
  const sendMessage = useCallback(async (text: string) => {
    try {
      if (!conversationId) {
        throw new Error('No conversation selected');
      }

      // Create a temporary message object that matches IMessage interface for the service
      const messageData = {
        text,
        type: MediaType.text,
        senderId: user?.id?.toString(),
        readBy: {
          [user?.id]: true,
        },
        path: '',
        extension: '',
      };

      await chatService.sendMessage(conversationId, messageData, {
        memberIds,
        name: user?.name || 'Current User',
        otherName: name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [conversationId, user?.id, chatService, memberIds]);

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

  // Mark message as read
  const markAsRead = useCallback(async () => {
    try {
      if (!conversationId) {
        console.log('No conversation selected');
        return;
      }
      await chatService.updateUnread(conversationId, user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
      throw err;
    }
  }, [conversationId, user.id]);

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
        id: msg.id,
        text: msg.text || '',
        userId: typeof msg.senderId === 'string' ? msg.senderId : '',
        createdAt: msg.createdAt ? msg.createdAt : Date.now(),
        type: msg.image ? 'image' : msg.audio ? 'file' : msg.video ? 'file' : msg.system ? 'system' : 'text',
        readBy: msg.readBy ?? {},
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
    markAsRead,
  };
};
