# ReactJS Companion Library Documentation

This document provides a comprehensive guide to create a separate ReactJS companion library (`rn-firebase-chat-web`) that communicates seamlessly with your existing React Native Firebase chat application.

## Overview

The goal is to build a standalone ReactJS library that:
- Shares the same Firebase backend with the React Native app
- Maintains data compatibility and synchronization
- Provides a similar API interface for easy adoption
- Ensures real-time communication between web and mobile users

## Project Structure for New ReactJS Library

```
rn-firebase-chat-web/
├── src/
│   ├── components/           # Web-specific chat components
│   │   ├── ChatProvider/
│   │   ├── ChatScreen/
│   │   ├── MessageList/
│   │   ├── InputToolbar/
│   │   └── index.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useChat.ts
│   │   ├── useMessages.ts
│   │   ├── useConversations.ts
│   │   └── index.ts
│   ├── services/            # Firebase and API services
│   │   ├── firebase/
│   │   ├── encryption/
│   │   └── index.ts
│   ├── types/               # TypeScript interfaces
│   │   ├── chat.ts
│   │   ├── message.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── dateFormatter.ts
│   │   ├── messageUtils.ts
│   │   └── index.ts
│   ├── styles/              # CSS/styled-components
│   │   ├── components/
│   │   ├── globals.css
│   │   └── index.ts
│   ├── addons/              # Web-specific addons
│   │   ├── camera/         # Web camera implementation
│   │   │   ├── CameraView.tsx
│   │   │   ├── useCamera.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── fileUpload/     # File upload handling
│   │   │   ├── FileUploader.tsx
│   │   │   ├── useFileUpload.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── gallery/        # Gallery/media viewer
│   │   │   ├── GalleryView.tsx
│   │   │   ├── MediaViewer.tsx
│   │   │   ├── useGallery.ts
│   │   │   └── index.ts
│   │   └── index.ts        # Export all addons
│   └── index.ts             # Main export file
├── package.json
├── tsconfig.json
├── webpack.config.js
├── README.md
└── examples/
    ├── basic-chat/
    ├── custom-components/
    └── integration-guide/
```

## Data Schema Compatibility

### Ensure identical data structures between React Native and Web

```typescript
// src/types/message.ts - Must match RN app exactly
export interface IMessage {
  id: string;
  createdAt: Date | number;
  text?: string;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  senderId?: string
}

export interface IUser {
  id: string | number;
  name?: string;
  avatar?: string;
}

export interface IConversation {
  id: string;
  members: string[];
  latestMessage?: IMessage;
  latestMessageTime?: Date;
  unRead?: number;
  name?: string;
  type: 'private' | 'group';
  createdAt: Date;
  updatedAt: Date;
}
```

### Firestore Collection Structure (Same as RN app)

```typescript
// src/services/firebase/collections.ts
export const COLLECTIONS = {
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  USERS: 'users',
  USER_CONVERSATIONS: 'userConversations'
} as const;

// Collection structure must match exactly:
// conversations/{conversationId}
// conversations/{conversationId}/messages/{messageId}
// users/{userId}
// userConversations/{userId}/conversations/{conversationId}
```

## Firebase Web SDK Implementation

### Firebase Configuration Service

```typescript
// src/services/firebase/config.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

class FirebaseWebService {
  private static instance: FirebaseWebService;
  private app: FirebaseApp | null = null;
  private firestore: Firestore | null = null;
  private storage: FirebaseStorage | null = null;
  private auth: Auth | null = null;

  private constructor() {}

  static getInstance(): FirebaseWebService {
    if (!FirebaseWebService.instance) {
      FirebaseWebService.instance = new FirebaseWebService();
    }
    return FirebaseWebService.instance;
  }

  initialize(config: FirebaseConfig): void {
    if (!this.app) {
      this.app = initializeApp(config);
      this.firestore = getFirestore(this.app);
      this.storage = getStorage(this.app);
      this.auth = getAuth(this.app);
    }
  }

  getFirestore(): Firestore {
    if (!this.firestore) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.firestore;
  }

  getStorage(): FirebaseStorage {
    if (!this.storage) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  getAuth(): Auth {
    if (!this.auth) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return this.auth;
  }
}

export default FirebaseWebService;
```

