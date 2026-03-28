import {useState, useEffect, useCallback, useRef} from 'react';
import {ChatService} from '../services/chat';
import {Message, IUser, UseChatReturn, MediaType} from '../types';
import {useChatContext} from '../context/ChatProvider';
import {generateEncryptionKey, encryptData, decryptedMessageData} from '../utils/encryption';

export interface UseChatProps {
  user: IUser;
  conversationId?: string;
  memberIds?: string[];
  name?: string;
}

export const useChat = ({user, conversationId, memberIds, name}: UseChatProps): UseChatReturn => {
  const chatService = ChatService.getInstance();
  const { encryptionKey } = useChatContext();
  const derivedKeyRef = useRef<string | null>(null);

  // Derive encryption key once per conversation
  useEffect(() => {
    if (!conversationId) return;
    const password = encryptionKey || conversationId;
    const salt = conversationId;
    generateEncryptionKey(password, { salt }).then((key) => {
      derivedKeyRef.current = key;
    });
  }, [conversationId, encryptionKey]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send a text message
  const sendMessage = useCallback(async (text: string) => {
    try {
      if (!conversationId) {
        throw new Error('No conversation selected');
      }

      const encryptedText = derivedKeyRef.current
        ? await encryptData(text, derivedKeyRef.current)
        : text;

      const messageData = {
        text: encryptedText,
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

    const unsubscribe = chatService.subscribeToMessages(conversationId, async (newMessages) => {
      const key = derivedKeyRef.current;
      const convertedMessages: Message[] = await Promise.all(
        newMessages.map(async (msg) => ({
          id: msg.id,
          text: key ? await decryptedMessageData(msg.text || '', key) : (msg.text || ''),
          userId: typeof msg.senderId === 'string' ? msg.senderId : '',
          createdAt: msg.createdAt ? msg.createdAt : Date.now(),
          type: msg.image ? 'image' : msg.audio ? 'file' : msg.video ? 'file' : msg.system ? 'system' : 'text',
          readBy: msg.readBy ?? {},
          metadata: msg.image ? {
            imageUrl: msg.image,
            fileType: 'image'
          } : undefined,
        }))
      );

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
