import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, onSnapshot, serverTimestamp, where, getDocs, getDoc, increment, } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseFirestore, getFirebaseStorage } from './firebase';
import { FireStoreCollection, } from '../types';
// Collections as per documentation
export const COLLECTIONS = {
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    USERS: 'users',
    USER_CONVERSATIONS: 'userConversations'
};
/**
 * Chat service compatible with RN-Firebase-Chat implementation
 * Following the documentation specifications
 */
export class ChatService {
    constructor(encryptionFunctions) {
        this.db = getFirebaseFirestore();
        this.storage = getFirebaseStorage();
        this.encryptionFunctions = encryptionFunctions;
    }
    // Create conversation (same logic as RN app) - as per documentation
    async createConversation(memberIds, initiatorId, type = 'private', title) {
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
            const docRef = await addDoc(collection(this.db, COLLECTIONS.CONVERSATIONS), conversationData);
            // Create user conversation references for each member
            const promises = memberIds.map(memberId => updateDoc(doc(this.db, COLLECTIONS.USER_CONVERSATIONS, memberId), {
                [`conversations.${docRef.id}`]: {
                    conversationId: docRef.id,
                    joinedAt: serverTimestamp(),
                    unreadCount: 0
                }
            }));
            await Promise.all(promises);
            return docRef.id;
        }
        catch (error) {
            console.error('Error creating conversation:', error);
            throw new Error('Failed to create conversation');
        }
    }
    // Send message (identical to RN app logic) - as per documentation
    async sendMessage(conversationId, message) {
        try {
            const messageData = {
                ...message,
                createdAt: serverTimestamp(),
                _id: undefined // Let Firestore generate the ID
            };
            // Add message to conversation
            const messageRef = await addDoc(collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES), messageData);
            // Update conversation with last message
            await updateDoc(doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId), {
                lastMessage: { ...messageData, _id: messageRef.id },
                lastMessageTime: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            // Update unread counts for other members
            const conversationDoc = await getDoc(doc(this.db, COLLECTIONS.CONVERSATIONS, conversationId));
            if (conversationDoc.exists()) {
                const conversation = conversationDoc.data();
                const otherMembers = conversation.members.filter((memberId) => memberId !== message.user._id);
                const updatePromises = otherMembers.map((memberId) => updateDoc(doc(this.db, COLLECTIONS.USER_CONVERSATIONS, memberId), {
                    [`conversations.${conversationId}.unreadCount`]: increment(1)
                }));
                await Promise.all(updatePromises);
            }
        }
        catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }
    // Listen to messages (real-time sync with mobile) - as per documentation
    subscribeToMessages(conversationId, callback, limitCount = 50) {
        const messagesQuery = query(collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES), orderBy('createdAt', 'desc'), limit(limitCount));
        return onSnapshot(messagesQuery, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                var _a;
                const data = doc.data();
                messages.push({
                    _id: doc.id,
                    text: data.text,
                    createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(),
                    user: data.user,
                    image: data.image,
                    video: data.video,
                    audio: data.audio,
                    system: data.system,
                    sent: data.sent,
                    received: data.received,
                    pending: data.pending,
                    quickReplies: data.quickReplies,
                });
            });
            // Get the last document for pagination
            const lastDoc = snapshot.docs[snapshot.docs.length - 1];
            callback(messages.reverse(), lastDoc);
        });
    }
    // Listen to conversations - as per documentation
    subscribeToConversations(userId, callback) {
        const conversationsQuery = query(collection(this.db, COLLECTIONS.CONVERSATIONS), where('members', 'array-contains', userId), orderBy('updatedAt', 'desc'));
        return onSnapshot(conversationsQuery, (snapshot) => {
            const conversations = [];
            snapshot.forEach((doc) => {
                var _a, _b, _c;
                const data = doc.data();
                conversations.push({
                    id: doc.id,
                    members: data.members,
                    lastMessage: data.lastMessage,
                    lastMessageTime: (_a = data.lastMessageTime) === null || _a === void 0 ? void 0 : _a.toDate(),
                    unreadCount: data.unreadCount,
                    title: data.title,
                    type: data.type,
                    createdAt: ((_b = data.createdAt) === null || _b === void 0 ? void 0 : _b.toDate()) || new Date(),
                    updatedAt: ((_c = data.updatedAt) === null || _c === void 0 ? void 0 : _c.toDate()) || new Date(),
                });
            });
            callback(conversations);
        });
    }
    // Update typing status
    async updateTypingStatus(conversationId, userId, isTyping) {
        try {
            const conversationRef = doc(this.db, FireStoreCollection.conversations, conversationId);
            const conversationDataRef = collection(conversationRef, 'data');
            const typingDocRef = doc(conversationDataRef, 'typing');
            if (isTyping) {
                await updateDoc(typingDocRef, {
                    [`${userId}`]: true,
                    updatedAt: serverTimestamp(),
                });
            }
            else {
                await updateDoc(typingDocRef, {
                    [`${userId}`]: false,
                    updatedAt: serverTimestamp(),
                });
            }
        }
        catch (error) {
            console.error('Error updating typing status:', error);
            // Don't throw error for typing status as it's not critical
        }
    }
    // Subscribe to typing status
    subscribeToTypingStatus(conversationId, callback) {
        const conversationRef = doc(this.db, FireStoreCollection.conversations, conversationId);
        const typingDocRef = doc(conversationRef, 'data', 'typing');
        return onSnapshot(typingDocRef, (snapshot) => {
            const data = snapshot.data();
            const typingUsers = {};
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
    async updateUnreadCount(conversationId, userId, count) {
        try {
            const conversationRef = doc(this.db, FireStoreCollection.conversations, conversationId);
            await updateDoc(conversationRef, {
                [`unRead.${userId}`]: count,
                updatedAt: serverTimestamp(),
            });
        }
        catch (error) {
            console.error('Error updating unread count:', error);
            throw new Error('Failed to update unread count');
        }
    }
    // Upload file for message
    async uploadFile(file, conversationId) {
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
        }
        catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file');
        }
    }
    // Delete message
    async deleteMessage(conversationId, messageId) {
        try {
            const messageRef = doc(this.db, FireStoreCollection.conversations, conversationId, FireStoreCollection.messages, messageId);
            await deleteDoc(messageRef);
        }
        catch (error) {
            console.error('Error deleting message:', error);
            throw new Error('Failed to delete message');
        }
    }
    // Update message
    async updateMessage(conversationId, messageId, updates) {
        var _a;
        try {
            const messageRef = doc(this.db, FireStoreCollection.conversations, conversationId, FireStoreCollection.messages, messageId);
            let processedUpdates = { ...updates };
            // Encrypt text if encryption is enabled
            if (((_a = this.encryptionFunctions) === null || _a === void 0 ? void 0 : _a.encryptFunctionProp) && updates.text) {
                try {
                    processedUpdates.text = await this.encryptionFunctions.encryptFunctionProp(updates.text);
                }
                catch (error) {
                    console.error('Encryption failed:', error);
                    // Continue without encryption if it fails
                }
            }
            await updateDoc(messageRef, {
                ...processedUpdates,
                updatedAt: serverTimestamp(),
            });
        }
        catch (error) {
            console.error('Error updating message:', error);
            throw new Error('Failed to update message');
        }
    }
    // Get messages with pagination support - for loadMore functionality
    async getMessagesWithPagination(conversationId, limitCount = 50, lastMessageDoc) {
        try {
            let messagesQuery = query(collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES), orderBy('createdAt', 'desc'), limit(limitCount));
            // Add pagination if we have a starting point
            if (lastMessageDoc) {
                messagesQuery = query(collection(this.db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES), orderBy('createdAt', 'desc'), startAfter(lastMessageDoc), limit(limitCount));
            }
            const snapshot = await getDocs(messagesQuery);
            const messages = [];
            snapshot.forEach((doc) => {
                var _a;
                const data = doc.data();
                messages.push({
                    _id: doc.id,
                    text: data.text,
                    createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(),
                    user: data.user,
                    image: data.image,
                    video: data.video,
                    audio: data.audio,
                    system: data.system,
                    sent: data.sent,
                    received: data.received,
                    pending: data.pending,
                    quickReplies: data.quickReplies,
                });
            });
            return messages.reverse();
        }
        catch (error) {
            console.error('Error getting messages with pagination:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=chat.js.map