import React from 'react';
import { SimpleUser, Message } from '../types';
export interface SimpleChatProps {
    roomId: string;
    currentUser: SimpleUser;
    onSend?: (messages: Message[]) => void;
    style?: React.CSSProperties;
    className?: string;
    showTypingIndicator?: boolean;
    placeholder?: string;
    maxMessageLength?: number;
}
/**
 * Simple Chat component that doesn't require authentication
 * Perfect for quick integration and testing
 */
export declare const SimpleChat: React.FC<SimpleChatProps>;
