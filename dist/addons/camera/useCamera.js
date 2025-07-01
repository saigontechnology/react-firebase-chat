import { useState, useRef, useCallback } from 'react';
export const useCamera = ({ onCapture, onError, } = {}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const getConstraints = useCallback(() => ({
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode,
        },
        audio: true,
    }), [facingMode]);
    const openCamera = useCallback(async () => {
        try {
            setError(null);
            const constraints = getConstraints();
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setIsOpen(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        }
        catch (err) {
            const errorMessage = 'Failed to access camera. Please ensure camera permissions are granted.';
            setError(errorMessage);
            onError === null || onError === void 0 ? void 0 : onError(new Error(errorMessage));
        }
    }, [getConstraints, onError]);
    const closeCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsOpen(false);
        setIsCapturing(false);
        setError(null);
        recordedChunksRef.current = [];
    }, [stream]);
    const capturePhoto = useCallback(async () => {
        if (!stream || !videoRef.current)
            return null;
        try {
            setIsCapturing(true);
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx)
                throw new Error('Failed to get canvas context');
            ctx.drawImage(video, 0, 0);
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        onCapture === null || onCapture === void 0 ? void 0 : onCapture(blob, 'photo');
                    }
                    setIsCapturing(false);
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            });
        }
        catch (err) {
            setIsCapturing(false);
            const errorMessage = 'Failed to capture photo';
            setError(errorMessage);
            onError === null || onError === void 0 ? void 0 : onError(new Error(errorMessage));
            return null;
        }
    }, [stream, onCapture, onError]);
    const startVideoRecording = useCallback(async () => {
        if (!stream)
            return;
        try {
            setIsCapturing(true);
            recordedChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
            });
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.start(100); // Collect data every 100ms
        }
        catch (err) {
            setIsCapturing(false);
            const errorMessage = 'Failed to start video recording';
            setError(errorMessage);
            onError === null || onError === void 0 ? void 0 : onError(new Error(errorMessage));
        }
    }, [stream, onError]);
    const stopVideoRecording = useCallback(async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            return null;
        }
        return new Promise((resolve) => {
            const mediaRecorder = mediaRecorderRef.current;
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                recordedChunksRef.current = [];
                setIsCapturing(false);
                onCapture === null || onCapture === void 0 ? void 0 : onCapture(blob, 'video');
                resolve(blob);
            };
            mediaRecorder.stop();
        });
    }, [onCapture]);
    const switchCamera = useCallback(async () => {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);
        if (isOpen) {
            closeCamera();
            // Small delay to ensure camera is properly closed
            setTimeout(() => {
                openCamera();
            }, 100);
        }
    }, [facingMode, isOpen, closeCamera, openCamera]);
    return {
        isOpen,
        isCapturing,
        stream,
        error,
        openCamera,
        closeCamera,
        capturePhoto,
        startVideoRecording,
        stopVideoRecording,
        switchCamera,
    };
};
//# sourceMappingURL=useCamera.js.map