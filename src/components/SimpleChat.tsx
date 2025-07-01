import React, { useState, useCallback } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { useChat } from '../hooks/useChat';
import { useTyping } from '../hooks/useTyping';
import { SimpleUser, Message } from '../types';

export interface SimpleChatProps {
  roomId: string;
  currentUser: SimpleUser;
  onSend?: (messages: Message[]) => void;
  style?: React.CSSProperties;
  className?: string;
  showTypingIndicator?: boolean;
  placeholder?: string;
  maxMessageLength?: number;
}

/**
 * Simple Chat component that doesn't require authentication
 * Perfect for quick integration and testing
 */
export const SimpleChat: React.FC<SimpleChatProps> = ({
  roomId,
  currentUser,
  onSend,
  style,
  className = '',
  showTypingIndicator = true,
  placeholder = 'Type a message...',
  maxMessageLength = 1000,
}) => {
  const [error, setError] = useState<string | null>(null);

  const {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    updateMessage,
  } = useChat({ 
    userId: currentUser.id, 
    conversationId: roomId 
  });

  const { typingUsers, setTyping } = useTyping(roomId, currentUser.id);

  const handleSendMessage = useCallback(async (text: string) => {
    try {
      setError(null);
      await sendMessage(text);
      
      // Call onSend callback if provided
      if (onSend) {
        const newMessage: Message = {
          id: Date.now().toString(), // Temporary ID
          text,
          userId: currentUser.id,
          user: {
            uid: currentUser.id,
            email: '',
            displayName: currentUser.name,
            photoURL: currentUser.avatar,
            isOnline: true,
            lastSeen: new Date(),
            status: 'online',
          },
          createdAt: new Date(),
          type: 'text',
          status: 'sent',
        };
        onSend([newMessage]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [sendMessage, currentUser, onSend]);

  const handleMessageUpdate = useCallback(async (message: Message) => {
    try {
      setError(null);
      await updateMessage(message.id, message.text);
    } catch (err) {
      console.error('Failed to update message:', err);
      setError(err instanceof Error ? err.message : 'Failed to update message');
    }
  }, [updateMessage]);

  const handleMessageDelete = useCallback(async (messageId: string) => {
    try {
      setError(null);
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, [deleteMessage]);

  const handleTyping = useCallback((isTyping: boolean) => {
    if (showTypingIndicator) {
      setTyping(isTyping);
    }
  }, [setTyping, showTypingIndicator]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`} style={style}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900">Chat</h3>
          <span className="text-sm text-gray-500">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ConnectionStatus status="connected" />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUser={currentUser}
        onMessageUpdate={handleMessageUpdate}
        onMessageDelete={handleMessageDelete}
        className="flex-1"
      />

      {/* Typing indicator */}
      {showTypingIndicator && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={showTypingIndicator ? handleTyping : undefined}
        placeholder={placeholder}
        maxLength={maxMessageLength}
      />
    </div>
  );
};
