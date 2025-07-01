import React, { ReactNode } from 'react';
import { FirebaseConfig, IUser } from '../types';
export interface ChatContextValue {
    currentUser: IUser;
    isInitialized: boolean;
    firebaseConfig?: FirebaseConfig;
    encryptionKey?: string;
}
export interface ChatProviderProps {
    children: ReactNode;
    currentUser: IUser;
    firebaseConfig: FirebaseConfig;
    encryptionKey?: string;
}
export declare const ChatProvider: React.FC<ChatProviderProps>;
export declare const useChatContext: () => ChatContextValue;
