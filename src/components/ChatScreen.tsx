import React, { useState, useEffect, useCallback } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { useChatContext } from '../context/ChatProvider';
import { CameraView } from '../addons/camera/CameraView';
import { FileUploader } from '../addons/fileUpload/FileUploader';
import { GalleryView } from '../addons/gallery/GalleryView';
import { useChat } from '../hooks/useChat';
import { Message, User, SimpleUser } from '../types';
import './ChatScreen.css';

export interface ChatScreenProps {
  conversationId: string;
  partners: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  memberIds: string[];
  style?: React.CSSProperties;
  className?: string;
  onSend?: (messages: Message[]) => void;
  showCamera?: boolean;
  showFileUpload?: boolean;
  showGallery?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  partners,
  memberIds,
  style,
  className = '',
  onSend,
  showCamera = true,
  showFileUpload = true,
  showGallery = true,
}) => {
  const { currentUser, isInitialized } = useChatContext();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);

  // Convert currentUser from IUser to SimpleUser format for components
  const convertedUser: SimpleUser = currentUser ? {
    id: currentUser._id.toString(),
    name: currentUser.name || 'Unknown User',
    avatar: currentUser.avatar,
  } : {
    id: '',
    name: 'Unknown User',
    avatar: undefined,
  };

  const {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
  } = useChat({
    userId: currentUser?._id.toString() || '',
    conversationId,
  });

  const handleSendMessage = useCallback(async (text: string) => {
    try {
      await sendMessage(text);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [sendMessage]);

  const handleSendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    await handleSendMessage(text);
  }, [handleSendMessage]);

  const handleCameraCapture = useCallback(async (blob: Blob, type: 'photo' | 'video') => {
    // Upload the captured media and send as message
    // This would typically involve uploading to Firebase Storage
    console.log('Camera captured:', type, blob);
    setIsCameraOpen(false);

    // For now, we'll send a text message indicating media was captured
    const text = `${type === 'photo' ? 'Photo' : 'Video'} captured`;
    await handleSendMessage(text);
  }, [handleSendMessage]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    // Handle file uploads
    console.log('Files uploaded:', files);
    setShowUploader(false);

    // For each file, send a text message indicating file was uploaded
    for (const file of files) {
      const text = `File uploaded: ${file.name}`;
      await handleSendMessage(text);
    }
  }, [handleSendMessage]);

  if (!isInitialized) {
    return (
      <div className={`chat-screen loading ${className}`} style={style}>
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Initializing chat...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`chat-screen loading ${className}`} style={style}>
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`chat-screen error ${className}`} style={style}>
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-screen ${className}`} style={style}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="partner-info">
          {partners.map((partner, index) => (
            <div key={partner.id} className="partner">
              {partner.avatar && (
                <img
                  src={partner.avatar}
                  alt={partner.name}
                  className="partner-avatar"
                />
              )}
              <span className="partner-name">
                {partner.name}
                {index < partners.length - 1 && ', '}
              </span>
            </div>
          ))}
        </div>
        <ConnectionStatus status="connected" />
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        <MessageList
          messages={messages}
          currentUser={convertedUser}
          onMessageUpdate={(message) => console.log('Message updated:', message)}
          onMessageDelete={(messageId) => console.log('Delete message:', messageId)}
        />
        <TypingIndicator typingUsers={[]} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        <MessageInput
          onSendMessage={handleSendTextMessage}
          onTyping={(isTyping) => console.log('Typing:', isTyping)}
          placeholder="Type a message..."
        />

        {/* Action Buttons */}
        <div className="action-buttons">
          {showCamera && (
            <button
              className="action-button camera-button"
              onClick={() => setIsCameraOpen(true)}
              title="Camera"
            >
              📷
            </button>
          )}

          {showFileUpload && (
            <button
              className="action-button upload-button"
              onClick={() => setShowUploader(true)}
              title="Upload File"
            >
              📎
            </button>
          )}
        </div>
      </div>

      {/* Gallery View */}
      {showGallery && galleryFiles.length > 0 && (
        <div className="gallery-container">
          <GalleryView
            files={galleryFiles}
            onFileSelect={(file) => console.log('File selected:', file)}
            onFileDelete={(fileId) => {
              setGalleryFiles(prev => prev.filter((f: any) => f.id !== fileId));
            }}
          />
        </div>
      )}

      {/* Camera Modal */}
      <CameraView
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        mode="photo"
      />

      {/* File Uploader Modal */}
      {showUploader && (
        <div className="uploader-modal">
          <div className="uploader-content">
            <FileUploader
              onFileSelect={handleFileUpload}
              onUploadComplete={(urls) => console.log('Upload complete:', urls)}
              onError={(error) => console.error('Upload error:', error)}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              multiple
              maxFiles={5}
            />
            <button
              className="close-uploader"
              onClick={() => setShowUploader(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
