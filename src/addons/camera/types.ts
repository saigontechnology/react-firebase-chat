export interface CameraViewProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, type: 'photo' | 'video') => void;
  mode?: 'photo' | 'video';
  maxVideoDuration?: number; // in seconds
  className?: string;
}

export interface UseCameraProps {
  onCapture?: (blob: Blob, type: 'photo' | 'video') => void;
  onError?: (error: Error) => void;
}

export interface UseCameraReturn {
  isOpen: boolean;
  isCapturing: boolean;
  stream: MediaStream | null;
  error: string | null;
  openCamera: () => Promise<void>;
  closeCamera: () => void;
  capturePhoto: () => Promise<Blob | null>;
  startVideoRecording: () => Promise<void>;
  stopVideoRecording: () => Promise<Blob | null>;
  switchCamera: () => Promise<void>;
}

export interface CameraConstraints {
  video: {
    width?: { ideal: number };
    height?: { ideal: number };
    facingMode?: 'user' | 'environment';
  };
  audio?: boolean;
}
