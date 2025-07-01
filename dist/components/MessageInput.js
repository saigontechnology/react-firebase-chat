import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
export const MessageInput = ({ onSendMessage, onTyping, disabled = false, placeholder = 'Type a message...', maxLength = 1000, className = '', }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        if (value.length <= maxLength) {
            setMessage(value);
            // Handle typing indicator
            if (onTyping) {
                if (!isTyping && value.trim()) {
                    setIsTyping(true);
                    onTyping(true);
                }
                // Clear existing timeout
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                // Set new timeout to stop typing
                typingTimeoutRef.current = window.setTimeout(() => {
                    setIsTyping(false);
                    onTyping(false);
                }, 1000);
            }
        }
    }, [maxLength, onTyping, isTyping]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, []);
    const handleSend = useCallback(() => {
        var _a;
        const trimmedMessage = message.trim();
        if (trimmedMessage && !disabled) {
            onSendMessage(trimmedMessage);
            setMessage('');
            // Stop typing indicator
            if (isTyping && onTyping) {
                setIsTyping(false);
                onTyping(false);
            }
            // Clear timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            // Focus back to input
            (_a = textareaRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }, [message, disabled, onSendMessage, isTyping, onTyping]);
    const handlePaste = useCallback((e) => {
        const paste = e.clipboardData.getData('text');
        if (message.length + paste.length > maxLength) {
            e.preventDefault();
            const remaining = maxLength - message.length;
            setMessage(prev => prev + paste.slice(0, remaining));
        }
    }, [message.length, maxLength]);
    return (_jsxs("div", { className: `flex items-end space-x-2 p-4 border-t bg-white ${className}`, children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(TextareaAutosize, { ref: textareaRef, value: message, onChange: handleInputChange, onKeyDown: handleKeyDown, onPaste: handlePaste, placeholder: placeholder, disabled: disabled, maxRows: 5, minRows: 1, className: `
            w-full px-3 py-2 border border-gray-300 rounded-lg resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${message.length >= maxLength * 0.9 ? 'border-orange-300' : ''}
            ${message.length >= maxLength ? 'border-red-300' : ''}
          ` }), maxLength && (_jsxs("div", { className: "absolute bottom-1 right-2 text-xs text-gray-400", children: [message.length, "/", maxLength] }))] }), _jsx("button", { onClick: handleSend, disabled: disabled || !message.trim(), className: `
          px-4 py-2 rounded-lg font-medium transition-colors
          ${disabled || !message.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'}
        `, title: "Send message (Enter)", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" }) }) })] }));
};
//# sourceMappingURL=MessageInput.js.map