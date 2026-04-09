import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
  getDoc,
  serverTimestamp,
  DocumentSnapshot,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseFirestore, getFirebaseStorage } from './firebase';
import { UserService } from './user';
import {
  ConversationProps,
  FireStoreCollection,
  IMessage,
  MediaType,
  StorageProvider,
} from '../types';
import { convertToLatestMessage } from '../utils/formatters';
import { filterBlackListWords } from '../utils/security';

/**
 * Chat service compatible with RN-Firebase-Chat implementation
 * Following the documentation specifications
 */
export class ChatService {
  static instance: ChatService;
  private db;
  private storage;
  private userService: UserService;

  /** Collection prefix for multi-environment support (matching rn-firebase-chat) */
  private prefix: string = '';

  /** Decryption cache: ciphertext -> plaintext (matching rn-firebase-chat) */
  private decryptCache = new Map<string, string>();

  /** Blacklist regex for word filtering */
  private blackListRegex?: RegExp;

  /** Custom storage provider */
  private storageProvider?: StorageProvider;

  constructor() {
    this.db = getFirebaseFirestore();
    this.storage = getFirebaseStorage();
    this.userService = UserService.getInstance();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /** Configure collection prefix (matching rn-firebase-chat) */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /** Get prefixed collection name */
  private getCollectionName(name: string): string {
    return this.prefix ? `${this.prefix}-${name}` : name;
  }

  /** Set custom storage provider (matching rn-firebase-chat) */
  setStorageProvider(provider: StorageProvider): void {
    this.storageProvider = provider;
  }

  /** Set blacklist regex for content filtering */
  setBlackListRegex(regex?: RegExp): void {
    this.blackListRegex = regex;
  }

  /** Cached decrypt — avoids re-decrypting the same ciphertext (matching rn-firebase-chat) */
  getCachedDecrypt(cipher: string): string | undefined {
    return this.decryptCache.get(cipher);
  }

  setCachedDecrypt(cipher: string, plain: string): void {
    this.decryptCache.set(cipher, plain);
  }

  clearDecryptCache(): void {
    this.decryptCache.clear();
  }

  // Collections getter with prefix support
  private get CONVERSATIONS() {
    return this.getCollectionName(FireStoreCollection.conversations);
  }

  private get MESSAGES() {
    return this.getCollectionName(FireStoreCollection.messages);
  }

  private get USERS() {
    return this.getCollectionName(FireStoreCollection.users);
  }

  // Create conversation (same logic as RN app) - as per documentation
  async createConversation(
    memberIds: string[],
    initiatorId: string,
    type: 'private' | 'group' = 'private',
    name?: string,
    otherName?: string,
    conversationId?: string,
    memberAvatars?: Record<string, string>,
  ): Promise<string> {
    try {
      // Per-user names: initiator sees otherName, others see initiator's name
      const names: Record<string, string> = {};
      const unRead: Record<string, number> = {};
      memberIds.forEach((id) => {
        names[id] = id === initiatorId ? (otherName || '') : (name || '');
        unRead[id] = 0;
      });

      const conversationData = {
        members: memberIds,
        type,
        names,
        unRead,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        latestMessage: null,
        latestMessageTime: null,
        createdBy: initiatorId,
      };

      let docRefId: string;

      if (conversationId) {
        await updateDoc(
          doc(this.db, this.CONVERSATIONS, conversationId),
          conversationData
        ).catch(async () => {
          await setDoc(
            doc(this.db, this.CONVERSATIONS, conversationId),
            conversationData
          );
        });
        docRefId = conversationId;
      } else {
        const docRef = await addDoc(
          collection(this.db, this.CONVERSATIONS),
          conversationData
        );
        docRefId = docRef.id;
      }

      // Ensure user documents exist for all members
      await Promise.all(memberIds.map((id) => this.userService.createUserIfNotExists(id)));

      return docRefId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  private async conversationExists(conversationId: string): Promise<boolean> {
    try {
      const conversationDoc = await getDoc(
        doc(this.db, this.CONVERSATIONS, conversationId)
      );
      return conversationDoc.exists();
    } catch (error) {
      console.error('Error checking conversation existence:', error);
      return false;
    }
  }

  async sendMessage(
    conversationId: string,
    message: Omit<IMessage, 'id' | 'createdAt' | 'user'>,
    conversationOptions?: {
      memberIds?: string[];
      type?: 'private' | 'group';
      name?: string;
      otherName?: string;
    }
  ): Promise<void> {
    try {
      const conversationExists = await this.conversationExists(conversationId);
      const memberIds = conversationOptions?.memberIds && conversationOptions.memberIds.length > 1
        ? conversationOptions.memberIds
        : [String(message.senderId)];

      if (!conversationExists) {
        const initiatorId = String(message.senderId);
        const type = conversationOptions?.type || 'private';

        await this.createConversation(
          memberIds,
          initiatorId,
          type,
          conversationOptions?.name,
          conversationOptions?.otherName,
          conversationId,
        );
      }

      // Apply blacklist filtering to message text
      const filteredText = this.blackListRegex
        ? filterBlackListWords(message.text || '', this.blackListRegex)
        : message.text;

      const messageData = {
        ...message,
        text: filteredText,
        createdAt: serverTimestamp(),
      };

      const messageRef = await addDoc(
        collection(this.db, this.CONVERSATIONS, conversationId, 'messages'),
        messageData
      );

      await updateDoc(
        doc(this.db, this.CONVERSATIONS, conversationId),
        {
          latestMessage: { ...messageData, id: messageRef.id },
          latestMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      // Update unread counts for other members on the conversation document
      const conversationDoc = await getDoc(
        doc(this.db, this.CONVERSATIONS, conversationId)
      );

      if (conversationDoc.exists()) {
        const allMembers: string[] = conversationDoc.data()?.members || memberIds;
        const unreadUpdates: Record<string, unknown> = {};
        allMembers.forEach((memberId: string) => {
          if (memberId !== message.senderId) {
            unreadUpdates[`unRead.${memberId}`] = increment(1);
          }
        });

        await updateDoc(
          doc(this.db, this.CONVERSATIONS, conversationId),
          {
            ...unreadUpdates,
            latestMessage: convertToLatestMessage(`${message.senderId}`, conversationOptions?.name || '', message.text || ''),
          }
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Listen to messages (real-time sync with mobile) - as per documentation
  subscribeToMessages(
    conversationId: string,
    callback: (messages: IMessage[], lastDoc?: DocumentSnapshot) => void,
    limitCount: number = 50
  ): () => void {
    const messagesQuery = query(
      collection(this.db, this.CONVERSATIONS, conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: IMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          createdAt: data.createdAt
            ? typeof data.createdAt.toMillis === 'function'
              ? data.createdAt.toMillis()
              : new Date(data.createdAt).valueOf()
            : Date.now(),
          text: data.text,
          image: data.type === MediaType.image ? data.path : undefined,
          video: data.type === MediaType.video ? data.path : undefined,
          audio: data.type === MediaType.voice ? data.path : undefined,
          system: data.type === MediaType.system ? data.system : undefined,
          sent: data.sent,
          received: data.received,
          pending: data.pending,
          senderId: data.senderId,
        } as IMessage);
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      callback(messages.reverse(), lastDoc);
    });
  }

  /**
   * Get user's conversations from the top-level /conversations collection
   * filtered by membership.
   * @param userId - The ID of the user
   * @param callback - Callback function to receive conversations
   * @returns Unsubscribe function
   */
  subscribeToUserConversations(
    userId: string,
    callback: (userConversations: ConversationProps[]) => void
  ): () => void {
    this.userService.createUserIfNotExists(userId).catch(console.error);

    const userConversationsQuery = query(
      collection(this.db, this.CONVERSATIONS),
      where('members', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(userConversationsQuery, (snapshot) => {
      const userConversations: ConversationProps[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const names: Record<string, string> = data.names || {};
        const unreadCounts: Record<string, number> = data.unRead || {};
        userConversations.push({
          id: docSnap.id,
          name: names[userId] || '',
          members: data.members || [],
          unRead: unreadCounts,
          updatedAt: data.updatedAt ? new Date(data.updatedAt).valueOf() : Date.now(),
          joinedAt: data.createdAt ? new Date(data.createdAt).valueOf() : Date.now(),
          latestMessage: data.latestMessage || undefined,
        });
      });
      callback(userConversations);
    });
  }

  // Update typing status
  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const conversationRef = doc(this.db, this.CONVERSATIONS, conversationId);
      const conversationDataRef = collection(conversationRef, 'data');
      const typingDocRef = doc(conversationDataRef, 'typing');

      await setDoc(typingDocRef, {
        [`${userId}`]: isTyping,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }

  // Subscribe to typing status
  subscribeToTypingStatus(
    conversationId: string,
    callback: (typingUsers: Record<string, boolean>) => void
  ): Unsubscribe {
    const conversationRef = doc(this.db, this.CONVERSATIONS, conversationId);
    const typingDocRef = doc(conversationRef, 'data', 'typing');

    return onSnapshot(typingDocRef, (snapshot) => {
      const data = snapshot.data();
      const typingUsers: Record<string, boolean> = {};

      if (data) {
        Object.keys(data).forEach(userId => {
          if (userId !== 'updatedAt' && data[userId] === true) {
            typingUsers[userId] = true;
          }
        });
      }

      callback(typingUsers);
    });
  }

  // Update unread count on the main conversation document
  async updateUnread(conversationId: string, userId: string): Promise<void> {
    try {
      await updateDoc(
        doc(this.db, this.CONVERSATIONS, conversationId),
        { [`unRead.${userId}`]: 0 }
      );
    } catch (error: any) {
      if (error?.code === 'not-found') {
        // Conversation document doesn't exist yet, we can safely ignore
        return;
      }
      console.error('Error updating unread count:', error);
      throw new Error('Failed to update unread count');
    }
  }

  // Upload file for message — uses storageProvider if set, otherwise Firebase Storage
  async uploadFile(file: File, conversationId: string): Promise<{ path: string; downloadURL: string }> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `conversations/${conversationId}/files/${fileName}`;

      if (this.storageProvider) {
        // Use Blob URL as local path for web
        const localPath = URL.createObjectURL(file);
        const result = await this.storageProvider.uploadFile(localPath, filePath);
        URL.revokeObjectURL(localPath);
        return { path: result.fullPath, downloadURL: result.downloadUrl };
      }

      const fileRef = ref(this.storage, filePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        path: filePath,
        downloadURL,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  // Delete message
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.db, this.CONVERSATIONS, conversationId, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  // Get messages with pagination support
  async getMessagesWithPagination(
    conversationId: string,
    limitCount: number = 50,
    latestMessageDoc?: DocumentSnapshot
  ): Promise<IMessage[]> {
    try {
      let messagesQuery = query(
        collection(this.db, this.CONVERSATIONS, conversationId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (latestMessageDoc) {
        messagesQuery = query(
          collection(this.db, this.CONVERSATIONS, conversationId, 'messages'),
          orderBy('createdAt', 'desc'),
          startAfter(latestMessageDoc),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(messagesQuery);
      const messages: IMessage[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          createdAt: data.createdAt
            ? typeof data.createdAt.toMillis === 'function'
              ? data.createdAt.toMillis()
              : new Date(data.createdAt).valueOf()
            : Date.now(),
          text: data.text,
          image: data.type === MediaType.image ? data.path : undefined,
          video: data.type === MediaType.video ? data.path : undefined,
          audio: data.type === MediaType.voice ? data.path : undefined,
          system: data.type === MediaType.system ? data.system : undefined,
          sent: data.sent,
          received: data.received,
          pending: data.pending,
          senderId: data.senderId,
        } as IMessage);
      });

      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages with pagination:', error);
      throw error;
    }
  }
}
