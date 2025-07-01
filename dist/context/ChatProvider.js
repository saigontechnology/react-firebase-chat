import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from '../services/firebase';
const ChatContext = createContext(null);
export const ChatProvider = ({ children, currentUser, firebaseConfig, encryptionKey, }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        const initializeApp = async () => {
            try {
                initializeFirebase(firebaseConfig);
                setIsInitialized(true);
            }
            catch (error) {
                console.error('Failed to initialize Firebase:', error);
            }
        };
        initializeApp();
    }, [firebaseConfig]);
    const value = {
        currentUser,
        isInitialized,
        firebaseConfig,
        encryptionKey,
    };
    return (_jsx(ChatContext.Provider, { value: value, children: children }));
};
export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === null) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
//# sourceMappingURL=ChatProvider.js.map