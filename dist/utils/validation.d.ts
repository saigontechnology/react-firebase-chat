import { MessageProps, ConversationProps } from '../types';
/**
 * Validation utilities matching RN-Firebase-Chat
 */
export declare const validateMessage: (message: Partial<MessageProps>) => boolean;
export declare const validateConversation: (conversation: Partial<ConversationProps>) => boolean;
export declare const validateUserId: (userId: string) => boolean;
export declare const validateConversationId: (conversationId: string) => boolean;
export declare const validateEmail: (email: string) => boolean;
export declare const validateFileExtension: (filename: string, allowedExtensions: string[]) => boolean;
export declare const validateFileSize: (fileSize: number, maxSize: number) => boolean;
export declare const validateMessageLength: (text: string, maxLength?: number) => boolean;
export declare const validateUserIds: (userIds: string[]) => boolean;
export declare const validateDate: (date: any) => boolean;
export declare const sanitizeText: (text: string) => string;
export declare const validateConversationName: (name: string) => {
    isValid: boolean;
    sanitized: string;
};
