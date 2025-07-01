import React from 'react';

// ==========================================
// Core Types matching RN-Firebase-Chat
// ==========================================

// Firebase User type (will be imported when firebase is available)
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// User types matching RN implementation
export interface IUserInfo {
  id: string;
  name: string;
  avatar?: string;
}

// IMessage interface compatible with RN app (as per documentation)
export interface IMessage {
  _id: string;
  text?: string;
  createdAt: Date | number;
  user: IUser;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  quickReplies?: IQuickReplies;
}

export interface IUser {
  _id: string | number;
  name?: string;
  avatar?: string;
}

export interface IQuickReplies {
  type: 'radio' | 'checkbox';
  values: Array<{
    title: string;
    value: string;
  }>;
  keepIt?: boolean;
}

// IConversation interface compatible with RN app
export interface IConversation {
  id: string;
  members: string[];
  lastMessage?: IMessage;
  lastMessageTime?: Date;
  unreadCount?: number;
  title?: string;
  type: 'private' | 'group';
  createdAt: Date;
  updatedAt: Date;
}

// Message types matching RN implementation
export enum MessageTypes {
  text = 'text',
  image = 'image',
  video = 'video',
  file = 'file',
  system = 'system'
}

// Message Props - Core message structure from RN implementation
export interface MessageProps {
  id?: string;
  text?: string;
  senderId: string;
  type: MessageTypes;
  path?: string;
  extension?: string;
  createdAt: Date;
  updatedAt?: Date;
  user?: IUserInfo;
}

// Send Message Props - for sending new messages
export interface SendMessageProps {
  text?: string;
  senderId: string;
  type: MessageTypes;
  path?: string;
  extension?: string;
  createdAt: Date;
}

// Latest message props
export interface LatestMessageProps {
  senderId: string;
  senderName: string;
  text: string;
  type?: MessageTypes;
  path?: string;
  extension?: string;
  createdAt: Date;
}

// Chat room/Conversation types matching RN implementation
export interface ConversationProps {
  id: string;
  name?: string;
  image?: string;
  members: string[];
  latestMessage?: LatestMessageProps;
  unRead?: number;
  updatedAt: Date;
  createdAt?: Date;
}

export interface ConversationData {
  unRead?: Record<string, string>;
  typing?: Record<string, boolean>;
}

// Media file interface
export interface MediaFile {
  id: string;
  path: string;
  type: MessageTypes;
}

// Encryption types matching RN implementation
export interface EncryptionOptions {
  algorithm?: string;
  keyLength?: number;
  iterations?: number;
}

export interface EncryptionFunctions {
  generateKeyFunctionProp?: (key: string) => Promise<string>;
  encryptFunctionProp?: (text: string) => Promise<string>;
  decryptFunctionProp?: (text: string) => Promise<string>;
}

export interface EncryptionStatus {
  isEnabled: boolean;
  isReady: boolean;
  keyGenerated: boolean;
  testPassed?: boolean;
  lastTestedAt?: Date;
}

// Firestore collections enum
export enum FireStoreCollection {
  users = 'users',
  conversations = 'conversations',
  messages = 'messages',
}

export type FirestoreReference = any; // Will be properly typed when Firebase is available

// Connection status
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// ==========================================
// Extended Types for ReactJS Implementation
// ==========================================

// Extended User interface for ReactJS features
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

// Extended Message interface for ReactJS features  
export interface Message {
  id: string;
  text: string;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt?: Date;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string; // Message ID this is replying to
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
  };
}

// Typing indicator
export interface TypingUser {
  uid: string;
  displayName: string;
  timestamp: Date;
}

// Chat room interface for ReactJS
export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[]; // User UIDs
  admins: string[]; // User UIDs
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
  isPrivate: boolean;
  settings: {
    allowFileSharing: boolean;
    allowImageSharing: boolean;
    maxParticipants?: number;
    muteNotifications: boolean;
  };
}

// ==========================================
// ReactJS Configuration & Component Types
// ==========================================

// Chat configuration for ReactJS
export interface ChatConfig {
  enableTypingIndicator: boolean;
  enableReadReceipts: boolean;
  enableFileUpload: boolean;
  enableImageUpload: boolean;
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  maxMessageLength: number;
  enableEmojis: boolean;
  enableMarkdown: boolean;
  theme: 'light' | 'dark' | 'auto';
  dateFormat: string;
  timeFormat: string;
}

// Event types for ReactJS
export interface ChatEvents {
  onMessageSent: (message: Message) => void;
  onMessageReceived: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (messageId: string) => void;
  onUserJoined: (user: User) => void;
  onUserLeft: (userId: string) => void;
  onUserTyping: (user: TypingUser) => void;
  onUserStoppedTyping: (userId: string) => void;
  onConnectionStatusChanged: (status: ConnectionStatus) => void;
  onError: (error: Error) => void;
}

// Simple user interface for non-authenticated usage
export interface SimpleUser {
  id: string;
  name: string;
  avatar?: string;
}

// Component props for ReactJS
export interface ChatProps {
  roomId: string;
  currentUser: SimpleUser;
  config?: Partial<ChatConfig>;
  events?: Partial<ChatEvents>;
  className?: string;
  style?: React.CSSProperties;
}

export interface MessageListProps {
  messages: Message[];
  currentUser: SimpleUser;
  onMessageUpdate?: (message: Message) => void;
  onMessageDelete?: (messageId: string) => void;
  className?: string;
}

export interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export interface UserAvatarProps {
  user: User;
  size?: 'small' | 'medium' | 'large';
  showOnlineStatus?: boolean;
  className?: string;
}

// Firebase configuration
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Auth state for ReactJS
export interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

// Hook return types for ReactJS
export interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'displayName' | 'photoURL'>>) => Promise<void>;
}

export interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  updateMessage: (messageId: string, text: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export interface UseTypingReturn {
  typingUsers: TypingUser[];
  setTyping: (isTyping: boolean) => void;
}
