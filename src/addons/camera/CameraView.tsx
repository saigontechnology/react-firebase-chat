import React, { useRef, useEffect } from 'react';
import { useCamera } from './useCamera';
import { CameraViewProps } from './types';
import './CameraView.css';

export const CameraView: React.FC<CameraViewProps> = ({
  isOpen,
  onClose,
  onCapture,
  mode = 'photo',
  maxVideoDuration = 30,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingTime, setRecordingTime] = React.useState(0);

  const {
    isCapturing,
    stream,
    error,
    openCamera,
    closeCamera,
    capturePhoto,
    startVideoRecording,
    stopVideoRecording,
    switchCamera,
  } = useCamera({
    onCapture,
    onError: (error) => console.error('Camera error:', error),
  });

  // Set video source when stream is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Open camera when component becomes visible
  useEffect(() => {
    if (isOpen && !stream) {
      openCamera();
    } else if (!isOpen && stream) {
      closeCamera();
    }
  }, [isOpen, stream, openCamera, closeCamera]);

  // Handle video recording timer
  useEffect(() => {
    if (isCapturing && mode === 'video') {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxVideoDuration) {
            handleStopRecording();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCapturing, mode, maxVideoDuration]);

  const handleCapture = async () => {
    if (mode === 'photo') {
      await capturePhoto();
    } else {
      if (isCapturing) {
        await handleStopRecording();
      } else {
        await startVideoRecording();
      }
    }
  };

  const handleStopRecording = async () => {
    await stopVideoRecording();
    setRecordingTime(0);
  };

  const handleClose = () => {
    closeCamera();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`camera-view ${className}`}>
      <div className="camera-container">
        {error ? (
          <div className="camera-error">
            <div className="error-message">
              <h3>Camera Error</h3>
              <p>{error}</p>
              <button
                className="close-button"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="camera-preview"
              autoPlay
              playsInline
              muted
            />

            {isCapturing && mode === 'video' && (
              <div className="capturing-overlay">
                <div className="recording-indicator">
                  <div className="recording-dot" />
                  <span>REC {formatTime(recordingTime)}</span>
                </div>
              </div>
            )}

            <div className="camera-controls">
              <button
                className="control-button"
                onClick={handleClose}
                disabled={isCapturing}
              >
                ✕
              </button>

              <button
                className={`control-button capture-button ${isCapturing ? 'recording' : ''}`}
                onClick={handleCapture}
                disabled={!stream}
              >
                {isCapturing ? (
                  mode === 'video' ? '⏹️' : '📷'
                ) : (
                  mode === 'video' ? '🎥' : '📷'
                )}
              </button>

              <button
                className="control-button"
                onClick={switchCamera}
                disabled={isCapturing}
              >
                🔄
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
