# React Firebase Chat

A comprehensive ReactJS chat library that works **with or without authentication**. Perfect for demos, testing, or production applications. Includes real-time messaging, cross-platform compatibility with React Native, and modern UI components.

## 🌟 Key Highlights

- **🚀 No Authentication Required** - Start chatting immediately with SimpleChat
- **🔥 Firebase Integration** - Optional real-time sync with React Native apps
- **📱 Cross-Platform Compatible** - Messages sync between web and mobile
- **🎨 Modern UI** - Beautiful, responsive design out of the box
- **📦 TypeScript Ready** - Full type safety and IntelliSense support

## Overview

The `react-firebase-chat` library is designed to:
- **Share the same Firebase backend** with React Native applications
- **Maintain data compatibility** and synchronization across platforms  
- **Provide similar API interface** for easy adoption
- **Ensure real-time communication** between web and mobile users

### Timestamp behavior

This web library uses client-side timestamps (`Date.now()`) when writing to Firestore for fields like `createdAt`, `updatedAt`, `latestMessageTime`, and `joinedAt`. If you require server-side timestamps for stronger ordering guarantees across clients, you may change these to Firestore `serverTimestamp()` in your app.

## Installation

### From NPM (Recommended)
```bash
npm install react-firebase-chat firebase tailwindcss framer-motion
# or
yarn add react-firebase-chat firebase tailwindcss framer-motion
```

### From GitHub
```bash
npm install git+https://github.com/your-username/react-firebase-chat.git firebase tailwindcss framer-motion
# or
yarn add git+https://github.com/your-username/react-firebase-chat.git firebase tailwindcss framer-motion
```

> **Note**: When installing from GitHub, the package will automatically build the `dist` folder during installation thanks to the `postinstall` script.

### Installing Dev Dependencies
```bash
npm install --save-dev autoprefixer postcss postcss-cli
# or
yarn add autoprefixer postcss postcss-cli --dev
```

> **Note**: Our package is built with tailwindcss so if you did not init the project with it, you will have to configure for it before using this package.

## 🚀 Quick Start

### Theme Notice
Add Material Icons on root head tag
```html
  <html lang="en">
    <head>
      {/* Add Material Icons */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        rel="stylesheet"
      />
      {/* Add Material Icons */}
    </head>
    <body>
      {children}
    </body>
  </html>
```

### 1. Initialize with ChatProvider

```tsx
"use client";

import React from "react";
import {
  ChatScreen as BasicChatScreen,
  ChatProvider,
  IUser,
  initializeFirebase,
} from "react-firebase-chat";

const firebaseConfig = {
  apiKey: "your-web-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  measurementId: "your-measurement-id",
};

initializeFirebase(firebaseConfig);

export default function ChatRoutePage() {
  // Replace with your user information from your auth system
  const currentUser: IUser = {
    id: "your-user-id",
    name: "your-user-name",
    avatar: "your-user-avatar",
  };

  if (!currentUser) {
    return (
      <div style={{ padding: 24 }}>
        <p>Missing user information. Please go back to the login page.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          height: 1000,
          width: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChatProvider currentUser={currentUser}>
          <BasicChatScreen partners={[]} showFileUpload={true} />
        </ChatProvider>
      </div>
    </div>
  );
}
```

> **Note**: You can check our Auth example for a basic UserService usage on [Auth Example](./examples/auth-example.tsx).

## Authentication
This library does not include auth utilities. Provide your own auth and pass `currentUser` to `ChatProvider`.

## Configuration

Configure the chat behavior with the `ChatProvider`:

```tsx
<ChatProvider
  currentUser={currentUser}
  firebaseConfig={firebaseConfig}
  encryptionKey="optional-encryption-key"
>
  <App />
</ChatProvider>
```

### Available Hooks

```tsx
import { useChat, useMessages, useTyping, useChatContext } from 'react-firebase-chat';

// Main chat functionality
const { messages, sendMessage, loading, error } = useChat({
  user: currentUser,
  conversationId: 'conversation-123'
});

// Message pagination
const { messages, loadMore, hasMore } = useMessages('conversation-123');

// Typing indicators
const { typingUsers, setTyping } = useTyping('conversation-123', currentUser.id);

// Chat context
const { currentUser, isInitialized } = useChatContext();
```

### Direct Service Usage

For advanced use cases, you can use services directly:

```tsx
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

// Subscribe to real-time messages
const unsubscribe = chatService.subscribeToMessages(
  conversationId,
  (messages) => {
    console.log('New messages:', messages);
  }
);
```

## Services

The library provides three main services for advanced functionality:

