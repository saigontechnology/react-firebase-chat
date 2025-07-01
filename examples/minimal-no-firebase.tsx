import React, { useState } from 'react';
import { SimpleChat, SimpleUser, Message } from '../src';

/**
 * Minimal chat example without Firebase
 * Perfect for testing UI components
 */
const MinimalChatExample: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  // Simple user - no authentication needed
  const currentUser: SimpleUser = {
    id: 'demo-user-1',
    name: 'Demo User',
    avatar: '👤'
  };

  const handleSendMessage = (newMessages: Message[]) => {
    console.log('New messages:', newMessages);
    
    // Add to local state for demo
    setMessages(prev => [...prev, ...newMessages]);
    
    // Simulate a response after 2 seconds
    setTimeout(() => {
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        text: `Echo: ${newMessages[0]?.text}`,
        userId: 'bot-user',
        user: {
          uid: 'bot-user',
          email: '',
          displayName: 'Echo Bot',
          photoURL: '🤖',
          isOnline: true,
          lastSeen: new Date(),
          status: 'online',
        },
        createdAt: new Date(),
        type: 'text',
        status: 'sent',
      };
      setMessages(prev => [...prev, botResponse]);
    }, 2000);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
        textAlign: 'center'
      }}>
        <h1>React Firebase Chat - Minimal Example</h1>
        <p>No Firebase required - UI demonstration only</p>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
          marginTop: '8px'
        }}>
          ⚠️ This example uses local state only. Messages are not persisted.
        </div>
      </header>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '20px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <SimpleChat
            roomId="demo-room"
            currentUser={currentUser}
            onSend={handleSendMessage}
            placeholder="Type a message to see it echo back..."
            showTypingIndicator={false}
            style={{ height: '100%' }}
          />
        </div>
      </div>

      <footer style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e0e0e0',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>
          For full functionality with real-time sync, configure Firebase in your application.
        </p>
      </footer>
    </div>
  );
};

export default MinimalChatExample;
