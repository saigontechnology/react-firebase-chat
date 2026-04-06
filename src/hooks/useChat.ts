import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/chat';
import { Message, IMessage, IUser, UseChatReturn, MediaType } from '../types';
import { useChatContext } from '../context/ChatProvider';
import { encryptData, decryptedMessageData } from '../utils/encryption';

export interface UseChatProps {
  user: IUser;
  conversationId?: string;
  memberIds?: string[];
  name?: string;
}

const convertMessages = async (rawMessages: IMessage[], key: string | null): Promise<Message[]> =>
  Promise.all(
    rawMessages.map(async (msg) => ({
      id: msg.id,
      text: key ? await decryptedMessageData(msg.text || '', key) : (msg.text || ''),
      userId: typeof msg.senderId === 'string' ? msg.senderId : '',
      createdAt: msg.createdAt ? msg.createdAt : Date.now(),
      type: msg.system ? 'system' :
        msg.image ? 'image' :
          msg.audio || msg.video ? 'file' :
            'text',
      readBy: msg.readBy ?? {},
      metadata: msg.image ? { imageUrl: msg.image, fileType: 'image' } : undefined,
    }))
  );

export const useChat = ({ user, conversationId, memberIds, name }: UseChatProps): UseChatReturn => {
  const chatService = ChatService.getInstance();
  const { derivedKey, enableEncrypt, encryptionFuncProps } = useChatContext();

  // Keep a ref so callbacks always read the latest key without being in deps
  const derivedKeyRef = useRef(derivedKey);
  useEffect(() => {
    derivedKeyRef.current = derivedKey;
  }, [derivedKey]);

  // Cache raw (encrypted) messages so we can re-decrypt when the key arrives
  const rawMessagesRef = useRef<IMessage[]>([]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the effective key: null when encryption is disabled
  const effectiveKey = enableEncrypt ? derivedKey : null;

  // Re-decrypt cached messages when derivedKey first resolves
  useEffect(() => {
    if (!effectiveKey || rawMessagesRef.current.length === 0) return;
    convertMessages(rawMessagesRef.current, effectiveKey).then(setMessages);
  }, [effectiveKey]);

  // Stable subscription — never torn down unless conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToMessages(conversationId, async (newMessages) => {
      rawMessagesRef.current = newMessages;
      const key = enableEncrypt ? derivedKeyRef.current : null;
      const converted = await convertMessages(newMessages, key);
      setMessages(converted);
      setLoading(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [conversationId, chatService, enableEncrypt]);

  // Send a text message
  const sendMessage = useCallback(async (text: string) => {
    try {
      if (!conversationId) {
        throw new Error('No conversation selected');
      }

      let encryptedText = text;

      if (enableEncrypt) {
        // Use custom encrypt function if provided (matching rn-firebase-chat)
        if (encryptionFuncProps?.encryptFunctionProp) {
          encryptedText = await encryptionFuncProps.encryptFunctionProp(text);
        } else if (derivedKeyRef.current) {
          encryptedText = await encryptData(text, derivedKeyRef.current);
        }
      }

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
  }, [conversationId, user?.id, user?.name, chatService, memberIds, name, enableEncrypt, encryptionFuncProps]);

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

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    markAsRead,
  };
};
