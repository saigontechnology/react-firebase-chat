import React, { useState, useRef, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { MessageInputProps } from '../types';
import { ButtonMaterialIcon } from './ButtonMaterialIcon';
import { MAX_INPUT_LENGTH } from '../utils/constants';

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
  className = '',
  maxInputLength = MAX_INPUT_LENGTH,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    // Enforce max input length (matching rn-firebase-chat)
    if (maxInputLength && value.length > maxInputLength) {
      value = value.slice(0, maxInputLength);
    }

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
  }, [onTyping, isTyping, maxInputLength]);

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

  const handlePaste = useCallback((_e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Paste is allowed — max length is enforced on change
  }, []);

  return (
    <div className={`w-full flex items-stretch space-x-2 bg-white ${className}`}>
      <div className="flex-1 relative" style={{height: '40px'}}>
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
            w-full px-2 py-2 border-0 rounded-md resize-none bg-transparent text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-0 focus:border-transparent
            disabled:bg-transparent disabled:cursor-not-allowed
          `}
        />

      </div>

      <ButtonMaterialIcon
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={`
          self-stretch rounded-lg font-medium transition-colors flex items-center justify-center
          ${disabled || !message.trim() ? '' : ''}
        `}
        style={{
          background: disabled || !message.trim() ? '#e5e7eb' : '#1e88e5',
          color: disabled || !message.trim() ? '#9ca3af' : '#fff',
        }}
        title="Send message (Enter)"
        icon="send"
        size={20}
      />
    </div>
  );
};
