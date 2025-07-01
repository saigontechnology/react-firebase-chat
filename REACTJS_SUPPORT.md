# ReactJS Support Documentation

This document provides a comprehensive guide to adapt the `rn-firebase-chat` library for use in ReactJS web applications.

## Overview

The `rn-firebase-chat` library is originally designed for React Native applications. To support ReactJS, we need to create web-compatible components and handle platform-specific dependencies.

## Architecture for ReactJS Support

### 1. Platform Detection and Conditional Exports

Create a platform detection system to export the appropriate components based on the runtime environment.

```
src/
├── web/                    # Web-specific implementations
│   ├── components/
│   ├── hooks/
│   └── utils/
├── native/                 # React Native implementations (existing)
└── index.web.ts           # Web entry point
```

### 2. Required Changes and Adaptations

#### Dependencies to Replace/Mock for Web

1. **React Native Core Components**
   - `View` → `div`
   - `Text` → `span` or `p`
   - `ScrollView` → `div` with CSS overflow
   - `TouchableOpacity` → `button` or `div` with click handlers
   - `Image` → `img`
   - `TextInput` → `input` or `textarea`

2. **React Native Firebase**
   - Use Firebase Web SDK instead of React Native Firebase
   - Replace `@react-native-firebase/firestore` with `firebase/firestore`
   - Replace `@react-native-firebase/storage` with `firebase/storage`

3. **Media and Camera Libraries**
   - `react-native-vision-camera` → Web Camera API or custom file input
   - `react-native-image-picker` → HTML file input
   - `react-native-fast-image` → standard `img` tag
   - `react-native-video` → HTML5 `video` element

4. **Crypto and Storage**
   - `react-native-aes-crypto` → Web Crypto API or crypto-js
   - `react-native-get-random-values` → Web Crypto API

5. **UI Libraries**
   - `react-native-gifted-chat` → Custom web chat implementation
   - `react-native-safe-area-context` → CSS-based safe area handling
   - `react-native-reanimated` → CSS animations or Framer Motion

## Implementation Steps

### Step 1: Create Web Package Configuration

Create a separate build configuration for web in `package.json`:

```json
{
  "name": "rn-firebase-chat",
  "main": "lib/commonjs/index.js",
  "module": "lib/module/index.js",
  "browser": "lib/web/index.js",
  "react-native": "lib/commonjs/index.js",
  "types": "lib/typescript/index.d.ts"
}
```

### Step 2: Firebase Web SDK Integration

Create a web-specific Firebase service:

```typescript
// src/web/services/firebase/index.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

export class WebFirestoreServices {
  private static instance: WebFirestoreServices;
  private firestore: any;
  private storage: any;
  private auth: any;

  private constructor(config: any) {
    const app = initializeApp(config);
    this.firestore = getFirestore(app);
    this.storage = getStorage(app);
    this.auth = getAuth(app);
  }

  static getInstance(config?: any): WebFirestoreServices {
    if (!WebFirestoreServices.instance) {
      WebFirestoreServices.instance = new WebFirestoreServices(config);
    }
    return WebFirestoreServices.instance;
  }

  // Implement methods compatible with the existing interface
  async createConversation(data: any) {
    // Implementation using Firebase Web SDK
  }

  async getConversations(userId: string) {
    // Implementation using Firebase Web SDK
  }

  // ... other methods
}
```

### Step 3: Web Components Implementation

#### ChatProvider for Web

```typescript
// src/web/chat/ChatProvider.tsx
import React, { createContext, useEffect, useReducer } from 'react';
import { WebFirestoreServices } from '../services/firebase';
import type { IChatContext } from '../../interfaces';
import { chatReducer } from '../../reducer';

const webFirestoreServices = WebFirestoreServices.getInstance();

export const WebChatProvider: React.FC<ChatProviderProps> = ({
  userInfo,
  children,
  firebaseConfig, // Web-specific config
  ...props
}) => {
  const [state, dispatch] = useReducer(chatReducer, {});

  useEffect(() => {
    // Initialize Firebase with web config
    WebFirestoreServices.getInstance(firebaseConfig);
  }, [firebaseConfig]);

  // Rest of the implementation similar to native version
  // but using web-specific services
};
```

