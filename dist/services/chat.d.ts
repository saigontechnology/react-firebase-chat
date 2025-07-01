import { DocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import { MessageProps, EncryptionFunctions, IMessage, IConversation } from '../types';
export declare const COLLECTIONS: {
    readonly CONVERSATIONS: "conversations";
    readonly MESSAGES: "messages";
    readonly USERS: "users";
    readonly USER_CONVERSATIONS: "userConversations";
};
/**
 * Chat service compatible with RN-Firebase-Chat implementation
 * Following the documentation specifications
 */
export declare class ChatService {
    private db;
    private storage;
    private encryptionFunctions?;
    constructor(encryptionFunctions?: EncryptionFunctions);
    createConversation(memberIds: string[], initiatorId: string, type?: 'private' | 'group', title?: string): Promise<string>;
    sendMessage(conversationId: string, message: Omit<IMessage, '_id' | 'createdAt'>): Promise<void>;
    subscribeToMessages(conversationId: string, callback: (messages: IMessage[], lastDoc?: DocumentSnapshot) => void, limitCount?: number): () => void;
    subscribeToConversations(userId: string, callback: (conversations: IConversation[]) => void): () => void;
    updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void>;
    subscribeToTypingStatus(conversationId: string, callback: (typingUsers: Record<string, boolean>) => void): Unsubscribe;
    updateUnreadCount(conversationId: string, userId: string, count: number): Promise<void>;
    uploadFile(file: File, conversationId: string): Promise<{
        path: string;
        downloadURL: string;
    }>;
    deleteMessage(conversationId: string, messageId: string): Promise<void>;
    updateMessage(conversationId: string, messageId: string, updates: Partial<MessageProps>): Promise<void>;
    getMessagesWithPagination(conversationId: string, limitCount?: number, lastMessageDoc?: DocumentSnapshot): Promise<IMessage[]>;
}
