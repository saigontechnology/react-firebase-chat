import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, updateProfile, onAuthStateChanged, } from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase';
export class AuthService {
    constructor() {
        this.auth = getFirebaseAuth();
        this.db = getFirebaseFirestore();
    }
    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            await this.updateUserOnlineStatus(userCredential.user.uid, true);
            return userCredential.user;
        }
        catch (error) {
            console.error('Sign in error:', error);
            throw this.handleAuthError(error);
        }
    }
    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            // Update profile with display name
            await updateProfile(user, { displayName });
            // Create user document in Firestore
            await this.createUserDocument(user, displayName);
            return user;
        }
        catch (error) {
            console.error('Sign up error:', error);
            throw this.handleAuthError(error);
        }
    }
    // Sign out
    async signOut() {
        try {
            const currentUser = this.auth.currentUser;
            if (currentUser) {
                await this.updateUserOnlineStatus(currentUser.uid, false);
            }
            await firebaseSignOut(this.auth);
        }
        catch (error) {
            console.error('Sign out error:', error);
            throw this.handleAuthError(error);
        }
    }
    // Reset password
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
        }
        catch (error) {
            console.error('Password reset error:', error);
            throw this.handleAuthError(error);
        }
    }
    // Update user profile
    async updateUserProfile(updates) {
        try {
            const user = this.auth.currentUser;
            if (!user)
                throw new Error('No authenticated user');
            await updateProfile(user, updates);
            // Update user document in Firestore
            const userRef = doc(this.db, 'users', user.uid);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        }
        catch (error) {
            console.error('Update profile error:', error);
            throw this.handleAuthError(error);
        }
    }
    // Listen to authentication state changes
    onAuthStateChanged(callback) {
        return onAuthStateChanged(this.auth, callback);
    }
    // Get current user
    getCurrentUser() {
        return this.auth.currentUser;
    }
    // Private methods
    async createUserDocument(user, displayName) {
        const userRef = doc(this.db, 'users', user.uid);
        const userData = {
            uid: user.uid,
            email: user.email || '',
            displayName: displayName,
            photoURL: user.photoURL || undefined,
            isOnline: true,
            lastSeen: new Date(),
            status: 'online',
        };
        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }
    async updateUserOnlineStatus(uid, isOnline) {
        try {
            const userRef = doc(this.db, 'users', uid);
            await updateDoc(userRef, {
                isOnline,
                lastSeen: serverTimestamp(),
                status: isOnline ? 'online' : 'offline',
                updatedAt: serverTimestamp(),
            });
        }
        catch (error) {
            console.error('Error updating online status:', error);
        }
    }
    handleAuthError(error) {
        let message = 'An authentication error occurred';
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'No user found with this email address';
                    break;
                case 'auth/wrong-password':
                    message = 'Incorrect password';
                    break;
                case 'auth/email-already-in-use':
                    message = 'Email address is already in use';
                    break;
                case 'auth/weak-password':
                    message = 'Password is too weak';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    message = 'User account has been disabled';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many failed attempts. Please try again later';
                    break;
                default:
                    message = error.message || message;
            }
        }
        return new Error(message);
    }
}
// Export singleton instance
export const authService = new AuthService();
//# sourceMappingURL=auth.js.map