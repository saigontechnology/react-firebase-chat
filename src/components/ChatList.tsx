import React from "react";
import { UserAvatar } from "./UserAvatar";
import { ConversationProps } from "../types";
import { useChatContext } from "../context/ChatProvider";
import "./ChatScreen.css";

export interface ChatListProps {
  openNewChatFunc: () => void;
  conversations: ConversationProps[];
  selectedConversationId: string;
  handleSelectConversation: (conversation: ConversationProps) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  openNewChatFunc,
  conversations,
  selectedConversationId,
  handleSelectConversation,
}) => {
  const { currentUser } = useChatContext();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h4>Chat</h4>
        <button className="new-btn" onClick={openNewChatFunc}>
          New
        </button>
      </div>
      <div className="conversation-list">
        {conversations.map((c) => (
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
                    c.members.find((m: string) => m !== currentUser?.id) || "",
                }}
              />
            </div>
            <div className="conversation-meta">
              <div className="conversation-top">
                <span className="conversation-name">{c.name || "Unknown"}</span>
                {/* <span
                className={`status-dot ${
                  c.status === "online" ? "online" : "offline"
                }`}
              /> */}
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
      </div>
    </aside>
  );
};

export default ChatList;
