import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import { decryptedMessageData } from "../utils/encryption";
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
  onSend: _onSend,
  showFileUpload = true,
  isGroup = false,
  renderHeader,
  renderChatList,
  renderChatNewModal,
}) => {
  const { currentUser, derivedKey } = useChatContext();
  const [showUploader, setShowUploader] = useState(false);

  const chatNewModalRef = useRef<ChatNewModalRef>(null);

  // Keep a ref so the subscription callback always reads the latest key
  const derivedKeyRef = useRef(derivedKey);
  useEffect(() => {
    derivedKeyRef.current = derivedKey;
  }, [derivedKey]);

  // Conversations list from users/{userId}/conversations
  const [conversations, setConversations] = useState<Array<ConversationProps>>([]);
  const rawConversationsRef = useRef<ConversationProps[]>([]);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(conversationId);
  const [selectedName, setSelectedName] = useState<string>("");

  // Selected partners in the selected conversation
  const [selectedPartners, setSelectedPartners] =
    useState<Array<IUser>>(partners);

  const memberIds = useMemo(
    () => [...new Set([`${currentUser.id}`, ...selectedPartners.map((p) => p.id)])],
    [currentUser.id, selectedPartners]
  );

  const chatName = useMemo(
    () =>
      isGroup
        ? `group_${currentUser.name},${selectedPartners.map((p) => p.name).join(",")}`
        : selectedPartners.find((p) => p.id !== currentUser.id)?.name || selectedName,
    [isGroup, currentUser.id, selectedPartners, selectedName]
  );

  const { messages, loading, error, sendMessage, markAsRead } = useChat({
    user: currentUser,
    conversationId: selectedConversationId || conversationId,
    memberIds,
    name: chatName,
  });

  const convertedUser = useMemo<IUser>(
    () =>
      currentUser
        ? { id: currentUser.id.toString(), name: currentUser.name || "Unknown User", avatar: currentUser.avatar }
        : { id: "", name: "Unknown User", avatar: undefined },
    [currentUser]
  );

  // Re-decrypt cached conversations when derivedKey first resolves
  useEffect(() => {
    if (!derivedKey || rawConversationsRef.current.length === 0) return;
    Promise.all(
      rawConversationsRef.current.map(async (c) => {
        if (!c.latestMessage?.text) return c;
        return {
          ...c,
          latestMessage: {
            ...c.latestMessage,
            text: await decryptedMessageData(c.latestMessage.text, derivedKey),
          },
        };
      })
    ).then(setConversations);
  }, [derivedKey]);

  // Stable subscription — never torn down unless currentUser changes
  useEffect(() => {
    const chatService = ChatService.getInstance();
    if (!currentUser?.id) return;
    const unsubscribe = chatService.subscribeToUserConversations(
      `${currentUser.id}`,
      async (items) => {
        rawConversationsRef.current = items;
        const key = derivedKeyRef.current;
        const decrypted = await Promise.all(
          items.map(async (c) => {
            if (!c.latestMessage?.text || !key) return c;
            return {
              ...c,
              latestMessage: {
                ...c.latestMessage,
                text: await decryptedMessageData(c.latestMessage.text, key),
              },
            };
          })
        );
        setConversations(decrypted);
        // If nothing selected, pick first
        if (!selectedConversationId && decrypted.length > 0) {
          setSelectedConversationId(decrypted[0].id);
          setSelectedName(decrypted[0].name || "");
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
      markAsRead();
    },
    [handleSendMessage, markAsRead]
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
    [currentUser?.id]
  );

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
