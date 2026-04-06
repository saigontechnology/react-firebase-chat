import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useChatContext } from "../context/ChatProvider";
import { FileUploader } from "../addons/fileUpload/FileUploader";
import { useChat } from "../hooks/useChat";
import { useTyping } from "../hooks/useTyping";
import {
  Message,
  IUser,
  ConversationProps,
  InputToolbarProps,
  CustomConversationInfo,
} from "../types";
import { ChatService } from "../services/chat";
import { UserService } from "../services/user";
import { ButtonMaterialIcon } from "./ButtonMaterialIcon";
import "./ChatScreen.css";
import { ChatHeader } from "./ChatHeader";
import { generateConversationId } from "../utils/conversation";
import { decryptedMessageData } from "../utils/encryption";
import ChatList, { ChatListProps } from "./ChatList";
import { ChatNewModal, ChatNewModalRef } from "./ChatNewModal";
import {
  DEFAULT_TYPING_TIMEOUT_SECONDS,
  DEFAULT_CLEAR_SEND_NOTIFICATION,
} from "../utils/constants";

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

  // --- RN-compatible props ---

  /** Custom input toolbar configuration (matching rn-firebase-chat) */
  inputToolbarProps?: InputToolbarProps;
  /** Override conversation id/name/image (matching rn-firebase-chat) */
  customConversationInfo?: CustomConversationInfo;
  /** Message pagination size (default: 50, matching rn-firebase-chat maxPageSize) */
  maxPageSize?: number;
  /** Toggle read receipt display (default: true) */
  messageStatusEnable?: boolean;
  /** Custom JSX for sent/seen indicators */
  customMessageStatus?: (hasUnread: boolean) => React.ReactNode;
  /** Custom text for "Sent" status */
  unReadSentMessage?: string;
  /** Custom text for "Seen" status */
  unReadSeenMessage?: string;
  /** Enable typing indicator (default: true) */
  enableTyping?: boolean;
  /** Typing indicator timeout in ms (default: 3000) */
  typingTimeoutSeconds?: number;
  /** Callback when messages start loading */
  onStartLoad?: () => void;
  /** Callback when messages finish loading */
  onLoadEnd?: () => void;
  /** Callback to trigger push notifications after send */
  sendMessageNotification?: () => void;
  /** Delay before sending notification in ms (default: 3000) */
  timeoutSendNotify?: number;
  /** Enable search bar in conversation list */
  hasSearchBar?: boolean;
  /** Search bar placeholder */
  searchPlaceholder?: string;
  /** Search debounce delay in ms */
  searchDebounceDelay?: number;
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
  inputToolbarProps,
  customConversationInfo,
  maxPageSize = 50,
  messageStatusEnable = true,
  customMessageStatus,
  unReadSentMessage,
  unReadSeenMessage,
  enableTyping = true,
  typingTimeoutSeconds = DEFAULT_TYPING_TIMEOUT_SECONDS,
  onStartLoad,
  onLoadEnd,
  sendMessageNotification,
  timeoutSendNotify = DEFAULT_CLEAR_SEND_NOTIFICATION,
  hasSearchBar = false,
  searchPlaceholder,
  searchDebounceDelay,
}) => {
  const { currentUser, derivedKey, enableEncrypt, blackListRegex, prefix, storageProvider } =
    useChatContext();
  const [showUploader, setShowUploader] = useState(false);

  const chatNewModalRef = useRef<ChatNewModalRef>(null);

  // Keep a ref so the subscription callback always reads the latest key
  const derivedKeyRef = useRef(derivedKey);
  useEffect(() => {
    derivedKeyRef.current = derivedKey;
  }, [derivedKey]);

  // Configure ChatService with prefix, blacklist, and storageProvider
  useEffect(() => {
    const chatService = ChatService.getInstance();
    chatService.setPrefix(prefix);
    chatService.setBlackListRegex(blackListRegex);
    if (storageProvider) {
      chatService.setStorageProvider(storageProvider);
    }
  }, [prefix, blackListRegex, storageProvider]);

  // Resolve effective conversationId from customConversationInfo
  const effectiveConversationId = customConversationInfo?.id || conversationId;

  // Conversations list from users/{userId}/conversations
  const [conversations, setConversations] = useState<Array<ConversationProps>>([]);
  const rawConversationsRef = useRef<ConversationProps[]>([]);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(effectiveConversationId);
  const selectedConversationIdRef = useRef(selectedConversationId);
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);
  const [selectedName, setSelectedName] = useState<string>(
    customConversationInfo?.name || ""
  );

  // Selected partners in the selected conversation
  const [selectedPartners, setSelectedPartners] =
    useState<Array<IUser>>(partners);

  // Resolve partner info (name + avatar) from a conversation object
  const resolvePartners = useCallback(
    (conversation: ConversationProps) => {
      const partnerIds = conversation.members.filter(
        (m: string) => m !== `${currentUser?.id}`
      );
      // Use conversation data first (image = partner avatar)
      setSelectedPartners(
        partnerIds.map((m: string) => ({
          id: m,
          name: conversation.name,
          avatar: conversation.image,
        }))
      );
      // Fallback: look up user docs if no image stored in conversation
      if (!conversation.image && partnerIds.length > 0) {
        const userService = UserService.getInstance();
        Promise.all(partnerIds.map((pid) => userService.getUserById(pid))).then(
          (users) => {
            const resolved = users
              .filter((u): u is NonNullable<typeof u> => u !== null)
              .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }));
            if (resolved.length > 0) {
              setSelectedPartners(resolved);
            }
          }
        );
      }
    },
    [currentUser?.id]
  );

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
    conversationId: selectedConversationId || effectiveConversationId,
    memberIds,
    name: chatName,
  });

  // Typing hook with configurable timeout
  const { typingUsers, setTyping } = useTyping(
    selectedConversationId || effectiveConversationId || "",
    `${currentUser.id}`,
    typingTimeoutSeconds
  );

  // Lifecycle callbacks
  useEffect(() => {
    if (loading) {
      onStartLoad?.();
    } else {
      onLoadEnd?.();
    }
  }, [loading, onStartLoad, onLoadEnd]);

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
        // If nothing selected, pick first (use ref to avoid stale closure)
        if (!selectedConversationIdRef.current && decrypted.length > 0) {
          const firstConv = decrypted[0];
          selectedConversationIdRef.current = firstConv.id;
          setSelectedConversationId(firstConv.id);
          setSelectedName(firstConv.name || "");
          resolvePartners(firstConv);
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

  // Resolve partner avatars when conversations load and partners are missing avatar info
  // Fixed: removed selectedPartners from deps to prevent infinite loop
  // (resolvePartners -> setSelectedPartners -> re-trigger this effect)
  useEffect(() => {
    const convId = selectedConversationId || effectiveConversationId;
    if (!convId || conversations.length === 0) return;
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      resolvePartners(conv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, selectedConversationId, effectiveConversationId]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      try {
        await sendMessage(text);

        // Notification callback with configurable delay
        if (sendMessageNotification) {
          setTimeout(() => {
            sendMessageNotification();
          }, timeoutSendNotify);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [sendMessage, sendMessageNotification, timeoutSendNotify]
  );

  const handleSendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      await handleSendMessage(text);
      markAsRead();
    },
    [handleSendMessage, markAsRead]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (enableTyping) {
        setTyping(isTyping);
      }
    },
    [enableTyping, setTyping]
  );

  const startChatWithUser = useCallback(
    async (targetUser: IUser) => {
      try {
        const chatService = ChatService.getInstance();
        const memberAvatars: Record<string, string> = {};
        if (currentUser.avatar) memberAvatars[`${currentUser.id}`] = currentUser.avatar;
        if (targetUser.avatar) memberAvatars[targetUser.id] = targetUser.avatar;
        const newId = await chatService.createConversation(
          [`${currentUser.id}`, targetUser.id],
          `${currentUser.id}`,
          "private",
          currentUser.name,
          targetUser.name,
          generateConversationId([`${currentUser.id}`, targetUser.id]),
          memberAvatars,
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
      console.log("Files uploaded:", files);
      setShowUploader(false);

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
      resolvePartners(conversation);
    },
    [resolvePartners]
  );

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

  // Determine whether to show camera/gallery buttons from inputToolbarProps
  const showCamera = inputToolbarProps?.hasCamera ?? false;
  const showGallery = inputToolbarProps?.hasGallery ?? false;
  const showFileUploadBtn = showFileUpload && !inputToolbarProps;

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
            hasSearchBar,
            searchPlaceholder,
            searchDebounceDelay,
          })
        ) : (
          <ChatList
            openNewChatFunc={() => chatNewModalRef.current?.show()}
            conversations={conversations}
            selectedConversationId={selectedConversationId || ""}
            handleSelectConversation={handleSelectConversation}
            hasSearchBar={hasSearchBar}
            searchPlaceholder={searchPlaceholder}
            searchDebounceDelay={searchDebounceDelay}
          />
        )}

        {/* Chat Panel */}
        <section className="chat-panel">
          <div className="chat-panel-header">
            <div className="chat-target">
              <span className="target-name">
                {customConversationInfo?.name ||
                  selectedName ||
                  selectedPartners[0]?.name ||
                  "..."}
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
                  partnerUsers={selectedPartners}
                  onMessageUpdate={(message) =>
                    console.log("Message updated:", message)
                  }
                  onMessageDelete={(messageId) =>
                    console.log("Delete message:", messageId)
                  }
                  messageStatusEnable={messageStatusEnable}
                  customMessageStatus={customMessageStatus}
                  unReadSentMessage={unReadSentMessage}
                  unReadSeenMessage={unReadSeenMessage}
                />
                {enableTyping && <TypingIndicator typingUsers={typingUsers} />}
              </>
            )}
          </div>

          <div className="panel-input">
            <div
              className="input-box"
              style={inputToolbarProps?.containerStyle}
            >
              {/* Camera button from inputToolbarProps */}
              {showCamera && (
                <ButtonMaterialIcon
                  className="attach-btn"
                  title="Camera"
                  icon={inputToolbarProps?.cameraIcon || "photo_camera"}
                  onClick={inputToolbarProps?.onPressCamera}
                />
              )}
              {/* Gallery button from inputToolbarProps */}
              {showGallery && (
                <ButtonMaterialIcon
                  className="attach-btn"
                  title="Gallery"
                  icon={inputToolbarProps?.galleryIcon || "photo_library"}
                  onClick={inputToolbarProps?.onPressGallery}
                />
              )}
              {/* Default file upload button */}
              {showFileUploadBtn && (
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
                  onTyping={handleTyping}
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
