import React, { ReactNode } from 'react';
import { UseAuthReturn } from '../types';
interface AuthProviderProps {
    children: ReactNode;
}
export declare const AuthProvider: React.FC<AuthProviderProps>;
export declare const useAuthContext: () => UseAuthReturn;
export {};