### ChatService
Handles all chat operations including conversations, messages, and real-time subscriptions.

```tsx
import { ChatService } from 'react-firebase-chat';

const chatService = ChatService.getInstance();

// Create conversation
const conversationId = await chatService.createConversation(
  ['user1', 'user2'], 
  'initiatorId', 
  'private'
);

// Send message
await chatService.sendMessage(conversationId, messageData);

// Subscribe to real-time messages
const unsubscribe = chatService.subscribeToMessages(
  conversationId, 
  (messages) => setMessages(messages)
);
```

### UserService
Manages user documents and profiles.

```tsx
import { UserService } from 'react-firebase-chat';

const userService = UserService.getInstance();

// Create user if not exists
await userService.createUserIfNotExists('user123', {
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg'
});

// Get all users
const users = await userService.getAllUsers();
```

### FirebaseService
Handles Firebase initialization and provides access to Firebase services.

```tsx
import { initializeFirebase, getFirebaseFirestore } from 'react-firebase-chat';

// Initialize Firebase
initializeFirebase(firebaseConfig);

// Get Firestore instance
const db = getFirebaseFirestore();
```

> 📖 **For detailed service documentation, see [SERVICES.md](./SERVICES.md)**

## Components

### ChatScreen
Main chat interface component with three sections: app header, conversation sidebar, and chat panel. Selecting a conversation shows a loader only in the chat panel, not the whole screen.

**Props:**
- `conversationId?: string` - Optional preselected conversation id
- `partners?: Array<{id: string, name: string, avatar?: string}>` - Optional partners (for direct usage without sidebar)
- `memberIds: string[]` - Member user IDs (optional when using sidebar-driven conversations)
- `style?: React.CSSProperties` - Inline styles
- `className?: string` - Additional CSS classes
- `onSend?: (messages: Message[]) => void` - Optional callback when messages are sent
- `showCamera?: boolean` - Enable camera functionality (default: true)
- `showFileUpload?: boolean` - Enable file upload (default: true)
- `isGroup?: boolean` - Whether this is a group chat (default: false)

Sidebar behavior:
- Lists conversations from `users/{userId}/conversations` with name, latest message, unread badge and online dot placeholder
- “New” button opens a modal with incremental search (top 3 matches from `UserService` after typing). Selecting a user creates a new conversation and opens it.

### MessageList
Display list of messages.

**Props:**
- `messages: Message[]` - Array of messages to display
- `currentUser: IUser` - Current user for ownership detection
- `onMessageUpdate?: (message: Message) => void` - Message edit handler
- `onMessageDelete?: (messageId: string) => void` - Message delete handler
- `className?: string` - Additional CSS classes

### MessageInput
Text input for composing messages.

The input now relies on its container for styling and no longer enforces `maxLength` internally.

**Props:**
- `onSendMessage: (text: string) => void` - Send message handler
- `onTyping?: (isTyping: boolean) => void` - Typing indicator handler
- `disabled?: boolean` - Disable input
- `placeholder?: string` - Input placeholder text
- `className?: string` - Additional CSS classes

### UserAvatar
User profile picture with online status.

**Props:**
- `user: IUser` - User data
- `size?: 'small' | 'medium' | 'large'` - Avatar size
- `showOnlineStatus?: boolean` - Show online indicator
- `className?: string` - Additional CSS classes

### ConnectionStatus
Network connection status indicator.

**Props:**
- `status: ConnectionStatus` - Connection status ('connected' | 'connecting' | 'disconnected' | 'error')
- `className?: string` - Additional CSS classes

### TypingIndicator
Shows when users are typing.

**Props:**
- `typingUsers: TypingUser[]` - Array of users currently typing
- `className?: string` - Additional CSS classes

## Firebase Setup

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat rooms - users can read rooms they're part of
    match /chatRooms/{roomId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      // Messages within chat rooms
      match /messages/{messageId} {
        allow read, create: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/chatRooms/$(roomId)).data.participants;
        allow update, delete: if request.auth != null && 
          request.auth.uid == resource.data.userId;
      }
      
      // Typing indicators
      match /typing/{userId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chat/{roomId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## TypeScript

The library is built with TypeScript and provides full type definitions:

```tsx
import type { 
  IUser, 
  IMessage, 
  IConversation,
  Message,
  TypingUser,
  ConnectionStatus,
  FirebaseConfig,
  UseChatProps,
  UseChatReturn
} from 'react-firebase-chat';
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Your Name]

## 📚 Documentation

- **[Services Documentation](./SERVICES.md)** - Detailed service API reference
- **[Examples](./examples/)** - Live code examples
