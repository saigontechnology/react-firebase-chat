import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  where,
  getDocs,
  getDoc,
  DocumentSnapshot,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import {ref, uploadBytes, getDownloadURL} from 'firebase/storage';
import {getFirebaseFirestore, getFirebaseStorage} from './firebase';
import {UserService} from './user';
import {
  MessageProps,
  FireStoreCollection,
  EncryptionFunctions,
  IMessage,
  IConversation,
  MediaType,
} from '../types';
import {convertToLatestMessage} from '../utils/formatters';

// Collections as per documentation
export const COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  USERS: 'users'
} as const;

/**
 * Chat service compatible with RN-Firebase-Chat implementation
 * Following the documentation specifications
 */
export class ChatService {
  static instance: ChatService;
  private db;
  private storage;
  private encryptionFunctions?: EncryptionFunctions;
  private userService: UserService;

  constructor(encryptionFunctions?: EncryptionFunctions) {
    this.db = getFirebaseFirestore();
    this.storage = getFirebaseStorage();
    this.encryptionFunctions = encryptionFunctions;
    this.userService = UserService.getInstance();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Create conversation (same logic as RN app) - as per documentation
  async createConversation(
    memberIds: string[],
    initiatorId: string,
    type: 'private' | 'group' = 'private',
    name?: string,
    conversationId?: string,
    otherName?: string,
  ): Promise<string> {
    try {
      const conversationData = {
        members: memberIds,
        type,
        name: otherName || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        latestMessage: null,
        latestMessageTime: null,
        createdBy: initiatorId
      };

      let docRefId: string;

      if (conversationId) {
        // Create the document with the specified conversationId
        await updateDoc(
          doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId),
          conversationData
        ).catch(async (err) => {
          // If doc does not exist, set it
          await setDoc(
            doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId),
            conversationData
          );
        });
        docRefId = conversationId;
      } else {
        // Add a new document with auto-generated ID
        const docRef = await addDoc(
          collection(this.db, COLLECTIONS.CONVERSATIONS),
          conversationData
        );
        docRefId = docRef.id;
      }

      // Create user conversation references for each member
      const promises = memberIds.map(async (memberId) => {
        // Ensure user document exists
        await this.userService.createUserIfNotExists(memberId);
        const otherMember = memberIds.filter(id => id !== memberId);

        // Add conversation reference to user's conversations subcollection
        await setDoc(
          doc(this.db, COLLECTIONS.USERS, memberId, COLLECTIONS.CONVERSATIONS, docRefId),
          {
            joinedAt: Date.now(),
            unRead: 0,
            updatedAt: Date.now(),
            members: memberIds,
            name: name || '',
          }
        );
      });

      await Promise.all(promises);
      return docRefId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Check if a conversation exists in Firestore
   * @param conversationId - The ID of the conversation to check
   * @returns Promise<boolean> - True if conversation exists, false otherwise
   */
  private async conversationExists(conversationId: string): Promise<boolean> {
    try {
      const conversationDoc = await getDoc(
        doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId)
      );
      return conversationDoc.exists();
    } catch (error) {
      console.error('Error checking conversation existence:', error);
      return false;
    }
  }

  /**
   * Get an existing conversation or create a new one if it doesn't exist
   * @param conversationId - The ID of the conversation
   * @param memberIds - Array of member user IDs
   * @param initiatorId - The ID of the user creating the conversation
   * @param type - Type of conversation ('private' or 'group')
   * @param name - Optional name for the conversation
   * @returns Promise<string> - The conversation ID
   */
  async getOrCreateConversation(
    conversationId: string,
    memberIds: string[],
    initiatorId: string,
    type: 'private' | 'group' = 'private',
    name?: string
  ): Promise<string> {
    const exists = await this.conversationExists(conversationId);

    if (!exists) {
      return await this.createConversation(memberIds, initiatorId, type, name);
    }

    return conversationId;
  }

  /**
   * Send a message to a conversation. Creates the conversation if it doesn't exist.
   * @param conversationId - The ID of the conversation
   * @param message - The message to send (without id and createdAt)
   * @param conversationOptions - Optional parameters for conversation creation if it doesn't exist
   * @returns Promise<void>
   */
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
      // Check if conversation exists, create if it doesn't
      const conversationExists = await this.conversationExists(conversationId);
      const memberIds = conversationOptions?.memberIds || [String(message.senderId)];

      if (!conversationExists) {
        // Use provided options or defaults
        const initiatorId = String(message.senderId);
        const type = conversationOptions?.type || 'private';

        // Create the conversation
        await this.createConversation(
          memberIds,
          initiatorId,
          type,
          conversationOptions?.name,
          conversationId,
          conversationOptions?.otherName,
        );
      }

      const messageData = {
        ...message,
        createdAt: Date.now(),
      };

      // Add message to conversation
      const messageRef = await addDoc(
        collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
        messageData
      );

