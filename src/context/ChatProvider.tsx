import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { initializeFirebase } from '../services/firebase';
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

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  currentUser,
  firebaseConfig,
  encryptionKey,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        initializeFirebase(firebaseConfig);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };

    initializeApp();
  }, [firebaseConfig]);

  const value: ChatContextValue = {
    currentUser,
    isInitialized,
    firebaseConfig,
    encryptionKey,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === null) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
