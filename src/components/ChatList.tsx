import React, { useState, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { UserAvatar } from "./UserAvatar";
import { ConversationProps } from "../types";
import { useChatContext } from "../context/ChatProvider";
import { useDebounce } from "../hooks/useDebounce";
import "./ChatScreen.css";

const formatConversationTime = (ts?: number): string => {
  if (!ts) return "";
  const date = new Date(ts);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

export interface ChatListProps {
  openNewChatFunc: () => void;
  conversations: ConversationProps[];
  selectedConversationId: string;
  handleSelectConversation: (conversation: ConversationProps) => void;
  /** Enable search bar (matching rn-firebase-chat ListConversationScreen) */
  hasSearchBar?: boolean;
  /** Search bar placeholder text */
  searchPlaceholder?: string;
  /** Debounce delay in ms (default: 300) */
  searchDebounceDelay?: number;
}

export const ChatList: React.FC<ChatListProps> = ({
  openNewChatFunc,
  conversations,
  selectedConversationId,
  handleSelectConversation,
  hasSearchBar = false,
  searchPlaceholder = "Search conversations...",
  searchDebounceDelay = 300,
}) => {
  const { currentUser } = useChatContext();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, searchDebounceDelay);

  const filteredConversations = useMemo(() => {
    if (!debouncedSearch.trim()) return conversations;
    const query = debouncedSearch.toLowerCase();
    return conversations.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(query);
      const messageMatch = c.latestMessage?.text?.toLowerCase().includes(query);
      return nameMatch || messageMatch;
    });
  }, [conversations, debouncedSearch]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h4>Chat</h4>
        <button className="new-btn" onClick={openNewChatFunc}>
          New
        </button>
      </div>
      {hasSearchBar && (
        <div className="search-bar-container" style={{ padding: "0 12px 8px" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={searchPlaceholder}
              className="search-bar-input"
              style={{
                width: "100%",
                padding: "8px 32px 8px 12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                outline: "none",
                backgroundColor: "#f9fafb",
              }}
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  fontSize: "16px",
                  padding: "0 4px",
                  lineHeight: "1",
                }}
              >
                &times;
              </button>
            )}
          </div>
        </div>
      )}
      <div className="conversation-list">
        {filteredConversations.map((c) => (
          <button
            key={c.id}
            className={`conversation-item ${
              selectedConversationId === c.id ? "active" : ""
            }`}
            onClick={() => {
              handleSelectConversation(c);
            }}
          >
            <div className="conversation-avatar">
              <UserAvatar
                user={{
                  name: c.name,
                  id:
                    (c.members ?? []).find((m: string) => m !== currentUser?.id) || "",
                  avatar: c.image,
                }}
              />
            </div>
            <div className="conversation-meta">
              <div className="conversation-top">
                <span className="conversation-name">{c.name || "Unknown"}</span>
                <span className="conversation-time">{formatConversationTime(c.updatedAt)}</span>
              </div>
              <div className="conversation-last">
                {c?.latestMessage?.text || ""}
              </div>
            </div>
            {(c.unRead || 0) > 0 && (
              <span className="unread-badge">{c.unRead || 0}</span>
            )}
          </button>
        ))}
        {hasSearchBar && debouncedSearch && filteredConversations.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
            No conversations found
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatList;
