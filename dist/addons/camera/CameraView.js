import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useRef, useEffect } from 'react';
import { useCamera } from './useCamera';
import './CameraView.css';
export const CameraView = ({ isOpen, onClose, onCapture, mode = 'photo', maxVideoDuration = 30, className = '', }) => {
    const videoRef = useRef(null);
    const timerRef = useRef(null);
    const [recordingTime, setRecordingTime] = React.useState(0);
    const { isCapturing, stream, error, openCamera, closeCamera, capturePhoto, startVideoRecording, stopVideoRecording, switchCamera, } = useCamera({
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
        }
        else if (!isOpen && stream) {
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
        }
        else {
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
        }
        else {
            if (isCapturing) {
                await handleStopRecording();
            }
            else {
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
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: `camera-view ${className}`, children: _jsx("div", { className: "camera-container", children: error ? (_jsx("div", { className: "camera-error", children: _jsxs("div", { className: "error-message", children: [_jsx("h3", { children: "Camera Error" }), _jsx("p", { children: error }), _jsx("button", { className: "close-button", onClick: handleClose, children: "Close" })] }) })) : (_jsxs(_Fragment, { children: [_jsx("video", { ref: videoRef, className: "camera-preview", autoPlay: true, playsInline: true, muted: true }), isCapturing && mode === 'video' && (_jsx("div", { className: "capturing-overlay", children: _jsxs("div", { className: "recording-indicator", children: [_jsx("div", { className: "recording-dot" }), _jsxs("span", { children: ["REC ", formatTime(recordingTime)] })] }) })), _jsxs("div", { className: "camera-controls", children: [_jsx("button", { className: "control-button", onClick: handleClose, disabled: isCapturing, children: "\u2715" }), _jsx("button", { className: `control-button capture-button ${isCapturing ? 'recording' : ''}`, onClick: handleCapture, disabled: !stream, children: isCapturing ? (mode === 'video' ? '⏹️' : '📷') : (mode === 'video' ? '🎥' : '📷') }), _jsx("button", { className: "control-button", onClick: switchCamera, disabled: isCapturing, children: "\uD83D\uDD04" })] })] })) }) }));
};
//# sourceMappingURL=CameraView.js.map