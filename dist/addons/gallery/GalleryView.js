import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useGallery } from './useGallery';
import './GalleryView.css';
export const GalleryView = ({ files, onFileSelect, onFileDelete, className = '', maxItems = 20, gridColumns = 4, showDeleteButton = true, }) => {
    const { openViewer, deleteFile } = useGallery({
        files,
        onFileSelect,
        onFileDelete,
    });
    const displayFiles = files.slice(0, maxItems);
    const getFileIcon = (type) => {
        switch (type) {
            case 'image':
                return '🖼️';
            case 'video':
                return '🎥';
            case 'audio':
                return '🎵';
            case 'document':
                return '📄';
            default:
                return '📎';
        }
    };
    const handleFileClick = (file) => {
        openViewer(file);
        onFileSelect === null || onFileSelect === void 0 ? void 0 : onFileSelect(file);
    };
    const handleDelete = (e, fileId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this file?')) {
            deleteFile(fileId);
        }
    };
    const formatFileSize = (bytes) => {
        if (!bytes)
            return '';
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    if (files.length === 0) {
        return (_jsx("div", { className: `gallery-view empty ${className}`, children: _jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCC1" }), _jsx("p", { children: "No files to display" })] }) }));
    }
    return (_jsxs("div", { className: `gallery-view ${className}`, children: [_jsx("div", { className: "gallery-grid", style: { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }, children: displayFiles.map((file) => (_jsxs("div", { className: "gallery-item", onClick: () => handleFileClick(file), children: [file.type === 'image' ? (_jsx("img", { src: file.thumbnailUrl || file.url, alt: file.name, className: "media-thumbnail", loading: "lazy" })) : file.type === 'video' ? (_jsxs("div", { className: "video-thumbnail", children: [_jsx("video", { src: file.url, className: "media-thumbnail", muted: true, preload: "metadata" }), _jsx("div", { className: "play-overlay", children: _jsx("div", { className: "play-button", children: "\u25B6\uFE0F" }) })] })) : file.type === 'audio' ? (_jsxs("div", { className: "audio-thumbnail", children: [_jsx("div", { className: "audio-icon", children: "\uD83C\uDFB5" }), _jsx("p", { children: file.name }), _jsx("small", { children: formatFileSize(file.size) })] })) : (_jsxs("div", { className: "file-thumbnail", children: [_jsx("div", { className: "file-icon", children: getFileIcon(file.type) }), _jsx("p", { children: file.name }), _jsx("small", { children: formatFileSize(file.size) })] })), showDeleteButton && (_jsx("button", { className: "delete-button", onClick: (e) => handleDelete(e, file.id), title: "Delete file", children: "\u2715" }))] }, file.id))) }), files.length > maxItems && (_jsx("div", { className: "gallery-footer", children: _jsxs("p", { children: ["Showing ", maxItems, " of ", files.length, " files"] }) }))] }));
};
//# sourceMappingURL=GalleryView.js.map