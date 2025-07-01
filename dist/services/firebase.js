import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.initialized = false;
    }
    initialize(config) {
        if (this.initialized) {
            console.warn('Firebase already initialized');
            return;
        }
        try {
            // Check if Firebase app already exists
            const existingApps = getApps();
            if (existingApps.length > 0) {
                this.app = existingApps[0];
            }
            else {
                this.app = initializeApp(config);
            }
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);
            this.storage = getStorage(this.app);
            this.initialized = true;
            console.log('Firebase initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Firebase:', error);
            throw new Error('Firebase initialization failed');
        }
    }
    getFirestore() {
        if (!this.db) {
            throw new Error('Firebase not initialized. Call initialize() first.');
        }
        return this.db;
    }
    getAuth() {
        if (!this.auth) {
            throw new Error('Firebase not initialized. Call initialize() first.');
        }
        return this.auth;
    }
    getStorage() {
        if (!this.storage) {
            throw new Error('Firebase not initialized. Call initialize() first.');
        }
        return this.storage;
    }
    isInitialized() {
        return this.initialized;
    }
    reset() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.initialized = false;
    }
}
// Export singleton instance
export const firebaseService = new FirebaseService();
// Export individual getters for convenience
export const getFirebaseAuth = () => firebaseService.getAuth();
export const getFirebaseFirestore = () => firebaseService.getFirestore();
export const getFirebaseStorage = () => firebaseService.getStorage();
// Export initialization function
export const initializeFirebase = (config) => {
    firebaseService.initialize(config);
};
//# sourceMappingURL=firebase.js.map