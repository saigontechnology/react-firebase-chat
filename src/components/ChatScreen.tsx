import React, { useState, useCallback, useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useChatContext } from "../context/ChatProvider";
import { FileUploader } from "../addons/fileUpload/FileUploader";
import { useChat } from "../hooks/useChat";
import { Message, IUser, ConversationProps } from "../types";
import { ChatService } from "../services/chat";
import { ButtonMaterialIcon } from "./ButtonMaterialIcon";
import "./ChatScreen.css";
import { ChatHeader } from "./ChatHeader";
import { generateConversationId } from "../utils/conversation";
import ChatList, { ChatListProps } from "./ChatList";
import { ChatNewModal, ChatNewModalRef } from "./ChatNewModal";

export interface ChatScreenProps {
  conversationId?: string;
  partners?: Array<IUser>;
  style?: React.CSSProperties;
  className?: string;
  onSend?: (messages: Message[]) => void;
  showFileUpload?: boolean;
  isGroup?: boolean;
  renderHeader?: () => React.ReactNode;
  renderChatList?: (props: ChatListProps) => React.ReactNode;
  renderChatNewModal?: (props: {
    onUserSelect: (user: { id: string; name: string; avatar?: string }) => void;
  }) => React.ReactNode;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  partners = [],
  style,
  className = "",
  onSend,
  showFileUpload = true,
  isGroup = false,
  renderHeader,
  renderChatList,
  renderChatNewModal,
}) => {
  const { currentUser, isInitialized } = useChatContext();
  const [showUploader, setShowUploader] = useState(false);

  const chatNewModalRef = useRef<ChatNewModalRef>(null);

  // Conversations list from users/{userId}/conversations
  const [conversations, setConversations] = useState<Array<ConversationProps>>(
    []
  );
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(conversationId);
  const [selectedName, setSelectedName] = useState<string>("");

  // Selected partners in the selected conversation
  const [selectedPartners, setSelectedPartners] =
    useState<Array<IUser>>(partners);

  const { messages, loading, error, sendMessage, markAsRead } = useChat({
    user: currentUser,
    conversationId: selectedConversationId || conversationId,
    memberIds: [
      ...new Set([
        `${currentUser.id}`,
        ...selectedPartners.map((partner) => partner.id),
      ]),
    ],
    name: isGroup
      ? `group_${currentUser.id},${selectedPartners
          .map((partner) => partner.name)
          .join(",")}`
      : selectedPartners.find((partner) => partner.id !== currentUser.id)
          ?.name || selectedName,
  });

  const convertedUser: IUser = currentUser
    ? {
        id: currentUser.id.toString(),
        name: currentUser.name || "Unknown User",
        avatar: currentUser.avatar,
      }
    : {
        id: "",
        name: "Unknown User",
        avatar: undefined,
      };

  // Subscribe to user conversations for sidebar
  useEffect(() => {
    const chatService = ChatService.getInstance();
    if (!currentUser?.id) return;
    const unsubscribe = chatService.subscribeToUserConversations(
      `${currentUser.id}`,
      (items) => {
        setConversations(items);
        // If nothing selected, pick first
        if (!selectedConversationId && items.length > 0) {
          setSelectedConversationId(items[0].id);
          setSelectedName(items[0].name || "");
        }
      }
    );
    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (selectedConversationId) {
      markAsRead();
    }
  }, [selectedConversationId, markAsRead]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      try {
        await sendMessage(text);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [sendMessage]
  );

  const handleSendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await handleSendMessage(text);
    },
    [handleSendMessage]
  );

  const startChatWithUser = useCallback(
    async (targetUser: IUser) => {
      try {
        const chatService = ChatService.getInstance();
        const newId = await chatService.createConversation(
          [`${currentUser.id}`, targetUser.id],
          `${currentUser.id}`,
          "private",
          currentUser.name,
          targetUser.name,
          generateConversationId([`${currentUser.id}`, targetUser.id])
        );
        chatNewModalRef.current?.hide();
        setSelectedConversationId(newId);
        setSelectedName(targetUser.name || "");
        setSelectedPartners([targetUser]);
      } catch (e) {
        console.error("Failed to start chat", e);
      }
    },
    [currentUser?.id]
  );

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      // Handle file uploads
      console.log("Files uploaded:", files);
      setShowUploader(false);

      // For each file, send a text message indicating file was uploaded
      for (const file of files) {
        const text = `File uploaded: ${file.name}`;
        await handleSendMessage(text);
      }
    },
    [handleSendMessage]
  );

  const handleSelectConversation = useCallback(
    (conversation: ConversationProps) => {
      setSelectedConversationId(conversation.id);
      setSelectedName(conversation.name || "");
      setSelectedPartners(
        conversation.members
          .filter((m: string) => m !== currentUser?.id)
          .map((m: string) => ({ id: m }))
      );
    },
    []
  );

  if (!isInitialized) {
    return (
      <div className={`chat-screen loading ${className}`} style={style}>
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Initializing chat...</p>
        </div>
      </div>
    );
  }

  // Do not block the whole screen while loading a conversation

  if (error) {
    return (
      <div className={`chat-screen error ${className}`} style={style}>
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-screen ${className}`} style={style}>
      {/* App Header */}
      {renderHeader ? renderHeader() : <ChatHeader currentUser={currentUser} />}

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar - Conversations */}
        {renderChatList ? (
          renderChatList({
            openNewChatFunc: () => chatNewModalRef.current?.show(),
            conversations,
            selectedConversationId: selectedConversationId || "",
            handleSelectConversation,
          })
        ) : (
          <ChatList
            openNewChatFunc={() => chatNewModalRef.current?.show()}
            conversations={conversations}
            selectedConversationId={selectedConversationId || ""}
            handleSelectConversation={handleSelectConversation}
          />
        )}

        {/* Chat Panel */}
        <section className="chat-panel">
          <div className="chat-panel-header">
            <div className="chat-target">
              <span className="target-name">
                {selectedName || selectedPartners[0]?.name || "..."}
              </span>
            </div>
            <div className="chat-actions">
              <ButtonMaterialIcon
                className="icon-btn"
                title="Voice call"
                icon="call"
              />
              <ButtonMaterialIcon
                className="icon-btn"
                title="Video call"
                icon="videocam"
              />
            </div>
          </div>

          <div className="messages-container">
            {loading ? (
              <div className="panel-loading">
                <div className="spinner" />
              </div>
            ) : (
              <>
                <MessageList
                  messages={messages}
                  currentUser={convertedUser}
                  onMessageUpdate={(message) =>
                    console.log("Message updated:", message)
                  }
                  onMessageDelete={(messageId) =>
                    console.log("Delete message:", messageId)
                  }
                />
                <TypingIndicator typingUsers={[]} />
              </>
            )}
          </div>

          <div className="panel-input">
            <div className="input-box">
              {showFileUpload && (
                <ButtonMaterialIcon
                  className="attach-btn"
                  title="Attach file"
                  icon="attach_file"
                  onClick={() => setShowUploader(true)}
                />
              )}
              <div className="input-flex">
                <MessageInput
                  onSendMessage={handleSendTextMessage}
                  onTyping={(isTyping) => console.log("Typing:", isTyping)}
                  placeholder="Type your message..."
                  className="message-input-reset"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* File Uploader Modal */}
      {showUploader && (
        <div className="uploader-modal">
          <div className="uploader-content">
            <FileUploader
              onFileSelect={handleFileUpload}
              onUploadComplete={(urls) => console.log("Upload complete:", urls)}
              onError={(error) => console.error("Upload error:", error)}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              multiple
              maxFiles={5}
            />
            <ButtonMaterialIcon
              className="close-uploader"
              title="Close uploader"
              icon="close"
              onClick={() => setShowUploader(false)}
            />
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {renderChatNewModal ? (
        renderChatNewModal({
          onUserSelect: startChatWithUser,
        })
      ) : (
        <ChatNewModal ref={chatNewModalRef} onUserSelect={startChatWithUser} />
      )}
    </div>
  );
};
