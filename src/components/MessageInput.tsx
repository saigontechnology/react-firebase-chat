import React, { useState, useRef, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { MessageInputProps } from '../types';

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 1000,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    if (value.length <= maxLength) {
      setMessage(value);

      // Handle typing indicator
      if (onTyping) {
        if (!isTyping && value.trim()) {
          setIsTyping(true);
          onTyping(true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = window.setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 1000);
      }
    }
  }, [maxLength, onTyping, isTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, []);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');

      // Stop typing indicator
      if (isTyping && onTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Focus back to input
      textareaRef.current?.focus();
    }
  }, [message, disabled, onSendMessage, isTyping, onTyping]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const paste = e.clipboardData.getData('text');
    if (message.length + paste.length > maxLength) {
      e.preventDefault();
      const remaining = maxLength - message.length;
      setMessage(prev => prev + paste.slice(0, remaining));
    }
  }, [message.length, maxLength]);

  return (
    <div className={`w-full flex items-stretch space-x-2 bg-white ${className}`}>
      <div className="flex-1 relative">
        <TextareaAutosize
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          maxRows={5}
          minRows={1}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${message.length >= maxLength * 0.9 ? 'border-orange-300' : ''}
            ${message.length >= maxLength ? 'border-red-300' : ''}
          `}
        />

        {maxLength && (
          <div className="absolute bottom-1 right-2 text-xs text-gray-400">
            {message.length}/{maxLength}
          </div>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={`
          self-stretch px-4 rounded-lg font-medium transition-colors flex items-center justify-center
          ${disabled || !message.trim()
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
          }
        `}
        title="Send message (Enter)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
};
