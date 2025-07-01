import { EncryptionFunctions, EncryptionOptions, EncryptionStatus } from '../types';
/**
 * Generate encryption key from password
 */
export declare const generateKeyFromPassword: (password: string, salt?: string, options?: EncryptionOptions) => Promise<string>;
/**
 * Encrypt text using AES-GCM
 */
export declare const encryptText: (text: string, keyString: string, options?: EncryptionOptions) => Promise<string>;
/**
 * Decrypt text using AES-GCM
 */
export declare const decryptText: (encryptedText: string, keyString: string, options?: EncryptionOptions) => Promise<string>;
/**
 * Test encryption/decryption functionality
 */
export declare const testEncryption: (key: string, options?: EncryptionOptions) => Promise<boolean>;
/**
 * Create encryption functions object matching RN interface
 */
export declare const createEncryptionFunctions: (key: string, options?: EncryptionOptions) => EncryptionFunctions;
/**
 * Check encryption status
 */
export declare const getEncryptionStatus: (key?: string, options?: EncryptionOptions) => Promise<EncryptionStatus>;
/**
 * Check if encryption is supported in current environment
 */
export declare const isEncryptionSupported: () => boolean;
