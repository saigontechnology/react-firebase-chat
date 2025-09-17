import React, { useState } from 'react';
import {
  ChatProvider,
  ChatScreen,
  useChat,
  useChatContext,
  useFileUpload,
  useCamera,
  useGallery,
  IUser,
  Message,
  CameraView,
  FileUploader,
  GalleryView
} from 'react-firebase-chat';

// Advanced usage example with custom components and all addons
const AdvancedChatExample: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Firebase configuration
  const firebaseConfig = {
    apiKey: "your-web-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
  };

  const currentUser: IUser = {
    id: 'advanced-user-456',
    name: 'Alice Johnson',
    avatar: 'https://example.com/alice.jpg'
  };

  return (
    <ChatProvider
      currentUser={currentUser}
      firebaseConfig={firebaseConfig}
      encryptionKey="advanced-encryption-key-for-security"
    >
      <AdvancedChatApp 
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
      />
    </ChatProvider>
  );
};

// Main chat application component
const AdvancedChatApp: React.FC<{
  selectedConversation: string | null;
  setSelectedConversation: (id: string | null) => void;
}> = ({ selectedConversation, setSelectedConversation }) => {
  const { currentUser } = useChatContext();
  const [showCamera, setShowCamera] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const partnerInfo = {
    id: 'advanced-partner-789',
    name: 'Bob Wilson',
    avatar: 'https://example.com/bob.jpg',
  };

  if (!selectedConversation) {
    return <ConversationSelector onSelect={setSelectedConversation} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Sidebar with addons */}
      <div style={{
        width: '300px',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AddonSidebar
          showCamera={showCamera}
          setShowCamera={setShowCamera}
          showFileUpload={showFileUpload}
          setShowFileUpload={setShowFileUpload}
          showGallery={showGallery}
          setShowGallery={setShowGallery}
        />
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatScreen
          conversationId={selectedConversation}
          memberIds={[partnerInfo.id]}
          partners={[partnerInfo]}
          onSend={(messages) => console.log('Advanced messages sent:', messages)}
          showCamera={false} // We'll use the sidebar camera
          showFileUpload={false} // We'll use the sidebar uploader
          showGallery={false} // We'll use the sidebar gallery
          style={{ flex: 1 }}
        />
      </div>

      {/* Camera modal */}
      {showCamera && (
        <CameraModal onClose={() => setShowCamera(false)} />
      )}

      {/* File upload modal */}
      {showFileUpload && (
        <FileUploadModal onClose={() => setShowFileUpload(false)} />
      )}

      {/* Gallery modal */}
      {showGallery && (
        <GalleryModal onClose={() => setShowGallery(false)} />
      )}
    </div>
  );
};

// Conversation selector component
const ConversationSelector: React.FC<{
  onSelect: (id: string) => void;
}> = ({ onSelect }) => {
  const conversations = [
    { id: 'conv-1', name: 'Team Chat', latestMessage: 'Let\'s discuss the project' },
    { id: 'conv-2', name: 'Bob Wilson', latestMessage: 'How are you doing?' },
    { id: 'conv-3', name: 'Project Alpha', latestMessage: 'Meeting at 3 PM' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '24px'
    }}>
      <h2>Select a Conversation</h2>
      <div style={{ width: '100%', maxWidth: '400px', marginTop: '24px' }}>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            style={{
              padding: '16px',
              margin: '8px 0',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: '#fff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h4 style={{ margin: '0 0 8px 0' }}>{conv.name}</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              {conv.latestMessage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Addon sidebar component
const AddonSidebar: React.FC<{
  showCamera: boolean;
  setShowCamera: (show: boolean) => void;
  showFileUpload: boolean;
  setShowFileUpload: (show: boolean) => void;
  showGallery: boolean;
  setShowGallery: (show: boolean) => void;
}> = ({
  showCamera,
  setShowCamera,
  showFileUpload,
  setShowFileUpload,
  showGallery,
  setShowGallery
}) => {
  const addonButtons = [
    {
      icon: '📷',
      label: 'Camera',
      action: () => setShowCamera(!showCamera),
      active: showCamera
    },
    {
      icon: '📁',
      label: 'File Upload',
      action: () => setShowFileUpload(!showFileUpload),
      active: showFileUpload
    },
    {
      icon: '🖼️',
      label: 'Gallery',
      action: () => setShowGallery(!showGallery),
      active: showGallery
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '16px' }}>Chat Addons</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {addonButtons.map((button) => (
          <button
            key={button.label}
            onClick={button.action}
            style={{
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: button.active ? '#007bff' : '#fff',
              color: button.active ? '#fff' : '#333',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '20px' }}>{button.icon}</span>
            <span>{button.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Camera modal component
const CameraModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { capturePhoto, captureVideo, isCapturing, error } = useCamera();

  const handlePhotoCapture = async () => {
    try {
      const photo = await capturePhoto();
      console.log('Photo captured:', photo);
      // Send photo as message
      onClose();
    } catch (err) {
      console.error('Photo capture failed:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%'
      }}>
        <h3>Camera Capture</h3>
        <CameraView
          onPhotoCapture={handlePhotoCapture}
          onVideoCapture={async (video) => {
            console.log('Video captured:', video);
            onClose();
          }}
          onClose={onClose}
        />
        {error && (
          <p style={{ color: 'red', marginTop: '16px' }}>
            Camera error: {error}
          </p>
        )}
      </div>
    </div>
  );
};

// File upload modal component
const FileUploadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { uploadFile, uploading, progress, error } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx']
  });

  const handleFileUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        const url = await uploadFile(file);
        console.log('File uploaded:', url);
        // Send file as message
      }
      onClose();
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3>File Upload</h3>
        <FileUploader
          onFilesSelected={handleFileUpload}
          maxFiles={5}
          className="custom-uploader"
        />
        {uploading && (
          <div style={{ marginTop: '16px' }}>
            <p>Uploading... {Math.round(progress)}%</p>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e0e0e0',
              borderRadius: '2px'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#007bff',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
        {error && (
          <p style={{ color: 'red', marginTop: '16px' }}>
            Upload error: {error}
          </p>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Gallery modal component
const GalleryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { files, loading, deleteFile } = useGallery();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3>Media Gallery</h3>
        <GalleryView
          files={files}
          onFileSelect={(file) => {
            console.log('File selected from gallery:', file);
            // Send selected file as message
            onClose();
          }}
          onFileDelete={deleteFile}
          loading={loading}
        />
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AdvancedChatExample;
