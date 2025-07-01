import { User as FirebaseUser } from 'firebase/auth';
export declare class AuthService {
    private auth;
    private db;
    signIn(email: string, password: string): Promise<FirebaseUser>;
    signUp(email: string, password: string, displayName: string): Promise<FirebaseUser>;
    signOut(): Promise<void>;
    resetPassword(email: string): Promise<void>;
    updateUserProfile(updates: {
        displayName?: string;
        photoURL?: string;
    }): Promise<void>;
    onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void;
    getCurrentUser(): FirebaseUser | null;
    private createUserDocument;
    private updateUserOnlineStatus;
    private handleAuthError;
}
export declare const authService: AuthService;
