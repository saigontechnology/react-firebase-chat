import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useCallback } from 'react';
import { useFileUpload } from './useFileUpload';
import './FileUploader.css';
export const FileUploader = ({ onFileSelect, onUploadProgress, onUploadComplete, onError, accept = '*/*', multiple = false, maxFiles = 5, maxFileSize = 10 * 1024 * 1024, // 10MB
className = '', disabled = false, children, }) => {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const { uploadFiles, uploading, progress, error: uploadError, } = useFileUpload({
        onUploadProgress,
        onUploadComplete: (url) => {
            onUploadComplete === null || onUploadComplete === void 0 ? void 0 : onUploadComplete([url]);
        },
        onError,
        maxFileSize,
    });
    const validateFiles = useCallback((files) => {
        const fileArray = Array.from(files);
        if (fileArray.length > maxFiles) {
            onError === null || onError === void 0 ? void 0 : onError(new Error(`Maximum ${maxFiles} files allowed`));
            return [];
        }
        const validFiles = fileArray.filter(file => {
            if (file.size > maxFileSize) {
                onError === null || onError === void 0 ? void 0 : onError(new Error(`File "${file.name}" exceeds ${maxFileSize / (1024 * 1024)}MB limit`));
                return false;
            }
            return true;
        });
        return validFiles;
    }, [maxFiles, maxFileSize, onError]);
    const handleFileSelect = useCallback((files) => {
        const validFiles = validateFiles(files);
        if (validFiles.length > 0) {
            setSelectedFiles(validFiles);
            onFileSelect(validFiles);
        }
    }, [validateFiles, onFileSelect]);
    const handleInputChange = useCallback((event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleFileSelect(Array.from(files));
        }
    }, [handleFileSelect]);
    const handleDragEnter = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);
    const handleDragLeave = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
    }, []);
    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);
    const handleDrop = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        if (disabled)
            return;
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(Array.from(files));
        }
    }, [disabled, handleFileSelect]);
    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);
    const handleUpload = useCallback(async () => {
        if (selectedFiles.length > 0) {
            try {
                const urls = await uploadFiles(selectedFiles);
                onUploadComplete === null || onUploadComplete === void 0 ? void 0 : onUploadComplete(urls);
                setSelectedFiles([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
            catch (error) {
                onError === null || onError === void 0 ? void 0 : onError(error);
            }
        }
    }, [selectedFiles, uploadFiles, onUploadComplete, onError]);
    const removeFile = useCallback((index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFileSelect(newFiles);
    }, [selectedFiles, onFileSelect]);
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    return (_jsxs("div", { className: `file-uploader ${className} ${isDragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: accept, multiple: multiple, onChange: handleInputChange, style: { display: 'none' }, disabled: disabled }), children ? (_jsx("div", { onClick: handleClick, children: children })) : (_jsx("div", { className: "upload-area", onClick: handleClick, onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop, children: uploading ? (_jsxs("div", { className: "upload-progress", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${progress}%` } }) }), _jsxs("p", { children: ["Uploading... ", Math.round(progress), "%"] })] })) : (_jsxs("div", { className: "upload-placeholder", children: [_jsx("div", { className: "upload-icon", children: "\uD83D\uDCC1" }), _jsx("p", { children: "Click to select files or drag and drop" }), _jsxs("small", { children: ["Max ", maxFiles, " files, ", formatFileSize(maxFileSize), " each"] })] })) })), selectedFiles.length > 0 && (_jsxs("div", { className: "selected-files", children: [_jsx("h4", { children: "Selected Files:" }), selectedFiles.map((file, index) => (_jsxs("div", { className: "file-item", children: [_jsx("span", { className: "file-name", children: file.name }), _jsxs("span", { className: "file-size", children: ["(", formatFileSize(file.size), ")"] }), _jsx("button", { className: "remove-button", onClick: () => removeFile(index), disabled: uploading, children: "\u2715" })] }, index))), !uploading && (_jsx("button", { className: "upload-button", onClick: handleUpload, disabled: selectedFiles.length === 0, children: "Upload Files" }))] })), uploadError && (_jsx("div", { className: "upload-error", children: uploadError }))] }));
};
//# sourceMappingURL=FileUploader.js.map