### Chat Service (Compatible with RN app)

```typescript
// src/services/firebase/chatService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  increment
} from 'firebase/firestore';
import FirebaseWebService from './config';
import { IMessage, IConversation, IUser } from '../../types';
import { COLLECTIONS } from './collections';

export class ChatService {
  private firestore = FirebaseWebService.getInstance().getFirestore();

  // Create conversation (same logic as RN app)
  async createConversation(
    memberIds: string[],
    initiatorId: string,
    type: 'private' | 'group' = 'private',
    name?: string
  ): Promise<string> {
    const conversationData = {
      members: memberIds,
      type,
      name: name || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      latestMessage: null,
      latestMessageTime: null,
      createdBy: initiatorId
    };

    const docRef = await addDoc(
      collection(this.firestore, COLLECTIONS.CONVERSATIONS),
      conversationData
    );

    // Create user conversation references for each member
    const promises = memberIds.map(memberId =>
      updateDoc(
        doc(this.firestore, COLLECTIONS.USER_CONVERSATIONS, memberId),
        {
          [`conversations.${docRef.id}`]: {
            conversationId: docRef.id,
            joinedAt: serverTimestamp(),
            unRead: 0
          }
        }
      )
    );

    await Promise.all(promises);
    return docRef.id;
  }

  // Send message (identical to RN app logic)
  async sendMessage(
    conversationId: string,
    message: Omit<IMessage, 'id' | 'createdAt'>
  ): Promise<void> {
    const messageData = {
      ...message,
      createdAt: serverTimestamp(),
      id: undefined // Let Firestore generate the ID
    };

    // Add message to conversation
    const messageRef = await addDoc(
      collection(this.firestore, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
      messageData
    );

    // Update conversation with last message
    await updateDoc(
      doc(this.firestore, COLLECTIONS.CONVERSATIONS, conversationId),
      {
        latestMessage: { ...messageData, id: messageRef.id },
        latestMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );

    // Update unread counts for other members
    const conversationDoc = await getDoc(
      doc(this.firestore, COLLECTIONS.CONVERSATIONS, conversationId)
    );
    
    if (conversationDoc.exists()) {
      const conversation = conversationDoc.data();
      const otherMembers = conversation.members.filter(
        (memberId: string) => memberId !== message.user.id
      );

      const updatePromises = otherMembers.map((memberId: string) =>
        updateDoc(
          doc(this.firestore, COLLECTIONS.USER_CONVERSATIONS, memberId),
          {
            [`conversations.${conversationId}.unRead`]: increment(1)
          }
        )
      );

      await Promise.all(updatePromises);
    }
  }

  // Listen to messages (real-time sync with mobile)
  subscribeToMessages(
    conversationId: string,
    callback: (messages: IMessage[]) => void,
    limitCount: number = 50
  ): () => void {
    const messagesQuery = query(
      collection(this.firestore, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages: IMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          createdAt: new Date(data.createdAt).valueOf() || Date.now()
        } as IMessage);
      });
      callback(messages.reverse());
    });
  }
}

export default new ChatService();
```

## React Hooks for State Management

### Main Chat Hook

