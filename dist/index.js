// Main export file for React Firebase Chat library
// Following the ReactJS Companion Library Documentation
// Core types and interfaces - RN-Firebase-Chat compatible
export * from './types';
// Firebase configuration and services
export * from './services/firebase';
export * from './services/auth';
export * from './services/chat';
// React components
export * from './components/Chat';
export * from './components/SimpleChat';
export * from './components/ChatScreen';
export * from './components/MessageList';
export * from './components/MessageInput';
export * from './components/UserAvatar';
export * from './components/TypingIndicator';
export { ConnectionStatus as ConnectionStatusComponent } from './components/ConnectionStatus';
// Hooks
export * from './hooks/useAuth';
export { useChat } from './hooks/useChat';
export * from './hooks/useMessages';
export * from './hooks/useTyping';
// Context providers
export * from './context/ChatProvider';
export * from './context/AuthProvider';
// Addons (Web-specific features) - aliased to avoid conflicts
export { 
// Camera addon
CameraView, useCamera } from './addons/camera';
export { 
// File upload addon
FileUploader, useFileUpload } from './addons/fileUpload';
export { 
// Gallery addon
GalleryView, MediaViewer, useGallery } from './addons/gallery';
// Utilities - RN-Firebase-Chat compatible
export * from './utils/formatters';
export * from './utils/validation';
export * from './utils/encryption';
// Styles
import './styles/index.css';
//# sourceMappingURL=index.js.map