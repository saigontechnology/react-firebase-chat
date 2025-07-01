import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { useChat } from '../hooks/useChat';
import { useTyping } from '../hooks/useTyping';
import { ChatProps } from '../types';

export const Chat: React.FC<ChatProps> = ({
  roomId,
  currentUser,
  config = {},
  events = {},
  className = '',
  style,
}) => {
  const {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    updateMessage,
  } = useChat({ userId: currentUser.id, conversationId: roomId });

  const { typingUsers, setTyping } = useTyping(roomId, currentUser.id);

  const handleSendMessage = async (text: string) => {
    try {
      await sendMessage(text);
      events.onMessageSent?.({
        id: '',
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
      });
    } catch (error) {
      events.onError?.(error as Error);
    }
  };

  const handleMessageUpdate = async (message: any) => {
    try {
      await updateMessage(message.id, message.text);
      events.onMessageUpdated?.(message);
    } catch (error) {
      events.onError?.(error as Error);
    }
  };

  const handleMessageDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      events.onMessageDeleted?.(messageId);
    } catch (error) {
      events.onError?.(error as Error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
    if (isTyping) {
      events.onUserTyping?.({
        uid: currentUser.id,
        displayName: currentUser.name,
        timestamp: new Date(),
      });
    } else {
      events.onUserStoppedTyping?.(currentUser.id);
    }
  };

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

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`} style={style}>
        <div className="text-center space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <div>
            <p className="text-lg font-medium text-red-600">Error loading chat</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
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

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUser={currentUser}
        onMessageUpdate={handleMessageUpdate}
        onMessageDelete={handleMessageDelete}
        className="flex-1"
      />

      {/* Typing indicator */}
      {config.enableTypingIndicator !== false && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={config.enableTypingIndicator !== false ? handleTyping : undefined}
        placeholder="Type a message..."
        maxLength={config.maxMessageLength || 1000}
      />
    </div>
  );
};
