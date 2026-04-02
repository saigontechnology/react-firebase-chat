import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Message, MessageListProps } from "../types";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onUpdate?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({
  message,
  isOwn,
  showAvatar: _showAvatar,
  showTimestamp,
  onUpdate,
  onDelete,
// eslint-disable-next-line react/display-name
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    if (onUpdate && editText.trim() !== message.text) {
      onUpdate({ ...message, text: editText.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === "Escape") {
      setEditText(message.text);
      setIsEditing(false);
    }
  };

  const formatTime = (date: number) => {
    const dateObj = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, "HH:mm");
    } else if (diffInHours < 48) {
      return `Yesterday ${format(date, "HH:mm")}`;
    } else {
      return format(date, "MMM d, HH:mm");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start space-x-3 px-4 py-2 group hover:bg-gray-50 ${
        isOwn ? "flex-row-reverse space-x-reverse" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
        {showTimestamp && (
          <div
            className={`text-xs text-gray-500 mb-1 ${
              isOwn ? "text-right" : ""
            }`}
          >
            {/* <span className="font-medium">{message.userId}</span> */}
            <span className="ml-2">{formatTime(message.createdAt)}</span>
          </div>
        )}

        <div
          className={`inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative ${
            isOwn ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
          }`}
        >
          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEdit}
              className="w-full bg-transparent resize-none outline-none"
              autoFocus
            />
          ) : (
            <>
              {message.type === "image" && message.metadata?.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={message.metadata.imageUrl}
                    alt="Shared image"
                    className="max-w-full h-auto rounded"
                    loading="lazy"
                  />
                  {message.text && <p className="text-sm">{message.text}</p>}
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}

              {message.updatedAt && (
                <span className="text-xs opacity-70 ml-2">(edited)</span>
              )}
            </>
          )}

          {/* Message status indicator for own messages */}
          {/* {isOwn && (
            <div className="absolute -bottom-1 -right-1">
              {message.readBy[message.userId] && (
                <div className="text-xs text-white/70">✓</div>
              )}
            </div>
          )} */}
        </div>
      </div>

      {/* Action buttons */}
      {showActions && isOwn && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex space-x-1"
        >
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Edit message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete?.(message.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
});

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  onMessageUpdate,
  onMessageDelete,
  className = "",
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  };

  const shouldShowAvatar = (message: Message, index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.userId !== message.userId;
  };

  const shouldShowTimestamp = (message: Message, index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(prevMessage.createdAt).getTime();
    return timeDiff > 5 * 60 * 1000 || prevMessage.userId !== message.userId; // 5 minutes
  };

  if (messages.length === 0) {
    return (
      <div
        className={`flex-1 flex items-center justify-center p-8 ${className}`}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 overflow-y-auto space-y-1 ${className}`}
    >
      <AnimatePresence>
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.userId === currentUser.id}
            showAvatar={shouldShowAvatar(message, index)}
            showTimestamp={shouldShowTimestamp(message, index)}
            onUpdate={onMessageUpdate}
            onDelete={onMessageDelete}
          />
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};
