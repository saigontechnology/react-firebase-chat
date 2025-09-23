import React, { useState, useEffect } from 'react';
import {
  ChatProvider,
  ChatScreen,
  useChatContext,
  IUser,
  Message
} from '../src'; // Import from local source

/**
 * Cross-platform testing example
 * This component demonstrates real-time communication testing
 * between ReactJS web and React Native mobile
 */
const CrossPlatformTestExample: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [conversationId] = useState('test-conversation-cross-platform');

  // Firebase configuration for testing
  const firebaseConfig = {
    apiKey: "your-test-api-key",
    authDomain: "your-test-project.firebaseapp.com",
    projectId: "your-test-project-id",
    storageBucket: "your-test-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:test123456"
  };

  const currentUser: IUser = {
    id: 'web-test-user',
    name: 'Web Test User',
    avatar: 'https://example.com/web-user.jpg'
  };

  const rnTestUser = {
    id: 'rn-test-user',
    name: 'RN Test User',
    avatar: 'https://example.com/rn-user.jpg',
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  return (
    <ChatProvider
      currentUser={currentUser}
      firebaseConfig={firebaseConfig}
    >
      <div style={{ height: '100vh', display: 'flex' }}>
        {/* Test Control Panel */}
        <TestControlPanel
          onTestSelect={setSelectedTest}
          testResults={testResults}
          onAddResult={addTestResult}
        />

        {/* Chat Interface for Testing */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h2>Cross-Platform Testing: Web ↔ React Native</h2>
            <p>Test real-time communication between platforms</p>
            {selectedTest && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                marginTop: '8px'
              }}>
                <strong>Active Test:</strong> {selectedTest}
              </div>
            )}
          </div>

          <ChatScreen
            conversationId={conversationId}
            memberIds={[rnTestUser.id]}
            partners={[rnTestUser]}
            onSend={(messages) => {
              addTestResult(`Web sent message: "${messages[0]?.text}"`);
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </ChatProvider>
  );
};

// Test control panel component
const TestControlPanel: React.FC<{
  onTestSelect: (test: string) => void;
  testResults: string[];
  onAddResult: (result: string) => void;
}> = ({ onTestSelect, testResults, onAddResult }) => {
  const [autoTest, setAutoTest] = useState(false);

  const testScenarios = [
    {
      id: 'message-sync',
      name: 'Message Sync Test',
      description: 'Test message synchronization between platforms'
    },
    {
      id: 'media-sharing',
      name: 'Media Sharing Test', 
      description: 'Test image/video sharing compatibility'
    },
    {
      id: 'file-upload',
      name: 'File Upload Test',
      description: 'Test file upload and download between platforms'
    },
    {
      id: 'typing-indicator',
      name: 'Typing Indicator Test',
      description: 'Test typing indicators sync'
    },
    {
      id: 'offline-sync',
      name: 'Offline Sync Test',
      description: 'Test offline message queuing and sync'
    },
    {
      id: 'conversation-state',
      name: 'Conversation State Test',
      description: 'Test conversation state synchronization'
    }
  ];

  const startAutomatedTest = async () => {
    setAutoTest(true);
    onAddResult('Starting automated cross-platform tests...');

    // Simulate automated test scenarios
    for (const scenario of testScenarios) {
      onTestSelect(scenario.name);
      onAddResult(`Testing: ${scenario.name}`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate test duration
      
      // Simulate test results
      const success = Math.random() > 0.2; // 80% success rate
      onAddResult(`${scenario.name}: ${success ? '✅ PASS' : '❌ FAIL'}`);
    }

    onAddResult('Automated testing completed');
    setAutoTest(false);
  };

  return (
    <div style={{
      width: '350px',
      borderRight: '1px solid #e0e0e0',
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Test Scenarios */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h3>Test Scenarios</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {testScenarios.map((test) => (
            <button
              key={test.id}
              onClick={() => onTestSelect(test.name)}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {test.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {test.description}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={startAutomatedTest}
          disabled={autoTest}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '16px',
            backgroundColor: autoTest ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: autoTest ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {autoTest ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Performance Metrics */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <h4>Performance Metrics</h4>
        <PerformanceMonitor onMetricUpdate={onAddResult} />
      </div>

      {/* Test Results */}
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        <h4>Test Results</h4>
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '12px',
          maxHeight: '300px',
          overflow: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#666', margin: 0 }}>
              No test results yet. Start a test to see results here.
            </p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Performance monitoring component
const PerformanceMonitor: React.FC<{
  onMetricUpdate: (metric: string) => void;
}> = ({ onMetricUpdate }) => {
  const [metrics, setMetrics] = useState({
    messageDeliveryTime: 0,
    memoryUsage: 0,
    activeConnections: 1
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time metrics
      const newMetrics = {
        messageDeliveryTime: Math.round(Math.random() * 100) + 50, // 50-150ms
        memoryUsage: Math.round(Math.random() * 10) + 5, // 5-15MB
        activeConnections: Math.floor(Math.random() * 3) + 1 // 1-3 connections
      };

      setMetrics(newMetrics);

      // Alert if performance degrades
      if (newMetrics.messageDeliveryTime > 120) {
        onMetricUpdate(`⚠️ High message delivery time: ${newMetrics.messageDeliveryTime}ms`);
      }
      if (newMetrics.memoryUsage > 12) {
        onMetricUpdate(`⚠️ High memory usage: ${newMetrics.memoryUsage}MB`);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [onMetricUpdate]);

  return (
    <div style={{ fontSize: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span>Message Delivery:</span>
        <span style={{ 
          color: metrics.messageDeliveryTime > 100 ? '#dc3545' : '#28a745',
          fontWeight: 'bold'
        }}>
          {metrics.messageDeliveryTime}ms
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span>Memory Usage:</span>
        <span style={{ 
          color: metrics.memoryUsage > 10 ? '#ffc107' : '#28a745',
          fontWeight: 'bold'
        }}>
          {metrics.memoryUsage}MB
        </span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Connections:</span>
        <span style={{ fontWeight: 'bold', color: '#007bff' }}>
          {metrics.activeConnections}
        </span>
      </div>
    </div>
  );
};

export default CrossPlatformTestExample;
