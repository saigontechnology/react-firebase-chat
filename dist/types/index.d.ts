import React from 'react';
export interface FirebaseUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}
export interface IUserInfo {
    id: string;
    name: string;
    avatar?: string;
}
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
export declare enum MessageTypes {
    text = "text",
    image = "image",
    video = "video",
    file = "file",
    system = "system"
}
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
export interface SendMessageProps {
    text?: string;
    senderId: string;
    type: MessageTypes;
    path?: string;
    extension?: string;
    createdAt: Date;
}
export interface LatestMessageProps {
    senderId: string;
    senderName: string;
    text: string;
    type?: MessageTypes;
    path?: string;
    extension?: string;
    createdAt: Date;
}
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
export interface MediaFile {
    id: string;
    path: string;
    type: MessageTypes;
}
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
export declare enum FireStoreCollection {
    users = "users",
    conversations = "conversations",
    messages = "messages"
}
export type FirestoreReference = any;
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    isOnline: boolean;
    lastSeen: Date;
    status?: 'online' | 'away' | 'busy' | 'offline';
}
export interface Message {
    id: string;
    text: string;
    userId: string;
    user: User;
    createdAt: Date;
    updatedAt?: Date;
    type: 'text' | 'image' | 'file' | 'system';
    status: 'sending' | 'sent' | 'delivered' | 'read';
    replyTo?: string;
    metadata?: {
        fileName?: string;
        fileSize?: number;
        fileType?: string;
        imageUrl?: string;
        thumbnailUrl?: string;
    };
}
export interface TypingUser {
    uid: string;
    displayName: string;
    timestamp: Date;
}
export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    type: 'direct' | 'group' | 'channel';
    participants: string[];
    admins: string[];
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
export interface ChatConfig {
    enableTypingIndicator: boolean;
    enableReadReceipts: boolean;
    enableFileUpload: boolean;
    enableImageUpload: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    maxMessageLength: number;
    enableEmojis: boolean;
    enableMarkdown: boolean;
    theme: 'light' | 'dark' | 'auto';
    dateFormat: string;
    timeFormat: string;
}
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
export interface SimpleUser {
    id: string;
    name: string;
    avatar?: string;
}
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
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}
export interface AuthState {
    user: FirebaseUser | null;
    loading: boolean;
    error: string | null;
}
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