      // Update conversation with last message
      await updateDoc(
        doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId),
        {
          latestMessage: {...messageData, id: messageRef.id},
          latestMessageTime: Date.now(),
          updatedAt: Date.now(),
        }
      );

      // Update unread counts for other members
      const conversationDoc = await getDoc(
        doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId)
      );

      if (conversationDoc.exists()) {
        const otherMembers = memberIds.filter(
          (memberId: string) => memberId !== message.senderId
        );

        const updatePromises = otherMembers.map(async (memberId: string) => {
          // Ensure user document exists
          await this.userService.createUserIfNotExists(memberId);

          // Update unread count in user's conversations subcollection
          await setDoc(
            doc(this.db, COLLECTIONS.USERS, memberId, COLLECTIONS.CONVERSATIONS, conversationId),
            {
              unRead: increment(1),
              updatedAt: Date.now(),
              latestMessage: convertToLatestMessage(`${message.senderId}`, conversationOptions?.name || '', message.text || ''),
            },
            {merge: true} // Merge with existing data if document exists
          );
        });

        await Promise.all(updatePromises);
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
      collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: IMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          createdAt: data.createdAt ? new Date(data.createdAt).valueOf() : Date.now(),
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

      // Get the last document for pagination
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      callback(messages.reverse(), lastDoc);
    });
  }

  // Listen to conversations - as per documentation
  subscribeToConversations(
    userId: string,
    callback: (conversations: IConversation[]) => void
  ): () => void {
    // First ensure user document exists
    this.userService.createUserIfNotExists(userId).catch(console.error);

    const conversationsQuery = query(
      collection(this.db, COLLECTIONS.CONVERSATIONS),
      where('members', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(conversationsQuery, (snapshot) => {
      const conversations: IConversation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          members: data.members,
          latestMessage: data.latestMessage,
          latestMessageTime: data.latestMessageTime ? new Date(data.latestMessageTime).valueOf() : Date.now(),
          unRead: data.unRead,
          name: data.name,
          type: data.type,
          createdAt: data.createdAt ? new Date(data.createdAt).valueOf() : Date.now(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt).valueOf() : Date.now(),
        } as IConversation);
      });
      callback(conversations);
    });
  }

  /**
   * Get user's conversations from the user's conversations subcollection
   * @param userId - The ID of the user
   * @param callback - Callback function to receive conversations
   * @returns Unsubscribe function
   */
  subscribeToUserConversations(
    userId: string,
    callback: (userConversations: any[]) => void
  ): () => void {
    // First ensure user document exists
    this.userService.createUserIfNotExists(userId).catch(console.error);

    const userConversationsQuery = query(
      collection(this.db, COLLECTIONS.USERS, userId, 'conversations'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(userConversationsQuery, (snapshot) => {
      const userConversations: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        userConversations.push({
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt ? new Date(data.updatedAt).valueOf() : Date.now(),
          joinedAt: data.joinedAt ? new Date(data.joinedAt).valueOf() : Date.now(),
        });
      });
      callback(userConversations);
    });
  }

  // Update typing status
  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const conversationRef = doc(this.db, FireStoreCollection.conversations, conversationId);
      const conversationDataRef = collection(conversationRef, 'data');
      const typingDocRef = doc(conversationDataRef, 'typing');

      if (isTyping) {
        await updateDoc(typingDocRef, {
          [`${userId}`]: true,
          updatedAt: Date.now(),
        });
      } else {
        await updateDoc(typingDocRef, {
          [`${userId}`]: false,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
      // Don't throw error for typing status as it's not critical
    }
  }

  // Subscribe to typing status
  subscribeToTypingStatus(
    conversationId: string,
    callback: (typingUsers: Record<string, boolean>) => void
  ): Unsubscribe {
    const conversationRef = doc(this.db, FireStoreCollection.conversations, conversationId);
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

  // Update unread count
  async updateunRead(conversationId: string, userId: string, count: number): Promise<void> {
    try {
      const conversationRef = doc(this.db, FireStoreCollection.conversations, conversationId);
      await updateDoc(conversationRef, {
        [`unRead.${userId}`]: count,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating unread count:', error);
      throw new Error('Failed to update unread count');
    }
  }

  // Upload file for message
  async uploadFile(file: File, conversationId: string): Promise<{path: string; downloadURL: string}> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `conversations/${conversationId}/files/${fileName}`;
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
      const messageRef = doc(this.db, FireStoreCollection.conversations, conversationId, FireStoreCollection.messages, messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  // Update message
  async updateMessage(conversationId: string, messageId: string, updates: Partial<MessageProps>): Promise<void> {
    try {
      const messageRef = doc(this.db, FireStoreCollection.conversations, conversationId, FireStoreCollection.messages, messageId);

      let processedUpdates = {...updates};

      // Encrypt text if encryption is enabled
      if (this.encryptionFunctions?.encryptFunctionProp && updates.text) {
        try {
          processedUpdates.text = await this.encryptionFunctions.encryptFunctionProp(updates.text);
        } catch (error) {
          console.error('Encryption failed:', error);
          // Continue without encryption if it fails
        }
      }

      await updateDoc(messageRef, {
        ...processedUpdates,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }
  }

  // Get messages with pagination support - for loadMore functionality
  async getMessagesWithPagination(
    conversationId: string,
    limitCount: number = 50,
    latestMessageDoc?: DocumentSnapshot
  ): Promise<IMessage[]> {
    try {
      let messagesQuery = query(
        collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Add pagination if we have a starting point
      if (latestMessageDoc) {
        messagesQuery = query(
          collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
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
          createdAt: data.createdAt ? new Date(data.createdAt).valueOf() : Date.now(),
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
