import { MessageProps, LatestMessageProps } from '../types';
/**
 * Formatting utilities matching RN-Firebase-Chat
 */
export declare const formatTimestamp: (date: Date | string | number, format?: "time" | "date" | "datetime" | "relative") => string;
export declare const formatMessageText: (message: MessageProps) => string;
export declare const formatLatestMessage: (latestMessage: LatestMessageProps) => string;
export declare const formatFileSize: (bytes: number) => string;
export declare const formatFileExtension: (filename: string) => string;
export declare const formatUserDisplayName: (name: string | undefined | null, fallback?: string) => string;
export declare const formatConversationName: (name: string | undefined | null, members?: string[], currentUserId?: string) => string;
export declare const formatMessageStatus: (status: "sending" | "sent" | "delivered" | "read" | "failed") => string;
export declare const formatTypingIndicator: (userNames: string[]) => string;
export declare const formatUnreadCount: (count: number) => string;
export declare const formatConnectionStatus: (status: "connected" | "connecting" | "disconnected" | "error") => string;
export declare const truncateText: (text: string, maxLength?: number) => string;
export declare const formatDuration: (seconds: number) => string;
