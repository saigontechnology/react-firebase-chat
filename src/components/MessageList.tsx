import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { Message, MessageListProps, IUser } from "../types";
import { UserAvatar } from "./UserAvatar";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isLastInGroup: boolean;
  isFirstInGroup: boolean;
  showDateSeparator: boolean;
  isLastOwnMessage: boolean;
  isSeen: boolean;
  otherUserId?: string;
  partnerUser?: IUser;
  onUpdate?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  messageStatusEnable?: boolean;
  customMessageStatus?: (hasUnread: boolean) => React.ReactNode;
  unReadSentMessage?: string;
  unReadSeenMessage?: string;
}

const DateSeparator: React.FC<{ date: number }> = ({ date }) => {
  const label = isToday(date)
    ? "Today"
    : isYesterday(date)
    ? "Yesterday"
    : format(date, "MMM d, yyyy");

  return (
    <div className="flex justify-center my-3">
      <span className="bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  );
};

const MessageItem = React.memo(function MessageItem({
  message,
  isOwn,
  showAvatar,
  isLastInGroup,
  isFirstInGroup,
  showDateSeparator,
  isLastOwnMessage,
  isSeen,
  otherUserId,
  partnerUser,
  onUpdate,
  onDelete,
  messageStatusEnable = true,
  customMessageStatus,
  unReadSentMessage = "Sent",
  unReadSeenMessage = "Seen",
}: MessageItemProps) {
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
    return format(date, "h:mm a");
  };

  // Border radius logic: group consecutive messages
  const getBubbleRadius = () => {
    const base = "18px";
    const small = "4px";
    if (isOwn) {
      return {
        borderTopLeftRadius: base,
        borderBottomLeftRadius: base,
        borderTopRightRadius: isFirstInGroup ? base : small,
        borderBottomRightRadius: isLastInGroup ? base : small,
      };
    } else {
      return {
        borderTopRightRadius: base,
        borderBottomRightRadius: base,
        borderTopLeftRadius: isFirstInGroup ? base : small,
        borderBottomLeftRadius: isLastInGroup ? base : small,
      };
    }
  };

  return (
    <>
      {showDateSeparator && <DateSeparator date={message.createdAt} />}

      <div
        className={`flex items-end px-3 ${
          isLastInGroup ? "mb-2" : "mb-0.5"
        } ${isOwn ? "flex-row-reverse" : "flex-row"}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        >
          {/* Avatar for other users — uses partner info if available */}
          {!isOwn && (
            <div className="w-8 h-8 mr-1.5 flex-shrink-0 self-end">
              {showAvatar && (
                <UserAvatar
                  user={partnerUser || {
                    id: otherUserId || message.userId,
                    name: otherUserId || message.userId,
                  }}
                  size="small"
                />
              )}
            </div>
          )}

          <div
            className={`max-w-xs lg:max-w-sm relative ${
              isOwn ? "items-end" : "items-start"
            } flex flex-col`}
          >
            {/* Sender name for received messages */}
            {!isOwn && isFirstInGroup && (
              <span className="text-xs text-gray-500 mb-1 ml-1 hm-msg-sender-name">
                {partnerUser?.name || otherUserId || message.userId}
              </span>
            )}
            {/* Message bubble */}
            <div
              className={`px-3 py-2 relative ${
                isOwn
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-900 shadow-sm"
              }`}
              style={getBubbleRadius()}
            >
              {isEditing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleEdit}
                  className="w-full bg-transparent resize-none outline-none min-w-[160px]"
                  autoFocus
                />
              ) : (
                <>
                  {message.type === "image" && message.metadata?.imageUrl ? (
                    <div className="space-y-1">
                      <img
                        src={message.metadata.imageUrl}
                        alt="Shared image"
                        className="max-w-full h-auto rounded-xl"
                        loading="lazy"
                      />
                      {message.text && (
                        <p className="text-sm">{message.text}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words leading-snug">
                      {message.text}
                    </p>
                  )}

                  {message.updatedAt && (
                    <span
                      className={`text-xs ml-1 ${
                        isOwn ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      (edited)
                    </span>
                  )}
                </>
              )}

              {/* Timestamp inside bubble */}
              <div
                className={`text-right mt-0.5 text-xs ${
                  isOwn ? "text-blue-200" : "text-gray-400"
                }`}
              >
                {formatTime(message.createdAt)}
              </div>
            </div>

            {/* Message status indicator (matching rn-firebase-chat) */}
            {messageStatusEnable && isLastOwnMessage && (
              <div className="mt-1 mr-1 self-end">
                {customMessageStatus ? (
                  customMessageStatus(!isSeen)
                ) : (
                  <span className="bg-gray-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {isSeen ? unReadSeenMessage : unReadSentMessage}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons (edit/delete) */}
          {showActions && isOwn && !isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex space-x-1 mx-2 self-center"
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
        </div>
      </>
    );
  }
);

export const MessageList: React.FC<MessageListProps & { partnerUsers?: IUser[] }> = ({
  messages,
  currentUser,
  partnerUsers,
  onMessageUpdate,
  onMessageDelete,
  className = "",
  messageStatusEnable = true,
  customMessageStatus,
  unReadSentMessage,
  unReadSeenMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  };

  // Find last own message index
  const lastOwnMessageIndex = messages.reduce((last, msg, index) => {
    return msg.userId === currentUser.id ? index : last;
  }, -1);

  // Check if the last own message has been seen by anyone else
  const isLastOwnMessageSeen = (() => {
    if (lastOwnMessageIndex < 0) return false;
    const lastMsg = messages[lastOwnMessageIndex];
    return Object.entries(lastMsg.readBy || {}).some(
      ([uid, read]) => uid !== currentUser.id && read
    );
  })();

  if (messages.length === 0) {
    return (
      <div
        className={`flex-1 flex items-center justify-center p-8 bg-gray-100 ${className}`}
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
      className={`flex-1 overflow-y-auto bg-gray-100 py-2 ${className}`}
    >
      <AnimatePresence>
        {messages.map((message, index) => {
          const isOwn = message.userId === currentUser.id;

          const prevMessage = index > 0 ? messages[index - 1] : null;
          const nextMessage =
            index < messages.length - 1 ? messages[index + 1] : null;

          const isFirstInGroup =
            !prevMessage || prevMessage.userId !== message.userId;
          const isLastInGroup =
            !nextMessage || nextMessage.userId !== message.userId;

          const showDateSeparator =
            !prevMessage ||
            !isSameDay(
              new Date(message.createdAt),
              new Date(prevMessage.createdAt)
            );

          // For other-user avatars, show only on last message of their group
          const showAvatar = !isOwn && isLastInGroup;

          const isLastOwnMessage =
            isOwn && index === lastOwnMessageIndex;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MessageItem
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                showDateSeparator={showDateSeparator}
                isLastOwnMessage={isLastOwnMessage}
                isSeen={isLastOwnMessageSeen}
                otherUserId={message.userId}
                partnerUser={partnerUsers?.find((p) => p.id === message.userId) || partnerUsers?.[0]}
                onUpdate={onMessageUpdate}
                onDelete={onMessageDelete}
                messageStatusEnable={messageStatusEnable}
                customMessageStatus={customMessageStatus}
                unReadSentMessage={unReadSentMessage}
                unReadSeenMessage={unReadSeenMessage}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};
