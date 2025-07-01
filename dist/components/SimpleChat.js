import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus } from './ConnectionStatus';
import { useChat } from '../hooks/useChat';
import { useTyping } from '../hooks/useTyping';
/**
 * Simple Chat component that doesn't require authentication
 * Perfect for quick integration and testing
 */
export const SimpleChat = ({ roomId, currentUser, onSend, style, className = '', showTypingIndicator = true, placeholder = 'Type a message...', maxMessageLength = 1000, }) => {
    const [error, setError] = useState(null);
    const { messages, loading, sendMessage, deleteMessage, updateMessage, } = useChat({
        userId: currentUser.id,
        conversationId: roomId
    });
    const { typingUsers, setTyping } = useTyping(roomId, currentUser.id);
    const handleSendMessage = useCallback(async (text) => {
        try {
            setError(null);
            await sendMessage(text);
            // Call onSend callback if provided
            if (onSend) {
                const newMessage = {
                    id: Date.now().toString(), // Temporary ID
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
                };
                onSend([newMessage]);
            }
        }
        catch (err) {
            console.error('Failed to send message:', err);
            setError(err instanceof Error ? err.message : 'Failed to send message');
        }
    }, [sendMessage, currentUser, onSend]);
    const handleMessageUpdate = useCallback(async (message) => {
        try {
            setError(null);
            await updateMessage(message.id, message.text);
        }
        catch (err) {
            console.error('Failed to update message:', err);
            setError(err instanceof Error ? err.message : 'Failed to update message');
        }
    }, [updateMessage]);
    const handleMessageDelete = useCallback(async (messageId) => {
        try {
            setError(null);
            await deleteMessage(messageId);
        }
        catch (err) {
            console.error('Failed to delete message:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete message');
        }
    }, [deleteMessage]);
    const handleTyping = useCallback((isTyping) => {
        if (showTypingIndicator) {
            setTyping(isTyping);
        }
    }, [setTyping, showTypingIndicator]);
    if (loading) {
        return (_jsx("div", { className: `flex items-center justify-center h-96 ${className}`, style: style, children: _jsxs("div", { className: "flex flex-col items-center space-y-4", children: [_jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "text-gray-500", children: "Loading chat..." })] }) }));
    }
    return (_jsxs("div", { className: `flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`, style: style, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "Chat" }), _jsxs("span", { className: "text-sm text-gray-500", children: [messages.length, " message", messages.length !== 1 ? 's' : ''] })] }), _jsx(ConnectionStatus, { status: "connected" })] }), error && (_jsxs("div", { className: "p-3 bg-red-50 border-b border-red-200", children: [_jsx("p", { className: "text-sm text-red-600", children: error }), _jsx("button", { onClick: () => setError(null), className: "text-xs text-red-500 hover:text-red-700 underline", children: "Dismiss" })] })), _jsx(MessageList, { messages: messages, currentUser: currentUser, onMessageUpdate: handleMessageUpdate, onMessageDelete: handleMessageDelete, className: "flex-1" }), showTypingIndicator && (_jsx(TypingIndicator, { typingUsers: typingUsers })), _jsx(MessageInput, { onSendMessage: handleSendMessage, onTyping: showTypingIndicator ? handleTyping : undefined, placeholder: placeholder, maxLength: maxMessageLength })] }));
};
//# sourceMappingURL=SimpleChat.js.map