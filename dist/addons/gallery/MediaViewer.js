import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import './MediaViewer.css';
export const MediaViewer = ({ file, isOpen, onClose, onNext, onPrevious, className = '', }) => {
    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen)
            return;
        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    onPrevious === null || onPrevious === void 0 ? void 0 : onPrevious();
                    break;
                case 'ArrowRight':
                    onNext === null || onNext === void 0 ? void 0 : onNext();
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onNext, onPrevious]);
    // Prevent body scroll when viewer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);
    if (!isOpen || !file)
        return null;
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    const renderMediaContent = () => {
        switch (file.type) {
            case 'image':
                return (_jsx("img", { src: file.url, alt: file.name, className: "media-content" }));
            case 'video':
                return (_jsx("video", { src: file.url, controls: true, className: "media-content", autoPlay: true }));
            case 'audio':
                return (_jsxs("div", { className: "audio-player", children: [_jsxs("div", { className: "audio-info", children: [_jsx("h3", { children: file.name }), _jsx("p", { children: "Audio File" })] }), _jsx("audio", { src: file.url, controls: true, autoPlay: true })] }));
            default:
                return (_jsx("div", { className: "document-viewer", children: _jsxs("div", { className: "document-info", children: [_jsx("h3", { children: file.name }), _jsx("p", { children: "Document" }), _jsx("a", { href: file.url, target: "_blank", rel: "noopener noreferrer", className: "download-link", children: "Open File" })] }) }));
        }
    };
    return (_jsx("div", { className: `media-viewer ${className}`, onClick: handleBackdropClick, children: _jsxs("div", { className: "media-viewer-content", children: [renderMediaContent(), _jsxs("div", { className: "media-viewer-controls", children: [_jsx("button", { className: "viewer-button close-button", onClick: onClose, title: "Close", children: "\u2715" }), onPrevious && (_jsx("button", { className: "viewer-button nav-button", onClick: onPrevious, title: "Previous", children: "\u25C0" })), onNext && (_jsx("button", { className: "viewer-button nav-button", onClick: onNext, title: "Next", children: "\u25B6" })), _jsx("a", { href: file.url, download: file.name, className: "viewer-button download-button", title: "Download", children: "\u2B07" })] }), _jsxs("div", { className: "media-info", children: [_jsx("h3", { children: file.name }), file.size && (_jsxs("p", { children: [(file.size / 1024 / 1024).toFixed(2), " MB"] }))] })] }) }));
};
//# sourceMappingURL=MediaViewer.js.map