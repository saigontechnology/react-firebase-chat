import React, { useState } from 'react';
import {
  ChatProvider,
  SimpleChat,
  SimpleUser,
  Message
} from 'react-firebase-chat';

// Basic usage example without authentication
const BasicChatExample: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Firebase configuration for web (replace with your config)
  const firebaseConfig = {
    apiKey: "your-web-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  };

  // Simple user information - no authentication required
  const currentUser: SimpleUser = {
    id: 'web-user-123',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg'
  };

  // Partner information for the conversation
  const partnerInfo = {
    id: 'partner-123',
    name: 'Jane Smith',
    avatar: 'https://example.com/jane.jpg',
  };

  const handleMessageSent = (messages: Message[]) => {
    console.log('Messages sent:', messages);
    // Handle sent messages (e.g., show notification, update UI)
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h1>React Firebase Chat - Basic Example (No Auth Required)</h1>
        <p>Simple chat integration without authentication</p>
      </header>

      {selectedConversation ? (
        <SimpleChat
          roomId={selectedConversation}
          currentUser={currentUser}
          onSend={handleMessageSent}
          showTypingIndicator={true}
          placeholder="Type your message here..."
          style={{ flex: 1 }}
        />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h2>Welcome to React Firebase Chat</h2>
          <p>Simple chat without authentication required</p>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '16px',
            borderRadius: '8px',
            maxWidth: '400px',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>Current User:</h3>
            <p style={{ margin: '0', fontSize: '14px' }}>
              ID: {currentUser.id}<br/>
              Name: {currentUser.name}<br/>
              Avatar: {currentUser.avatar ? 'Yes' : 'No'}
            </p>
          </div>
          <button
            onClick={() => setSelectedConversation('conversation-123')}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Start Chat with {partnerInfo.name}
          </button>
        </div>
      )}
    </div>
  );
};

export default BasicChatExample;
