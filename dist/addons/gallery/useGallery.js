import { useState, useCallback } from 'react';
export const useGallery = ({ files, onFileSelect, onFileDelete, }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const openViewer = useCallback((file) => {
        const index = files.findIndex(f => f.id === file.id);
        setCurrentIndex(index !== -1 ? index : 0);
        setSelectedFile(file);
        setIsViewerOpen(true);
        onFileSelect === null || onFileSelect === void 0 ? void 0 : onFileSelect(file);
    }, [files, onFileSelect]);
    const closeViewer = useCallback(() => {
        setIsViewerOpen(false);
        setSelectedFile(null);
    }, []);
    const nextFile = useCallback(() => {
        if (files.length === 0)
            return;
        const nextIndex = (currentIndex + 1) % files.length;
        setCurrentIndex(nextIndex);
        setSelectedFile(files[nextIndex]);
        onFileSelect === null || onFileSelect === void 0 ? void 0 : onFileSelect(files[nextIndex]);
    }, [files, currentIndex, onFileSelect]);
    const previousFile = useCallback(() => {
        if (files.length === 0)
            return;
        const prevIndex = currentIndex === 0 ? files.length - 1 : currentIndex - 1;
        setCurrentIndex(prevIndex);
        setSelectedFile(files[prevIndex]);
        onFileSelect === null || onFileSelect === void 0 ? void 0 : onFileSelect(files[prevIndex]);
    }, [files, currentIndex, onFileSelect]);
    const deleteFile = useCallback((fileId) => {
        onFileDelete === null || onFileDelete === void 0 ? void 0 : onFileDelete(fileId);
        // If the deleted file was selected, close viewer or select next file
        if (selectedFile && selectedFile.id === fileId) {
            const remainingFiles = files.filter(f => f.id !== fileId);
            if (remainingFiles.length === 0) {
                closeViewer();
            }
            else {
                const nextIndex = currentIndex < remainingFiles.length ? currentIndex : 0;
                setCurrentIndex(nextIndex);
                setSelectedFile(remainingFiles[nextIndex]);
            }
        }
    }, [files, selectedFile, currentIndex, onFileDelete, closeViewer]);
    return {
        selectedFile,
        isViewerOpen,
        currentIndex,
        openViewer,
        closeViewer,
        nextFile,
        previousFile,
        deleteFile,
    };
};
//# sourceMappingURL=useGallery.js.map