#### Web Chat Screen

```typescript
// src/web/chat/ChatScreen.tsx
import React, { useState, useEffect } from 'react';
import { WebMessageList } from './components/WebMessageList';
import { WebInputToolbar } from './components/WebInputToolbar';
import './ChatScreen.css'; // CSS styles for web

export interface WebChatScreenProps {
  memberIds: string[];
  partners: any[];
  onSend?: (messages: any[]) => void;
  // ... other props
}

export const WebChatScreen: React.FC<WebChatScreenProps> = ({
  memberIds,
  partners,
  onSend,
  ...props
}) => {
  const [messages, setMessages] = useState([]);

  return (
    <div className="web-chat-screen">
      <div className="chat-header">
        {/* Header implementation */}
      </div>
      <WebMessageList messages={messages} />
      <WebInputToolbar onSend={onSend} />
    </div>
  );
};
```

#### Web Message Components

```typescript
// src/web/chat/components/WebMessageList.tsx
import React from 'react';
import { WebMessage } from './WebMessage';
import './WebMessageList.css';

export const WebMessageList: React.FC<{messages: any[]}> = ({ messages }) => {
  return (
    <div className="web-message-list">
      {messages.map((message) => (
        <WebMessage key={message._id} message={message} />
      ))}
    </div>
  );
};
```

### Step 4: Platform-Specific Entry Points

Create platform-specific index files:

```typescript
// src/index.web.ts
export * from './web/services/firebase';
export * from './web/chat';
export * from './web/hooks';
// ... other web-specific exports
```

```typescript
// src/index.native.ts
export * from './services/firebase';
export * from './chat';
export * from './hooks';
// ... existing exports
```

### Step 5: Build Configuration

Update `react-native-builder-bob` configuration:

```json
{
  "react-native-builder-bob": {
    "source": "src",
    "output": "lib",
    "targets": [
      "commonjs",
      "module", 
      "typescript",
      {
        "target": "module",
        "platform": "web",
        "entry": "./src/index.web.ts"
      }
    ]
  }
}
```

### Step 6: CSS Styles for Web Components

Create CSS files for styling web components:

```css
/* src/web/chat/ChatScreen.css */
.web-chat-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  padding: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.web-message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.web-input-toolbar {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background-color: #ffffff;
}
```

## Installation and Usage for ReactJS

### Installation

```bash
npm install rn-firebase-chat firebase
# or
yarn add rn-firebase-chat firebase
```

### Basic Usage in ReactJS

```tsx
import React from 'react';
import { WebChatProvider, WebChatScreen } from 'rn-firebase-chat/web';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const userInfo = {
  id: 'user123',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
};

function App() {
  return (
    <WebChatProvider 
      userInfo={userInfo} 
      firebaseConfig={firebaseConfig}
    >
      <ChatApp />
    </WebChatProvider>
  );
}

function ChatApp() {
  const partnerInfo = {
    id: 'partner123',
    name: 'Jane Smith',
    avatar: 'https://example.com/jane.jpg',
  };

  return (
    <WebChatScreen 
      memberIds={[partnerInfo.id]} 
      partners={[partnerInfo]} 
    />
  );
}

export default App;
```

### Advanced Usage with Custom Components

```tsx
import { WebChatScreen, useWebChat } from 'rn-firebase-chat/web';

const CustomChatScreen: React.FC = () => {
  const { sendMessage, messages } = useWebChat();

  const handleCustomSend = (messageText: string) => {
    sendMessage({
      text: messageText,
      user: {
        _id: 'current-user-id',
        name: 'Current User',
      },
    });
  };

  return (
    <div className="custom-chat-container">
      <WebChatScreen
        memberIds={['partner-id']}
        partners={[{ id: 'partner-id', name: 'Partner' }]}
        renderInputToolbar={(props) => (
          <CustomInputToolbar {...props} onSend={handleCustomSend} />
        )}
        renderMessage={(props) => (
          <CustomMessage {...props} />
        )}
      />
    </div>
  );
};
```

