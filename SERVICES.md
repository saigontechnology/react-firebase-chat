# Services Documentation

This document provides detailed documentation for all services available in the `react-firebase-chat` library.

## Table of Contents

- [FirebaseService](#firebaseservice)
- [ChatService](#chatservice)
- [UserService](#userservice)
- [Service Usage Examples](#service-usage-examples)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## FirebaseService

The FirebaseService handles Firebase initialization and provides access to Firebase services.

### Methods

#### `initialize(config: FirebaseConfig): void`
Initializes Firebase with the provided configuration.

```typescript
import { initializeFirebase } from 'react-firebase-chat';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

initializeFirebase(firebaseConfig);
```

#### `getFirebaseFirestore(): Firestore`
Returns the Firestore instance.

```typescript
import { getFirebaseFirestore } from 'react-firebase-chat';

const db = getFirebaseFirestore();
```

#### `getFirebaseAuth(): Auth`
Returns the Firebase Auth instance.

```typescript
import { getFirebaseAuth } from 'react-firebase-chat';

const auth = getFirebaseAuth();
```

#### `getFirebaseStorage(): FirebaseStorage`
Returns the Firebase Storage instance.

```typescript
import { getFirebaseStorage } from 'react-firebase-chat';

const storage = getFirebaseStorage();
```

## ChatService

The ChatService handles all chat-related operations including conversations, messages, and real-time subscriptions.

### Methods

#### `getInstance(): ChatService`
Returns the singleton instance of ChatService.

```typescript
import { ChatService } from 'react-firebase-chat';

const chatService = ChatService.getInstance();
```

#### `createConversation(memberIds: string[], initiatorId: string, type?: 'private' | 'group', name?: string, conversationId?: string, otherName?: string): Promise<string>`
Creates a new conversation.

**Parameters:**
- `memberIds: string[]` - Array of member user IDs
- `initiatorId: string` - ID of the user creating the conversation
- `type?: 'private' | 'group'` - Type of conversation (default: 'private')
- `name?: string` - Optional name for the conversation
- `conversationId?: string` - Optional specific conversation ID
- `otherName?: string` - Optional name for other participants

**Returns:** `Promise<string>` - The conversation ID

```typescript
const conversationId = await chatService.createConversation(
  ['user1', 'user2'],
  'initiatorId',
  'private',
  'My Chat'
);
```

#### `sendMessage(conversationId: string, message: Omit<IMessage, 'id' | 'createdAt' | 'user'>, conversationOptions?: object): Promise<void>`
Sends a message to a conversation.

**Parameters:**
- `conversationId: string` - The conversation ID
- `message: Omit<IMessage, 'id' | 'createdAt' | 'user'>` - Message data
- `conversationOptions?: object` - Optional conversation creation options

```typescript
await chatService.sendMessage(conversationId, {
  text: 'Hello world!',
  type: MediaType.text,
  senderId: 'user123',
  readBy: { user123: true },
  path: '',
  extension: ''
}, {
  memberIds: ['user1', 'user2'],
  name: 'Chat Name'
});
```

#### `subscribeToMessages(conversationId: string, callback: (messages: IMessage[], lastDoc?: DocumentSnapshot) => void, limitCount?: number): () => void`
Subscribes to real-time message updates.

**Parameters:**
- `conversationId: string` - The conversation ID
- `callback: (messages: IMessage[], lastDoc?: DocumentSnapshot) => void` - Callback function
- `limitCount?: number` - Maximum number of messages to fetch (default: 50)

**Returns:** `() => void` - Unsubscribe function

```typescript
const unsubscribe = chatService.subscribeToMessages(
  conversationId,
  (messages, lastDoc) => {
    console.log('New messages:', messages);
    // Handle pagination with lastDoc
  },
  50
);

// Later, unsubscribe
unsubscribe();
```

#### `subscribeToUserConversations(userId: string, callback: (userConversations: any[]) => void): () => void`
Subscribes to user's conversation summaries.

```typescript
const unsubscribe = chatService.subscribeToUserConversations(
  'user123',
  (userConversations) => {
    console.log('User conversation summaries:', userConversations);
  }
);
```

#### `updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void>`
Updates typing status for a user in a conversation.

```typescript
await chatService.updateTypingStatus(conversationId, 'user123', true);
```

#### `subscribeToTypingStatus(conversationId: string, callback: (typingUsers: Record<string, boolean>) => void): Unsubscribe`
Subscribes to typing status updates.

```typescript
const unsubscribe = chatService.subscribeToTypingStatus(
  conversationId,
  (typingUsers) => {
    console.log('Users typing:', typingUsers);
  }
);
```

#### `updateUnread(conversationId: string, userId: string, count: number): Promise<void>`
Updates unread message count for a user.

```typescript
await chatService.updateUnread(conversationId, 'user123', 5);
```

#### `uploadFile(file: File, conversationId: string): Promise<{path: string; downloadURL: string}>`
Uploads a file to Firebase Storage.

```typescript
const result = await chatService.uploadFile(file, conversationId);
console.log('File uploaded:', result.downloadURL);
```

#### `deleteMessage(conversationId: string, messageId: string): Promise<void>`
Deletes a message.

```typescript
await chatService.deleteMessage(conversationId, 'message123');
```

#### `getMessagesWithPagination(conversationId: string, limitCount?: number, latestMessageDoc?: DocumentSnapshot): Promise<IMessage[]>`
Gets messages with pagination support.

```typescript
const messages = await chatService.getMessagesWithPagination(
  conversationId,
  50,
  lastDocument
);
```

## UserService

The UserService handles user-related operations.

### Methods

#### `getInstance(): UserService`
Returns the singleton instance of UserService.

```typescript
import { UserService } from 'react-firebase-chat';

const userService = UserService.getInstance();
```

#### `userExists(userId: string): Promise<boolean>`
Checks if a user document exists.

```typescript
const exists = await userService.userExists('user123');
```

#### `createUserIfNotExists(userId: string, userData?: Partial<IUserInfo & Pick<UserProfileProps, 'status'>> & Record<string, unknown>): Promise<void>`
Creates a user document if it doesn't exist.

```typescript
await userService.createUserIfNotExists('user123', {
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  status: UserStatus.online
});
```

#### `getAllUsers(): Promise<IUserInfo[]>`
Gets all users from the users collection.

```typescript
const users = await userService.getAllUsers();
```

## Service Usage Examples

### Basic Chat Implementation

```typescript
import { ChatService, UserService, initializeFirebase } from 'react-firebase-chat';

// Initialize Firebase
initializeFirebase(firebaseConfig);

// Get service instances
const chatService = ChatService.getInstance();
const userService = UserService.getInstance();

// Create users
await userService.createUserIfNotExists('user1', { name: 'Alice' });
await userService.createUserIfNotExists('user2', { name: 'Bob' });

// Create conversation
const conversationId = await chatService.createConversation(
  ['user1', 'user2'],
  'user1',
  'private'
);

// Send message
await chatService.sendMessage(conversationId, {
  text: 'Hello Bob!',
  type: MediaType.text,
  senderId: 'user1',
  readBy: { user1: true },
  path: '',
  extension: ''
});

// Subscribe to messages
const unsubscribe = chatService.subscribeToMessages(
  conversationId,
  (messages) => {
    console.log('Messages:', messages);
  }
);
```

### Advanced Usage with Error Handling

```typescript
import { ChatService, IMessage, MediaType } from 'react-firebase-chat';

class ChatManager {
  private chatService: ChatService;

  constructor() {
    this.chatService = ChatService.getInstance();
  }

  async sendMessageWithRetry(
    conversationId: string,
    text: string,
    senderId: string,
    maxRetries: number = 3
  ): Promise<void> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        await this.chatService.sendMessage(conversationId, {
          text,
          type: MediaType.text,
          senderId,
          readBy: { [senderId]: true },
          path: '',
          extension: ''
        });
        return; // Success
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw new Error(`Failed to send message after ${maxRetries} attempts: ${error.message}`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  }

  async createGroupChat(
    memberIds: string[],
    initiatorId: string,
    groupName: string
  ): Promise<string> {
    try {
      // Ensure all users exist
      await Promise.all(
        memberIds.map(userId => 
          this.chatService.userService.createUserIfNotExists(userId)
        )
      );

      // Create group conversation
      return await this.chatService.createConversation(
        memberIds,
        initiatorId,
        'group',
        groupName
      );
    } catch (error) {
      throw new Error(`Failed to create group chat: ${error.message}`);
    }
  }
}
```

### Real-time Message Monitoring

```typescript
import { ChatService, IMessage } from 'react-firebase-chat';

class MessageMonitor {
  private chatService: ChatService;
  private subscriptions: Map<string, () => void> = new Map();

  constructor() {
    this.chatService = ChatService.getInstance();
  }

  startMonitoring(conversationId: string): void {
    const unsubscribe = this.chatService.subscribeToMessages(
      conversationId,
      (messages: IMessage[]) => {
        this.handleNewMessages(messages);
      }
    );

    this.subscriptions.set(conversationId, unsubscribe);
  }

  stopMonitoring(conversationId: string): void {
    const unsubscribe = this.subscriptions.get(conversationId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(conversationId);
    }
  }

  private handleNewMessages(messages: IMessage[]): void {
    messages.forEach(message => {
      console.log(`New message from ${message.senderId}: ${message.text}`);
      
      // Custom logic here
      if (message.text?.includes('@me')) {
        this.handleMention(message);
      }
    });
  }

  private handleMention(message: IMessage): void {
    console.log('You were mentioned in a message!');
    // Show notification, update UI, etc.
  }

  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}
```

## Error Handling

All service methods can throw errors. Here's how to handle them properly:

```typescript
import { ChatService } from 'react-firebase-chat';

const chatService = ChatService.getInstance();

try {
  await chatService.sendMessage(conversationId, messageData);
} catch (error) {
  if (error.message.includes('permission-denied')) {
    console.error('Permission denied: Check Firestore rules');
  } else if (error.message.includes('not-found')) {
    console.error('Conversation not found');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Type Definitions

### Core Types

```typescript
interface IMessage {
  id: string;
  text?: string;
  createdAt: number;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  senderId?: string;
  type?: MediaType;
  readBy?: Record<string, boolean>;
}

interface IConversation {
  id: string;
  members: string[];
  latestMessage?: IMessage;
  latestMessageTime?: number;
  unRead?: number;
  title?: string;
  type: 'private' | 'group';
  createdAt: number;
  updatedAt: number;
}

interface IUser {
  id: string | number;
  name?: string;
  avatar?: string;
}

enum MediaType {
  text = 'text',
  image = 'image',
  voice = 'voice',
  video = 'video',
  file = 'file',
  system = 'system'
}
```

### Service Configuration

```typescript
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface EncryptionFunctions {
  generateKeyFunctionProp?: (key: string) => Promise<string>;
  encryptFunctionProp?: (text: string) => Promise<string>;
  decryptFunctionProp?: (text: string) => Promise<string>;
}
```

## Best Practices

1. **Always use try-catch blocks** when calling service methods
2. **Unsubscribe from listeners** to prevent memory leaks
3. **Check if Firebase is initialized** before using services
4. **Handle offline scenarios** gracefully
5. **Use pagination** for large message lists
6. **Implement retry logic** for critical operations
7. **Validate input data** before sending to services

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" error**
   - Ensure `initializeFirebase()` is called before using services
   - Check that Firebase config is valid

2. **Permission denied errors**
   - Verify Firestore security rules
   - Check user authentication status

3. **Memory leaks from subscriptions**
   - Always call unsubscribe functions
   - Clean up subscriptions in component unmount

4. **Messages not appearing**
   - Check conversation ID is correct
   - Verify user is a member of the conversation
   - Check Firestore rules allow read access
