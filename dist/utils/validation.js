import { MessageTypes } from '../types';
/**
 * Validation utilities matching RN-Firebase-Chat
 */
// Validate message data
export const validateMessage = (message) => {
    if (!message.senderId || !message.type || !message.createdAt) {
        return false;
    }
    // Validate based on message type
    switch (message.type) {
        case MessageTypes.text:
            return Boolean(message.text && message.text.trim().length > 0);
        case MessageTypes.image:
        case MessageTypes.video:
        case MessageTypes.file:
            return Boolean(message.path);
        case MessageTypes.system:
            return Boolean(message.text);
        default:
            return false;
    }
};
// Validate conversation data
export const validateConversation = (conversation) => {
    return Boolean(conversation.id &&
        conversation.members &&
        Array.isArray(conversation.members) &&
        conversation.members.length > 0 &&
        conversation.updatedAt);
};
// Validate user ID
export const validateUserId = (userId) => {
    return Boolean(userId && typeof userId === 'string' && userId.trim().length > 0);
};
// Validate conversation ID
export const validateConversationId = (conversationId) => {
    return Boolean(conversationId && typeof conversationId === 'string' && conversationId.trim().length > 0);
};
// Validate email format
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
// Validate file extension
export const validateFileExtension = (filename, allowedExtensions) => {
    var _a;
    if (!filename || !allowedExtensions || allowedExtensions.length === 0) {
        return false;
    }
    const extension = (_a = filename.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    return Boolean(extension && allowedExtensions.includes(extension));
};
// Validate file size
export const validateFileSize = (fileSize, maxSize) => {
    return fileSize > 0 && fileSize <= maxSize;
};
// Validate message text length
export const validateMessageLength = (text, maxLength = 1000) => {
    return Boolean(text && text.length <= maxLength);
};
// Validate array of user IDs
export const validateUserIds = (userIds) => {
    return Array.isArray(userIds) &&
        userIds.length > 0 &&
        userIds.every(id => validateUserId(id));
};
// Validate date
export const validateDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};
// Sanitize text input
export const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .slice(0, 10000); // Limit length for safety
};
// Validate and sanitize conversation name
export const validateConversationName = (name) => {
    const sanitized = sanitizeText(name);
    const isValid = sanitized.length >= 1 && sanitized.length <= 100;
    return { isValid, sanitized };
};
//# sourceMappingURL=validation.js.map