```typescript
// src/hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatService } from '../services/firebase/chatService';
import { IMessage, IConversation, IUser } from '../types';

export interface UseChatProps {
  user: IUser;
  conversationId?: string;
  memberIds?: string[];
  name?: string
}

export interface UseChatReturn {
  messages: IMessage[];
  conversations: IConversation[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: Omit<IMessage, 'id' | 'createdAt'>) => Promise<void>;
  createConversation: (memberIds: string[], type?: 'private' | 'group', name?: string) => Promise<string>;
  markAsRead: (conversationId: string) => Promise<void>;
}

export const useChat = ({ user, conversationId, memberIds, name }: UseChatProps): UseChatReturn => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    return () => {
      if (unsubscribeConversationsRef.current) {
        unsubscribeConversationsRef.current();
      }
    };
  }, [user?.id]);

  // Subscribe to messages for specific conversation
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    unsubscribeMessagesRef.current = ChatService.subscribeToMessages(
      conversationId,
      setMessages
    );

    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current();
      }
    };
  }, [conversationId]);

  const sendMessage = useCallback(async (message: Omit<IMessage, 'id' | 'createdAt'>) => {
    if (!conversationId) {
      throw new Error('No conversation selected');
    }

    try {
      await ChatService.sendMessage(conversationId, message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [conversationId]);

  const createConversation = useCallback(async (
    memberIds: string[], 
    type: 'private' | 'group' = 'private', 
    name?: string
  ) => {
    try {
      return await ChatService.createConversation(memberIds, user?.id, type, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      throw err;
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await ChatService.markConversationAsRead(user?.id, conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, [user?.id]);

  return {
    messages,
    conversations,
    loading,
    error,
    sendMessage,
    createConversation,
    markAsRead
  };
};
```

## React Components

### Chat Provider

```tsx
// src/components/ChatProvider/ChatProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import FirebaseWebService, { FirebaseConfig } from '../../services/firebase/config';
import { IUser } from '../../types';

export interface ChatContextValue {
  currentUser: IUser;
  firebaseConfig: FirebaseConfig;
  isInitialized: boolean;
}

export interface ChatProviderProps {
  children: ReactNode;
  currentUser: IUser;
  firebaseConfig: FirebaseConfig;
  enableEncryption?: boolean;
  encryptionKey?: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  currentUser,
  firebaseConfig,
  enableEncryption = false,
  encryptionKey
}) => {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    try {
      FirebaseWebService.getInstance().initialize(firebaseConfig);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }, [firebaseConfig]);

  const value: ChatContextValue = {
    currentUser,
    firebaseConfig,
    isInitialized
  };

  if (!isInitialized) {
    return <div>Initializing chat...</div>;
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
```

### Chat Screen Component

```tsx
// src/components/ChatScreen/ChatScreen.tsx
import React, { useState, useCallback } from 'react';
import { useChat } from '../../hooks/useChat';
import { useChatContext } from '../ChatProvider/ChatProvider';
import { MessageList } from '../MessageList/MessageList';
import { InputToolbar } from '../InputToolbar/InputToolbar';
import { CameraView } from '../../addons/camera/CameraView';
import { FileUploader } from '../../addons/fileUpload/FileUploader';
import { GalleryView } from '../../addons/gallery/GalleryView';
import { IMessage } from '../../types';
import './ChatScreen.css';

export interface ChatScreenProps {
  conversationId: string;
  partnerUsers?: IUser[];
  onBack?: () => void;
  enableCamera?: boolean;
  enableFileUpload?: boolean;
  enableGallery?: boolean;
  className?: string;
  style?: React.CSSProperties;
  isGroup?: boolean
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  partnerUsers = [],
  onBack,
  enableCamera = true,
  enableFileUpload = true,
  enableGallery = true,
  className = '',
  style,
  isGroup = false,
}) => {
  const { currentUser } = useChatContext();
  const { messages, sendMessage, loading, error } = useChat({
    user: currentUser,
    conversationId
  });

  const [showCamera, setShowCamera] = useState(false);

  const handleSend = useCallback(async (messageText: string, messageType: 'text' | 'image' | 'video' | 'file' = 'text') => {
    if (!messageText.trim()) return;

    const message: Omit<IMessage, 'id' | 'createdAt'> = {
      text: messageType === 'text' ? messageText : '',
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      ...(messageType === 'image' && { image: messageText }),
      ...(messageType === 'video' && { video: messageText }),
      ...(messageType === 'file' && { file: messageText })
    };

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [sendMessage, currentUser]);

  const handleCameraCapture = useCallback((mediaUrl: string, type: 'image' | 'video') => {
    handleSend(mediaUrl, type);
    setShowCamera(false);
  }, [handleSend]);

  const handleFileUpload = useCallback((urls: string[]) => {
    urls.forEach(url => {
      // Determine file type based on URL or extension
      const fileType = url.includes('image') ? 'image' : 
                     url.includes('video') ? 'video' : 'file';
      handleSend(url, fileType as any);
    });
  }, [handleSend]);

  if (loading) {
    return <div className="chat-loading">Loading conversation...</div>;
  }

  if (error) {
    return <div className="chat-error">Error: {error}</div>;
  }

  return (
    <div className={`chat-screen ${className}`} style={style}>
      <div className="chat-header">
        {onBack && (
          <button onClick={onBack} className="back-button">
            ←
          </button>
        )}
        <div className="chat-name">
          {partnerUsers.length > 0 ? partnerUsers.map(u => u.name).join(', ') : 'Chat'}
        </div>
      </div>
      
      <MessageList 
        messages={messages} 
        currentUserId={currentUser.id.toString()} 
      />
      
      <InputToolbar 
        onSend={handleSend}
        placeholder="Type a message..."
        onPressCamera={enableCamera ? () => setShowCamera(true) : undefined}
        fileUploadEnabled={enableFileUpload}
        onFileUpload={handleFileUpload}
      />

      {showCamera && (
        <CameraView
          onSend={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
```

