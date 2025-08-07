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
  serverTimestamp,
  where,
  getDocs,
  getDoc,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseFirestore, getFirebaseStorage } from './firebase';
import {
  MessageProps,
  SendMessageProps,
  ConversationProps,
  LatestMessageProps,
  FireStoreCollection,
  MessageTypes,
  IUserInfo,
  EncryptionFunctions,
  ConversationData,
  IMessage,
  IConversation,
  IUser,
} from '../types';
import { validateMessage, validateConversation, validateUserId } from '../utils/validation';
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

  constructor(encryptionFunctions?: EncryptionFunctions) {
    this.db = getFirebaseFirestore();
    this.storage = getFirebaseStorage();
    this.encryptionFunctions = encryptionFunctions;
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
    title?: string,
    conversationId?: string
  ): Promise<string> {
    try {
      const conversationData = {
        members: memberIds,
        type,
        title: title || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null,
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
        await this.createUserIfNotExists(memberId);
        
        // Add conversation reference to user's conversations subcollection
        await setDoc(
          doc(this.db, COLLECTIONS.USERS, memberId, COLLECTIONS.CONVERSATIONS, docRefId),
          {
            joinedAt: serverTimestamp(),
            unreadCount: 0,
            updatedAt: serverTimestamp(),
            members: memberIds,
            title: memberIds || '',
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
   * Check if a user document exists in Firestore
   * @param userId - The ID of the user to check
   * @returns Promise<boolean> - True if user exists, false otherwise
   */
  private async userExists(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(
        doc(this.db, COLLECTIONS.USERS, userId)
      );
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Create a user document if it doesn't exist
   * @param userId - The ID of the user
   * @param userData - Optional user data to store
   * @returns Promise<void>
   */
  private async createUserIfNotExists(userId: string, userData?: any): Promise<void> {
    try {
      const userExists = await this.userExists(userId);
      
      if (!userExists) {
        await setDoc(
          doc(this.db, COLLECTIONS.USERS, userId),
          {
            id: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ...userData
          }
        );
        console.log(`User document ${userId} created successfully.`);
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      throw new Error('Failed to create user document');
    }
  }

  /**
   * Get an existing conversation or create a new one if it doesn't exist
   * @param conversationId - The ID of the conversation
   * @param memberIds - Array of member user IDs
   * @param initiatorId - The ID of the user creating the conversation
   * @param type - Type of conversation ('private' or 'group')
   * @param title - Optional title for the conversation
   * @returns Promise<string> - The conversation ID
   */
  async getOrCreateConversation(
    conversationId: string,
    memberIds: string[],
    initiatorId: string,
    type: 'private' | 'group' = 'private',
    title?: string
  ): Promise<string> {
    const exists = await this.conversationExists(conversationId);
    
    if (!exists) {
      return await this.createConversation(memberIds, initiatorId, type, title);
    }
    
    return conversationId;
  }

  /**
   * Send a message to a conversation. Creates the conversation if it doesn't exist.
   * @param conversationId - The ID of the conversation
   * @param message - The message to send (without _id and createdAt)
   * @param conversationOptions - Optional parameters for conversation creation if it doesn't exist
   * @returns Promise<void>
   */
  async sendMessage(
    conversationId: string,
    message: Omit<IMessage, '_id' | 'createdAt'>,
    conversationOptions?: {
      memberIds?: string[];
      type?: 'private' | 'group';
    }
  ): Promise<void> {
    try {
      // Check if conversation exists, create if it doesn't
      const conversationExists = await this.conversationExists(conversationId);
      
      if (!conversationExists) {        
        // Use provided options or defaults
        const memberIds = conversationOptions?.memberIds || [String(message.user._id)];
        const initiatorId = String(message.user._id);
        const type = conversationOptions?.type || 'private';
        
        // Create the conversation
        await this.createConversation(
          memberIds,
          initiatorId,
          type,
          '',
          conversationId,
        );
      }

      const messageData = {
        ...message,
        createdAt: serverTimestamp(),
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
          lastMessage: { ...messageData, _id: messageRef.id },
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      // Update unread counts for other members
      const conversationDoc = await getDoc(
        doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId)
      );

      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data();
        const otherMembers = conversation.members.filter(
          (memberId: string) => memberId !== message.user._id
        );

        const updatePromises = otherMembers.map(async (memberId: string) => {
          // Ensure user document exists
          await this.createUserIfNotExists(memberId);
          
          // Update unread count in user's conversations subcollection
          await setDoc(
            doc(this.db, COLLECTIONS.USERS, memberId, COLLECTIONS.CONVERSATIONS, conversationId),
            {
              unreadCount: increment(1),
              updatedAt: serverTimestamp(),
              lastMessage: convertToLatestMessage(`${message.user._id}`, message.user.name || '', message.text || ''),
            },
            { merge: true } // Merge with existing data if document exists
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
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          user: data.user,
          image: data.image,
          video: data.video,
          audio: data.audio,
          system: data.system,
          sent: data.sent,
          received: data.received,
          pending: data.pending,
          quickReplies: data.quickReplies,
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
    this.createUserIfNotExists(userId).catch(console.error);

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
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime ? new Date(data.lastMessageTime) : new Date(),
          unreadCount: data.unreadCount,
          title: data.title,
          type: data.type,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
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
    this.createUserIfNotExists(userId).catch(console.error);

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
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
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
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(typingDocRef, {
          [`${userId}`]: false,
          updatedAt: serverTimestamp(),
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
  async updateUnreadCount(conversationId: string, userId: string, count: number): Promise<void> {
    try {
      const conversationRef = doc(this.db, FireStoreCollection.conversations, conversationId);
      await updateDoc(conversationRef, {
        [`unRead.${userId}`]: count,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating unread count:', error);
      throw new Error('Failed to update unread count');
    }
  }

  // Upload file for message
  async uploadFile(file: File, conversationId: string): Promise<{ path: string; downloadURL: string }> {
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

      let processedUpdates = { ...updates };

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
        updatedAt: serverTimestamp(),
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
    lastMessageDoc?: DocumentSnapshot
  ): Promise<IMessage[]> {
    try {
      let messagesQuery = query(
        collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Add pagination if we have a starting point
      if (lastMessageDoc) {
        messagesQuery = query(
          collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
          orderBy('createdAt', 'desc'),
          startAfter(lastMessageDoc),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(messagesQuery);
      const messages: IMessage[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          _id: doc.id,
          text: data.text,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          user: data.user,
          image: data.image,
          video: data.video,
          audio: data.audio,
          system: data.system,
          sent: data.sent,
          received: data.received,
          pending: data.pending,
          quickReplies: data.quickReplies,
        } as IMessage);
      });

      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages with pagination:', error);
      throw error;
    }
  }
}
