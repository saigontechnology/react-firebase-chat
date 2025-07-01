import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseConfig } from '../types';
declare class FirebaseService {
    private app;
    private db;
    private auth;
    private storage;
    private initialized;
    initialize(config: FirebaseConfig): void;
    getFirestore(): Firestore;
    getAuth(): Auth;
    getStorage(): FirebaseStorage;
    isInitialized(): boolean;
    reset(): void;
}
export declare const firebaseService: FirebaseService;
export declare const getFirebaseAuth: () => Auth;
export declare const getFirebaseFirestore: () => Firestore;
export declare const getFirebaseStorage: () => FirebaseStorage;
export declare const initializeFirebase: (config: FirebaseConfig) => void;
export {};
