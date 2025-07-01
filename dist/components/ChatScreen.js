import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { useChatContext } from '../context/ChatProvider';
import { CameraView } from '../addons/camera/CameraView';
import { FileUploader } from '../addons/fileUpload/FileUploader';
import { GalleryView } from '../addons/gallery/GalleryView';
import { useChat } from '../hooks/useChat';
import './ChatScreen.css';
export const ChatScreen = ({ conversationId, partners, memberIds, style, className = '', onSend, showCamera = true, showFileUpload = true, showGallery = true, }) => {
    const { currentUser, isInitialized } = useChatContext();
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [galleryFiles, setGalleryFiles] = useState([]);
    // Convert currentUser from IUser to SimpleUser format for components
    const convertedUser = currentUser ? {
        id: currentUser._id.toString(),
        name: currentUser.name || 'Unknown User',
        avatar: currentUser.avatar,
    } : {
        id: '',
        name: 'Unknown User',
        avatar: undefined,
    };
    const { messages, loading, error, sendMessage, markAsRead, } = useChat({
        userId: (currentUser === null || currentUser === void 0 ? void 0 : currentUser._id.toString()) || '',
        conversationId,
    });
    const handleSendMessage = useCallback(async (text) => {
        try {
            await sendMessage(text);
        }
        catch (error) {
            console.error('Failed to send message:', error);
        }
    }, [sendMessage]);
    const handleSendTextMessage = useCallback(async (text) => {
        if (!text.trim())
            return;
        await handleSendMessage(text);
    }, [handleSendMessage]);
    const handleCameraCapture = useCallback(async (blob, type) => {
        // Upload the captured media and send as message
        // This would typically involve uploading to Firebase Storage
        console.log('Camera captured:', type, blob);
        setIsCameraOpen(false);
        // For now, we'll send a text message indicating media was captured
        const text = `${type === 'photo' ? 'Photo' : 'Video'} captured`;
        await handleSendMessage(text);
    }, [handleSendMessage]);
    const handleFileUpload = useCallback(async (files) => {
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
        return (_jsx("div", { className: `chat-screen loading ${className}`, style: style, children: _jsxs("div", { className: "loading-indicator", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Initializing chat..." })] }) }));
    }
    if (loading) {
        return (_jsx("div", { className: `chat-screen loading ${className}`, style: style, children: _jsxs("div", { className: "loading-indicator", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading messages..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: `chat-screen error ${className}`, style: style, children: _jsxs("div", { className: "error-message", children: [_jsx("h3", { children: "Error" }), _jsx("p", { children: error })] }) }));
    }
    return (_jsxs("div", { className: `chat-screen ${className}`, style: style, children: [_jsxs("div", { className: "chat-header", children: [_jsx("div", { className: "partner-info", children: partners.map((partner, index) => (_jsxs("div", { className: "partner", children: [partner.avatar && (_jsx("img", { src: partner.avatar, alt: partner.name, className: "partner-avatar" })), _jsxs("span", { className: "partner-name", children: [partner.name, index < partners.length - 1 && ', '] })] }, partner.id))) }), _jsx(ConnectionStatus, { status: "connected" })] }), _jsxs("div", { className: "messages-container", children: [_jsx(MessageList, { messages: messages, currentUser: convertedUser, onMessageUpdate: (message) => console.log('Message updated:', message), onMessageDelete: (messageId) => console.log('Delete message:', messageId) }), _jsx(TypingIndicator, { typingUsers: [] })] }), _jsxs("div", { className: "input-container", children: [_jsx(MessageInput, { onSendMessage: handleSendTextMessage, onTyping: (isTyping) => console.log('Typing:', isTyping), placeholder: "Type a message..." }), _jsxs("div", { className: "action-buttons", children: [showCamera && (_jsx("button", { className: "action-button camera-button", onClick: () => setIsCameraOpen(true), title: "Camera", children: "\uD83D\uDCF7" })), showFileUpload && (_jsx("button", { className: "action-button upload-button", onClick: () => setShowUploader(true), title: "Upload File", children: "\uD83D\uDCCE" }))] })] }), showGallery && galleryFiles.length > 0 && (_jsx("div", { className: "gallery-container", children: _jsx(GalleryView, { files: galleryFiles, onFileSelect: (file) => console.log('File selected:', file), onFileDelete: (fileId) => {
                        setGalleryFiles(prev => prev.filter((f) => f.id !== fileId));
                    } }) })), _jsx(CameraView, { isOpen: isCameraOpen, onClose: () => setIsCameraOpen(false), onCapture: handleCameraCapture, mode: "photo" }), showUploader && (_jsx("div", { className: "uploader-modal", children: _jsxs("div", { className: "uploader-content", children: [_jsx(FileUploader, { onFileSelect: handleFileUpload, onUploadComplete: (urls) => console.log('Upload complete:', urls), onError: (error) => console.error('Upload error:', error), accept: "image/*,video/*,.pdf,.doc,.docx,.txt", multiple: true, maxFiles: 5 }), _jsx("button", { className: "close-uploader", onClick: () => setShowUploader(false), children: "\u2715" })] }) }))] }));
};
//# sourceMappingURL=ChatScreen.js.map