## Package Configuration

### package.json

```json
{
  "name": "rn-firebase-chat-web",
  "version": "1.0.0",
  "description": "ReactJS companion library for rn-firebase-chat",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "keywords": [
    "react",
    "firebase", 
    "chat",
    "realtime",
    "messaging"
  ],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  },
  "dependencies": {
    "firebase": "^10.7.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "rollup": "^4.6.1",
    "typescript": "^5.3.3",
    "@types/dom-mediacapture-record": "^1.0.11"
  }
}
```

## Installation & Usage Guide

### Installation

```bash
# Install the web companion library
npm install rn-firebase-chat-web firebase

# or with yarn
yarn add rn-firebase-chat-web firebase
```

### Basic Usage

```tsx
// App.tsx
import React, { useState } from 'react';
import { ChatProvider, ChatScreen } from 'rn-firebase-chat-web';

const firebaseConfig = {
  apiKey: "your-web-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const currentUser = {
  id: 'web-user-123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg'
};

function App() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  return (
    <ChatProvider 
      currentUser={currentUser} 
      firebaseConfig={firebaseConfig}
    >
      <div className="app">
        {selectedConversation ? (
          <ChatScreen 
            conversationId={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <ConversationList 
            onSelectConversation={setSelectedConversation}
          />
        )}
      </div>
    </ChatProvider>
  );
}

export default App;
```

## Service Layer Reference

The companion library relies on a service layer equivalent to the web package. For implementation details of message CRUD, subscriptions, typing status, and user management, refer to the shared service API:

- [SERVICES.md](./SERVICES.md)

Typical usage mirrors the examples below:

```tsx
import { initializeFirebase, ChatService, UserService } from 'react-firebase-chat';

initializeFirebase(firebaseConfig);

const chatService = ChatService.getInstance();
const userService = UserService.getInstance();

await userService.createUserIfNotExists(currentUser.id.toString(), { name: currentUser.name });

const conversationId = await chatService.createConversation(
  [currentUser.id.toString(), 'partner-id'],
  currentUser.id.toString(),
  'private'
);

await chatService.sendMessage(conversationId, {
  text: 'Hello from companion!',
  type: 'text',
  senderId: currentUser.id.toString(),
  readBy: { [currentUser.id.toString()]: true },
  path: '',
  extension: ''
});
```

### Advanced Usage with Custom Components

```tsx
import { useChat, useChatContext } from 'rn-firebase-chat-web';

const CustomChatApp: React.FC = () => {
  const { currentUser } = useChatContext();
  const { conversations, createConversation } = useChat({
    user: currentUser,
  });

  const handleStartNewChat = async (partnerId: string) => {
    try {
      const conversationId = await createConversation([currentUser.id.toString(), partnerId]);
      // Navigate to new conversation
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <div>
      {/* Your custom UI */}
    </div>
  );
};
```