## File Upload and Media Support

### Web File Upload Implementation

```typescript
// src/web/hooks/useWebFileUpload.ts
import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const useWebFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `chat-files/${Date.now()}-${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading };
};
```

### Image and Video Components

```tsx
// src/web/components/WebImageMessage.tsx
import React from 'react';

export const WebImageMessage: React.FC<{url: string, alt?: string}> = ({ 
  url, 
  alt = 'Image' 
}) => {
  return (
    <img 
      src={url} 
      alt={alt}
      style={{
        maxWidth: '300px',
        maxHeight: '400px',
        borderRadius: '8px',
        cursor: 'pointer'
      }}
      onClick={() => window.open(url, '_blank')}
    />
  );
};
```

## Testing Strategy

### Unit Tests for Web Components

```typescript
// src/web/__tests__/ChatScreen.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { WebChatScreen } from '../chat/ChatScreen';

describe('WebChatScreen', () => {
  it('renders chat screen correctly', () => {
    render(
      <WebChatScreen 
        memberIds={['test-user']} 
        partners={[{ id: 'test-user', name: 'Test User' }]} 
      />
    );
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

## Migration Guide

### From React Native to Web

1. **Replace imports:**
   ```typescript
   // Before (React Native)
   import { ChatProvider, ChatScreen } from 'rn-firebase-chat';
   
   // After (Web)
   import { WebChatProvider, WebChatScreen } from 'rn-firebase-chat/web';
   ```

2. **Update Firebase configuration:**
   ```typescript
   // Add firebaseConfig prop to WebChatProvider
   <WebChatProvider 
     userInfo={userInfo}
     firebaseConfig={webFirebaseConfig}
   >
   ```

3. **Replace navigation logic:**
   ```typescript
   // React Native navigation becomes standard React routing
   import { BrowserRouter, Route, Routes } from 'react-router-dom';
   
   <BrowserRouter>
     <Routes>
       <Route path="/chat" element={<WebChatScreen />} />
       <Route path="/conversations" element={<WebListConversations />} />
     </Routes>
   </BrowserRouter>
   ```

## Performance Considerations

1. **Lazy Loading:** Implement code splitting for chat components
2. **Virtual Scrolling:** For large message lists
3. **Image Optimization:** Compress images before upload
4. **Caching:** Implement proper caching strategies for messages

## Browser Compatibility

- **Modern Browsers:** Chrome 80+, Firefox 74+, Safari 13+, Edge 80+
- **Required Features:** 
  - ES6 Modules
  - Web Crypto API
  - File API
  - WebSocket support

## Deployment Considerations

1. **Build Configuration:** Ensure proper bundling for web
2. **Environment Variables:** Configure Firebase settings for different environments
3. **PWA Support:** Consider adding service worker for offline capabilities
4. **CDN:** Host static assets on CDN for better performance

## Contributing to Web Support

1. Follow the existing code structure and patterns
2. Maintain compatibility with the React Native version
3. Add comprehensive tests for web-specific features
4. Update documentation for any new web features

## Troubleshooting

### Common Issues

1. **Firebase Configuration:**
   - Ensure web Firebase config is properly set
   - Check Firebase rules for web domain

2. **Build Issues:**
   - Verify metro/webpack configuration
   - Check for React Native specific imports in web build

3. **Styling Issues:**
   - Ensure CSS is properly imported
   - Check for responsive design on different screen sizes

## Future Enhancements

1. **Real-time Features:** Enhanced WebSocket integration
2. **Voice Messages:** Web Audio API integration  
3. **Video Calls:** WebRTC integration
4. **Rich Text:** Advanced text editing capabilities
5. **Theming:** Advanced theming system for web

## License

This web adaptation follows the same MIT license as the original library.
