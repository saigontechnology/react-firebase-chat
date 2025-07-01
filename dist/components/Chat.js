import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { useChat } from '../hooks/useChat';
import { useTyping } from '../hooks/useTyping';
export const Chat = ({ roomId, currentUser, config = {}, events = {}, className = '', style, }) => {
    const { messages, loading, error, sendMessage, deleteMessage, updateMessage, } = useChat({ userId: currentUser.id, conversationId: roomId });
    const { typingUsers, setTyping } = useTyping(roomId, currentUser.id);
    const handleSendMessage = async (text) => {
        var _a, _b;
        try {
            await sendMessage(text);
            (_a = events.onMessageSent) === null || _a === void 0 ? void 0 : _a.call(events, {
                id: '',
                text,
                userId: currentUser.id,
                user: {
                    uid: currentUser.id,
                    email: '',
                    displayName: currentUser.name,
                    photoURL: currentUser.avatar,
                    isOnline: true,
                    lastSeen: new Date(),
                    status: 'online',
                },
                createdAt: new Date(),
                type: 'text',
                status: 'sent',
            });
        }
        catch (error) {
            (_b = events.onError) === null || _b === void 0 ? void 0 : _b.call(events, error);
        }
    };
    const handleMessageUpdate = async (message) => {
        var _a, _b;
        try {
            await updateMessage(message.id, message.text);
            (_a = events.onMessageUpdated) === null || _a === void 0 ? void 0 : _a.call(events, message);
        }
        catch (error) {
            (_b = events.onError) === null || _b === void 0 ? void 0 : _b.call(events, error);
        }
    };
    const handleMessageDelete = async (messageId) => {
        var _a, _b;
        try {
            await deleteMessage(messageId);
            (_a = events.onMessageDeleted) === null || _a === void 0 ? void 0 : _a.call(events, messageId);
        }
        catch (error) {
            (_b = events.onError) === null || _b === void 0 ? void 0 : _b.call(events, error);
        }
    };
    const handleTyping = (isTyping) => {
        var _a, _b;
        setTyping(isTyping);
        if (isTyping) {
            (_a = events.onUserTyping) === null || _a === void 0 ? void 0 : _a.call(events, {
                uid: currentUser.id,
                displayName: currentUser.name,
                timestamp: new Date(),
            });
        }
        else {
            (_b = events.onUserStoppedTyping) === null || _b === void 0 ? void 0 : _b.call(events, currentUser.id);
        }
    };
    if (loading) {
        return (_jsx("div", { className: `flex items-center justify-center h-96 ${className}`, style: style, children: _jsxs("div", { className: "flex flex-col items-center space-y-4", children: [_jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "text-gray-500", children: "Loading chat..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: `flex items-center justify-center h-96 ${className}`, style: style, children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "text-red-500 text-4xl", children: "\u26A0\uFE0F" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-medium text-red-600", children: "Error loading chat" }), _jsx("p", { className: "text-sm text-gray-500", children: error })] })] }) }));
    }
    return (_jsxs("div", { className: `flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`, style: style, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Chat" }), _jsxs("span", { className: "text-sm text-gray-500", children: [messages.length, " message", messages.length !== 1 ? 's' : ''] })] }), _jsx(ConnectionStatus, { status: "connected" })] }), _jsx(MessageList, { messages: messages, currentUser: currentUser, onMessageUpdate: handleMessageUpdate, onMessageDelete: handleMessageDelete, className: "flex-1" }), config.enableTypingIndicator !== false && (_jsx(TypingIndicator, { typingUsers: typingUsers })), _jsx(MessageInput, { onSendMessage: handleSendMessage, onTyping: config.enableTypingIndicator !== false ? handleTyping : undefined, placeholder: "Type a message...", maxLength: config.maxMessageLength || 1000 })] }));
};
//# sourceMappingURL=Chat.js.map