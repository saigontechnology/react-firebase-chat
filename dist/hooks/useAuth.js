import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    const signIn = async (email, password) => {
        try {
            setError(null);
            setLoading(true);
            await authService.signIn(email, password);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const signUp = async (email, password, displayName) => {
        try {
            setError(null);
            setLoading(true);
            await authService.signUp(email, password, displayName);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const signOut = async () => {
        try {
            setError(null);
            await authService.signOut();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign out failed');
            throw err;
        }
    };
    const resetPassword = async (email) => {
        try {
            setError(null);
            await authService.resetPassword(email);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Password reset failed');
            throw err;
        }
    };
    const updateProfile = async (updates) => {
        try {
            setError(null);
            await authService.updateUserProfile(updates);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Profile update failed');
            throw err;
        }
    };
    return {
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
    };
};
//# sourceMappingURL=useAuth.js.map