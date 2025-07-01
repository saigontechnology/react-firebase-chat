import React from 'react';
import { Message } from '../types';
import './ChatScreen.css';
export interface ChatScreenProps {
    conversationId: string;
    partners: Array<{
        id: string;
        name: string;
        avatar?: string;
    }>;
    memberIds: string[];
    style?: React.CSSProperties;
    className?: string;
    onSend?: (messages: Message[]) => void;
    showCamera?: boolean;
    showFileUpload?: boolean;
    showGallery?: boolean;
}
export declare const ChatScreen: React.FC<ChatScreenProps>;
