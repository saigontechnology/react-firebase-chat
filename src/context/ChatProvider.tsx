import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { initializeFirebase, firebaseService } from "../services/firebase";
import { FirebaseConfig, IUser } from "../types";
import UserService from "../services/user";
import { generateEncryptionKey } from "../utils/encryption";

export interface ChatContextValue {
  currentUser: IUser;
  firebaseConfig?: FirebaseConfig;
  encryptionKey?: string;
  derivedKey: string | null;
}

export interface ChatProviderProps {
  children: ReactNode;
  currentUser: IUser;
  firebaseConfig?: FirebaseConfig;
  encryptionKey?: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  currentUser,
  firebaseConfig,
  encryptionKey,
}) => {
  const userServiceRef = useRef(UserService.getInstance());
  const [derivedKey, setDerivedKey] = useState<string | null>(null);

  useEffect(() => {
    if (firebaseService.isInitialized() || !firebaseConfig) {
      return;
    }

    const initializeApp = async () => {
      try {
        initializeFirebase(firebaseConfig);
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
      }
    };

    initializeApp();
  }, [firebaseConfig]);

  useEffect(() => {
    if (currentUser?.id) {
      userServiceRef.current.createUserIfNotExists(currentUser.id, {
        name: currentUser.name,
        avatar: currentUser.avatar,
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const password = encryptionKey || "saigontechnology@2026";
    generateEncryptionKey(password, { salt: "saigontechnology@2026" }).then(setDerivedKey);
  }, [encryptionKey]);

  const value: ChatContextValue = {
    currentUser,
    firebaseConfig,
    encryptionKey,
    derivedKey,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === null) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
