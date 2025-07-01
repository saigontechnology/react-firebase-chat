import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { UserAvatar } from './UserAvatar';
const MessageItem = ({ message, isOwn, showAvatar, showTimestamp, onUpdate, onDelete, }) => {
    var _a;
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text);
    const [showActions, setShowActions] = useState(false);
    const handleEdit = () => {
        if (onUpdate && editText.trim() !== message.text) {
            onUpdate({ ...message, text: editText.trim() });
        }
        setIsEditing(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEdit();
        }
        else if (e.key === 'Escape') {
            setEditText(message.text);
            setIsEditing(false);
        }
    };
    const formatTime = (date) => {
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        if (diffInHours < 24) {
            return format(date, 'HH:mm');
        }
        else if (diffInHours < 48) {
            return `Yesterday ${format(date, 'HH:mm')}`;
        }
        else {
            return format(date, 'MMM d, HH:mm');
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: `flex items-start space-x-3 px-4 py-2 group hover:bg-gray-50 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`, onMouseEnter: () => setShowActions(true), onMouseLeave: () => setShowActions(false), children: [showAvatar && _jsx(UserAvatar, { user: message.user, size: "small" }), !showAvatar && _jsx("div", { className: "w-8" }), _jsxs("div", { className: `flex-1 ${isOwn ? 'text-right' : ''}`, children: [showTimestamp && (_jsxs("div", { className: `text-xs text-gray-500 mb-1 ${isOwn ? 'text-right' : ''}`, children: [_jsx("span", { className: "font-medium", children: message.user.displayName }), _jsx("span", { className: "ml-2", children: formatTime(message.createdAt) })] })), _jsxs("div", { className: `inline-block max-w-xs lg:max-w-md px-3 py-2 rounded-lg relative ${isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'}`, children: [isEditing ? (_jsx("textarea", { value: editText, onChange: (e) => setEditText(e.target.value), onKeyDown: handleKeyDown, onBlur: handleEdit, className: "w-full bg-transparent resize-none outline-none", autoFocus: true })) : (_jsxs(_Fragment, { children: [message.type === 'image' && ((_a = message.metadata) === null || _a === void 0 ? void 0 : _a.imageUrl) ? (_jsxs("div", { className: "space-y-2", children: [_jsx("img", { src: message.metadata.imageUrl, alt: "Shared image", className: "max-w-full h-auto rounded", loading: "lazy" }), message.text && _jsx("p", { className: "text-sm", children: message.text })] })) : (_jsx("p", { className: "whitespace-pre-wrap break-words", children: message.text })), message.updatedAt && (_jsx("span", { className: "text-xs opacity-70 ml-2", children: "(edited)" }))] })), isOwn && (_jsxs("div", { className: "absolute -bottom-1 -right-1", children: [message.status === 'sending' && (_jsx("div", { className: "w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" })), message.status === 'sent' && (_jsx("div", { className: "text-xs text-white/70", children: "\u2713" })), message.status === 'delivered' && (_jsx("div", { className: "text-xs text-white/70", children: "\u2713\u2713" })), message.status === 'read' && (_jsx("div", { className: "text-xs text-blue-200", children: "\u2713\u2713" }))] }))] })] }), showActions && isOwn && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, className: "flex space-x-1", children: [_jsx("button", { onClick: () => setIsEditing(true), className: "p-1 text-gray-400 hover:text-gray-600 rounded", title: "Edit message", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) }) }), _jsx("button", { onClick: () => onDelete === null || onDelete === void 0 ? void 0 : onDelete(message.id), className: "p-1 text-gray-400 hover:text-red-600 rounded", title: "Delete message", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }) })] }))] }));
};
export const MessageList = ({ messages, currentUser, onMessageUpdate, onMessageDelete, className = '', }) => {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);
    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);
    // Handle scroll to detect if user is at bottom
    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
            setAutoScroll(isAtBottom);
        }
    };
    const shouldShowAvatar = (message, index) => {
        if (index === 0)
            return true;
        const prevMessage = messages[index - 1];
        return prevMessage.userId !== message.userId;
    };
    const shouldShowTimestamp = (message, index) => {
        if (index === 0)
            return true;
        const prevMessage = messages[index - 1];
        const timeDiff = message.createdAt.getTime() - prevMessage.createdAt.getTime();
        return timeDiff > 5 * 60 * 1000 || prevMessage.userId !== message.userId; // 5 minutes
    };
    if (messages.length === 0) {
        return (_jsx("div", { className: `flex-1 flex items-center justify-center p-8 ${className}`, children: _jsxs("div", { className: "text-center text-gray-500", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCAC" }), _jsx("p", { className: "text-lg font-medium", children: "No messages yet" }), _jsx("p", { className: "text-sm", children: "Start the conversation!" })] }) }));
    }
    return (_jsxs("div", { ref: containerRef, onScroll: handleScroll, className: `flex-1 overflow-y-auto space-y-1 ${className}`, children: [_jsx(AnimatePresence, { children: messages.map((message, index) => (_jsx(MessageItem, { message: message, isOwn: message.userId === currentUser.id, showAvatar: shouldShowAvatar(message, index), showTimestamp: shouldShowTimestamp(message, index), onUpdate: onMessageUpdate, onDelete: onMessageDelete }, message.id))) }), _jsx("div", { ref: messagesEndRef })] }));
};
//# sourceMappingURL=MessageList.js.map