### Usage with Addons

```tsx
// Chat with Camera and File Upload
import React from 'react';
import { 
  ChatProvider, 
  ChatScreen,
  CameraView,
  FileUploader,
  useCamera,
  useFileUpload 
} from 'rn-firebase-chat-web';

const AdvancedChatApp: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  return (
    <ChatProvider 
      currentUser={currentUser} 
      firebaseConfig={firebaseConfig}
    >
      <div className="app">
        {selectedConversation ? (
          <ChatScreen 
            conversationId={selectedConversation}
            enableCamera={true}
            enableFileUpload={true}
            enableGallery={true}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <ConversationList 
            onSelectConversation={setSelectedConversation}
          />
        )}
      </div>
    </ChatProvider>
  );
};

// Custom Camera Implementation
const CustomChatWithCamera: React.FC = () => {
  const { 
    isOpen, 
    openCamera, 
    closeCamera, 
    capturePhoto,
    captureVideo 
  } = useCamera();

  const handleCameraCapture = async (type: 'photo' | 'video') => {
    if (type === 'photo') {
      const photoUrl = await capturePhoto();
      if (photoUrl) {
        // Send photo message
        console.log('Photo captured:', photoUrl);
      }
    } else {
      const videoUrl = await captureVideo();
      if (videoUrl) {
        // Send video message
        console.log('Video captured:', videoUrl);
      }
    }
  };

  return (
    <div className="custom-chat">
      <button onClick={openCamera}>Open Camera</button>
      
      {isOpen && (
        <CameraView
          onSend={(url, type) => {
            console.log(`${type} captured:`, url);
            closeCamera();
          }}
          onClose={closeCamera}
          enableVideo={true}
        />
      )}
    </div>
  );
};

// Custom File Upload
const CustomFileUploadChat: React.FC = () => {
  const { uploadFile, uploading, progress } = useFileUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'video/*', 'application/pdf']
  });

  const handleFileUpload = async (files: File[]) => {
    try {
      const urls = await Promise.all(files.map(file => uploadFile(file)));
      urls.forEach(url => {
        console.log('File uploaded:', url);
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="file-upload-chat">
      <FileUploader
        onUpload={handleFileUpload}
        multiple={true}
        accept="image/*,video/*,.pdf"
        maxSize={10 * 1024 * 1024}
      >
        <div className="custom-drop-zone">
          <p>📎 Drop files here or click to upload</p>
          {uploading && <p>Progress: {progress}%</p>}
        </div>
      </FileUploader>
    </div>
  );
};
```

## Cross-Platform Communication Features

### Real-time Synchronization
- ✅ Messages sync instantly between web and mobile
- ✅ Conversation updates reflect across all platforms  
- ✅ Online/offline status synchronization
- ✅ Typing indicators (can be added)
- ✅ Read receipts synchronization
- ✅ Media files sync across platforms
- ✅ File upload progress tracking

### Data Consistency
- ✅ Identical Firebase collections and document structure
- ✅ Same message ID generation and ordering
- ✅ Compatible encryption/decryption (if enabled)
- ✅ Unified user presence system
- ✅ Cross-platform media file formats
- ✅ Consistent file storage structure

### Feature Parity with Addons
- ✅ Text messaging
- ✅ Image sharing (web file upload ↔ RN image picker)
- ✅ Video sharing (web camera ↔ RN camera)
- ✅ Audio messages (web audio recording ↔ RN audio)
- ✅ File attachments (drag & drop ↔ document picker)
- ✅ Group conversations
- ✅ Message reactions (can be added)
- ✅ Message search and history
- ✅ Media gallery sync
- ✅ Camera capture compatibility

### Addon Compatibility Matrix

