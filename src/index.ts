// Main export file for React Firebase Chat library
// Following the ReactJS Companion Library Documentation

// Core types and interfaces - RN-Firebase-Chat compatible
export * from './types';

// Firebase configuration and services
export * from './services/firebase';
export * from './services/chat';
export * from './services/user';

// React components
export * from './components/ChatScreen';
export * from './components/MessageList';
export * from './components/MessageInput';
export * from './components/UserAvatar';
export * from './components/TypingIndicator';
export { ConnectionStatus as ConnectionStatusComponent } from './components/ConnectionStatus';

// Hooks
export { useChat } from './hooks/useChat';
export type { UseChatProps } from './hooks/useChat';
export * from './hooks/useMessages';
export * from './hooks/useTyping';
export { useDebounce } from './hooks/useDebounce';
export { useChatSelector } from './hooks/useChatSelector';

// Context providers
export * from './context/ChatProvider';

// Addons (Web-specific features) - aliased to avoid conflicts
export {
  // Camera addon
  CameraView,
  useCamera
} from './addons/camera';

export type {
  CameraViewProps,
  UseCameraProps,
  UseCameraReturn,
  CameraConstraints
} from './addons/camera';

export {
  // File upload addon
  FileUploader,
  useFileUpload
} from './addons/fileUpload';

export type {
  FileUploaderProps,
  UseFileUploadProps,
  UseFileUploadReturn,
  UploadedFile,
  FileUploadOptions
} from './addons/fileUpload';

export {
  // Gallery addon
  GalleryView,
  MediaViewer,
  useGallery
} from './addons/gallery';

export type {
  GalleryViewProps,
  MediaViewerProps,
  UseGalleryProps,
  UseGalleryReturn,
  MediaFile as GalleryMediaFile,
  MediaMetadata
} from './addons/gallery';

// Utilities - RN-Firebase-Chat compatible
export * from './utils/formatters';
export * from './utils/validation';
export * from './utils/encryption';
export * from './utils/constants';
export * from './utils/color';
export {
  sanitizeUserInput,
  validateFilePath,
  validateEncryptionKey,
  validateMessageContent,
  validateUserIdStrict,
  generateBadWordsRegex,
  filterBlackListWords,
  RateLimiter,
} from './utils/security';

// Styles
import './styles.css';
