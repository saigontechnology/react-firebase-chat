# No Authentication Setup Guide

This guide shows how to use React Firebase Chat without requiring user authentication. Perfect for demos, testing, or applications where you handle authentication separately.

## Quick Setup

### 1. Install the Package

```bash
npm install react-firebase-chat firebase
```

### 2. Basic Usage (No Firebase Required)

For UI testing and development:

```tsx
import React from 'react';
import { SimpleChat, SimpleUser } from 'react-firebase-chat';

const App = () => {
  const currentUser: SimpleUser = {
    id: 'demo-user-1',
    name: 'Demo User',
    avatar: '👤'
  };

  return (
    <div style={{ height: '100vh' }}>
      <SimpleChat
        roomId="demo-room"
        currentUser={currentUser}
        onSend={(messages) => console.log('Messages:', messages)}
        placeholder="Type a message..."
        showTypingIndicator={false}
      />
    </div>
  );
};

export default App;
```

### 3. With Firebase (But No Auth)

For real-time messaging without user authentication:

```tsx
import React, { useEffect } from 'react';
import { SimpleChat, SimpleUser } from 'react-firebase-chat';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const App = () => {
  useEffect(() => {
    // Initialize Firebase
    initializeApp(firebaseConfig);
  }, []);

  const currentUser: SimpleUser = {
    id: 'user-' + Math.random().toString(36).substr(2, 9), // Generate unique ID
    name: 'Anonymous User',
    avatar: 'https://via.placeholder.com/40'
  };

  return (
    <div style={{ height: '100vh' }}>
      <SimpleChat
        roomId="public-chat-room"
        currentUser={currentUser}
        onSend={(messages) => {
          console.log('Message sent:', messages[0].text);
        }}
        placeholder="Type a message..."
        showTypingIndicator={true}
      />
    </div>
  );
};

export default App;
```

## SimpleUser Interface

The `SimpleUser` interface is minimal and doesn't require authentication:

```typescript
interface SimpleUser {
  id: string;       // Unique identifier (you generate this)
  name: string;     // Display name
  avatar?: string;  // Optional avatar URL
}
```

## SimpleChat Props

```typescript
interface SimpleChatProps {
  roomId: string;                    // Chat room identifier
  currentUser: SimpleUser;           // Current user info
  onSend?: (messages: Message[]) => void;  // Message sent callback
  style?: React.CSSProperties;       // Custom styles
  className?: string;                // CSS classes
  showTypingIndicator?: boolean;     // Show typing indicator
  placeholder?: string;              // Input placeholder
  maxMessageLength?: number;         // Max message length
}
```

## Examples

### Multi-User Demo

```tsx
import React, { useState } from 'react';
import { SimpleChat, SimpleUser } from 'react-firebase-chat';

const MultiUserDemo = () => {
  const [currentUserId, setCurrentUserId] = useState('user-1');

  const users = {
    'user-1': { id: 'user-1', name: 'Alice', avatar: '👩' },
    'user-2': { id: 'user-2', name: 'Bob', avatar: '👨' },
    'user-3': { id: 'user-3', name: 'Charlie', avatar: '🧑' }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* User Switcher */}
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
        <label>Switch User: </label>
        {Object.entries(users).map(([id, user]) => (
          <button
            key={id}
            onClick={() => setCurrentUserId(id)}
            style={{
              margin: '0 5px',
              padding: '5px 10px',
              backgroundColor: currentUserId === id ? '#007bff' : '#fff',
              color: currentUserId === id ? '#fff' : '#000',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            {user.avatar} {user.name}
          </button>
        ))}
      </div>

      {/* Chat */}
      <SimpleChat
        roomId="multi-user-demo"
        currentUser={users[currentUserId]}
        onSend={(messages) => {
          console.log(`${users[currentUserId].name} sent:`, messages[0].text);
        }}
        style={{ flex: 1 }}
      />
    </div>
  );
};

export default MultiUserDemo;
```

### Chat with Bot Responses

```tsx
import React, { useState, useCallback } from 'react';
import { SimpleChat, SimpleUser, Message } from 'react-firebase-chat';

const ChatWithBot = () => {
  const currentUser: SimpleUser = {
    id: 'human-user',
    name: 'You',
    avatar: '👤'
  };

  const botUser: SimpleUser = {
    id: 'chat-bot',
    name: 'Chat Bot',
    avatar: '🤖'
  };

  const generateBotResponse = (userMessage: string): string => {
    const responses = [
      `I heard you say: "${userMessage}"`,
      `That's interesting! Tell me more about "${userMessage}".`,
      `Thanks for sharing: "${userMessage}"`,
      `I'm processing: "${userMessage}"...`,
      `Great point about "${userMessage}"!`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = useCallback((messages: Message[]) => {
    const userMessage = messages[0];
    console.log('User sent:', userMessage.text);

    // Simulate bot response after 1-3 seconds
    const delay = Math.random() * 2000 + 1000;
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage.text);
      console.log('Bot responds:', botResponse);
      // In a real app, you'd send this through your messaging system
    }, delay);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <div style={{
        padding: '10px',
        backgroundColor: '#e3f2fd',
        textAlign: 'center',
        borderBottom: '1px solid #ccc'
      }}>
        <h3>Chat with Bot Demo</h3>
        <p>Send a message and the bot will respond! (Check console for responses)</p>
      </div>
      
      <SimpleChat
        roomId="bot-chat"
        currentUser={currentUser}
        onSend={handleSendMessage}
        placeholder="Say something to the bot..."
        style={{ height: 'calc(100vh - 100px)' }}
      />
    </div>
  );
};

export default ChatWithBot;
```

## Firebase Security Rules (No Auth)

If you're using Firebase without authentication, set up these security rules to allow public access:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read/write for conversations
    match /conversations/{conversationId} {
      allow read, write: if true;
      
      // Allow public read/write for messages
      match /messages/{messageId} {
        allow read, write: if true;
      }
    }
    
    // Allow public read/write for user conversations
    match /userConversations/{userId} {
      allow read, write: if true;
    }
  }
}

// Storage Security Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read/write for chat files
    match /chat-files/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Warning**: These rules allow public access. Only use in development or for public chat applications.

## Benefits of No-Auth Setup

1. **Quick Development**: Start building chat UI immediately
2. **Testing**: Perfect for unit tests and demos
3. **Flexibility**: Handle authentication your way
4. **Prototyping**: Rapid prototyping without auth complexity
5. **Public Chats**: Great for public/anonymous chat rooms

## Migration to Full Auth

When ready to add authentication, you can easily migrate to the full `ChatProvider` system:

```tsx
// Before (No Auth)
<SimpleChat roomId="room" currentUser={simpleUser} />

// After (With Auth)
<ChatProvider currentUser={authUser} firebaseConfig={config}>
  <ChatScreen conversationId="room" memberIds={[]} partners={[]} />
</ChatProvider>
```

The message data structure remains the same, so your existing chats will work seamlessly.