| Feature | React Native | ReactJS Web | Compatibility |
|---------|-------------|-------------|---------------|
| Camera Photo | ✅ react-native-vision-camera | ✅ Web Camera API | ✅ Same output format |
| Camera Video | ✅ react-native-vision-camera | ✅ MediaRecorder API | ✅ Compatible codecs |
| Image Picker | ✅ react-native-image-picker | ✅ File Input API | ✅ Same upload flow |
| File Upload | ✅ Document Picker | ✅ Drag & Drop | ✅ Identical storage |
| Media Viewer | ✅ react-native-fast-image | ✅ HTML5 elements | ✅ Same media URLs |
| Audio Recording | ✅ react-native-audio | ✅ MediaRecorder | ✅ Compatible formats |

## Testing Strategy

### Integration Tests

```typescript
// tests/integration/crossPlatform.test.ts
import { ChatService } from '../src/services/firebase/chatService';

describe('Cross-platform communication', () => {
  it('should sync messages between web and mobile', async () => {
    // Test message sent from web appears on mobile
    // Test message sent from mobile appears on web
  });

  it('should maintain conversation state across platforms', async () => {
    // Test conversation creation
    // Test member management
    // Test unread count synchronization
  });
});
```

## Deployment & Distribution

### NPM Package

```bash
# Build and publish
npm run build
npm publish
```

### CDN Distribution

```html
<!-- For direct browser usage -->
<script src="https://unpkg.com/rn-firebase-chat-web@latest/dist/index.umd.js"></script>
```

## Migration from Mobile to Web

### Sharing User Sessions

```typescript
// Implement shared authentication
const authenticateUser = async (token: string) => {
  // Verify token with your backend
  // Return user information that works across platforms
};
```

### Conversation Continuity

```typescript
// Users can continue conversations started on mobile
const resumeConversation = (conversationId: string) => {
  // Load existing conversation
  // Maintain message history
  // Sync unread status
};
```

This companion library approach ensures your React Native and ReactJS applications work together seamlessly while maintaining separate codebases optimized for each platform.

## Addon Styles (CSS)

### Camera View Styles

```css
/* src/addons/camera/CameraView.css */
.camera-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.camera-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.camera-preview {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: cover;
}

.camera-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  align-items: center;
}

.control-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.capture-button {
  width: 80px;
  height: 80px;
  background: #ff4444;
}

.capturing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.camera-error {
  background: #1a1a1a;
  color: #fff;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
}

.error-message h3 {
  margin: 0 0 16px 0;
  color: #ff4444;
}

.error-message p {
  margin: 0 0 24px 0;
  color: #ccc;
}

.close-button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s ease;
}

.close-button:hover {
  background: #0056b3;
}
```

### File Uploader Styles

```css
/* src/addons/fileUpload/FileUploader.css */
.file-uploader {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.file-uploader:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.file-uploader.drag-over {
  border-color: #007bff;
  background: #e7f3ff;
  transform: scale(1.02);
}

.upload-placeholder {
  padding: 20px;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.upload-placeholder p {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.upload-placeholder small {
  color: #666;
  font-size: 14px;
}

.upload-progress {
  padding: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.upload-error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 12px;
  font-size: 14px;
}
```

### Gallery View Styles

```css
/* src/addons/gallery/GalleryView.css */
.gallery-view {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.gallery-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  background: #f5f5f5;
}

.gallery-item:hover {
  transform: scale(1.05);
}

.media-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-thumbnail,
.file-thumbnail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f0f0f0;
  color: #666;
  text-align: center;
  padding: 8px;
}

.audio-icon,
.file-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.audio-thumbnail p,
.file-thumbnail p {
  margin: 0;
  font-size: 12px;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.delete-button {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(220, 53, 69, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-item:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background: #dc3545;
}
```

### Media Viewer Styles

```css
/* src/addons/gallery/MediaViewer.css */
.media-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.media-viewer-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
  overflow: hidden;
}

.media-viewer img,
.media-viewer video {
  width: 100%;
  height: auto;
  max-height: 90vh;
  object-fit: contain;
}

.media-viewer-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
}

.viewer-button {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.viewer-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.audio-player {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 40px;
  color: #fff;
  text-align: center;
  min-width: 300px;
}

.audio-player audio {
  width: 100%;
  margin-top: 20px;
}
```
