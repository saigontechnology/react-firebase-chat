import { EncryptionFunctions, EncryptionOptions, EncryptionStatus } from '../types';

/**
 * Encryption utilities matching RN-Firebase-Chat
 */

// Default encryption options
const DEFAULT_ENCRYPTION_OPTIONS: EncryptionOptions = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  iterations: 100000,
};

/**
 * Generate encryption key from password
 */
export const generateKeyFromPassword = async (
  password: string,
  salt: string = 'defaultSalt',
  options: EncryptionOptions = DEFAULT_ENCRYPTION_OPTIONS
): Promise<string> => {
  try {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: options.iterations || DEFAULT_ENCRYPTION_OPTIONS.iterations!,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: options.algorithm || DEFAULT_ENCRYPTION_OPTIONS.algorithm!,
        length: options.keyLength || DEFAULT_ENCRYPTION_OPTIONS.keyLength!,
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Export key as base64
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw new Error('Failed to generate encryption key');
  }
};

/**
 * Encrypt text using AES-GCM
 */
export const encryptText = async (
  text: string,
  keyString: string,
  options: EncryptionOptions = DEFAULT_ENCRYPTION_OPTIONS
): Promise<string> => {
  try {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Convert base64 key back to CryptoKey
    const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: options.algorithm || DEFAULT_ENCRYPTION_OPTIONS.algorithm!,
        length: options.keyLength || DEFAULT_ENCRYPTION_OPTIONS.keyLength!,
      },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: options.algorithm || DEFAULT_ENCRYPTION_OPTIONS.algorithm!,
        iv: iv,
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw new Error('Failed to encrypt text');
  }
};

/**
 * Decrypt text using AES-GCM
 */
export const decryptText = async (
  encryptedText: string,
  keyString: string,
  options: EncryptionOptions = DEFAULT_ENCRYPTION_OPTIONS
): Promise<string> => {
  try {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // Convert base64 key back to CryptoKey
    const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: options.algorithm || DEFAULT_ENCRYPTION_OPTIONS.algorithm!,
        length: options.keyLength || DEFAULT_ENCRYPTION_OPTIONS.keyLength!,
      },
      false,
      ['decrypt']
    );

    // Decrypt data
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: options.algorithm || DEFAULT_ENCRYPTION_OPTIONS.algorithm!,
        iv: iv,
      },
      key,
      encrypted
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw new Error('Failed to decrypt text');
  }
};

/**
 * Test encryption/decryption functionality
 */
export const testEncryption = async (
  key: string,
  options: EncryptionOptions = DEFAULT_ENCRYPTION_OPTIONS
): Promise<boolean> => {
  try {
    const testMessage = 'test_message_' + Date.now();
    const encrypted = await encryptText(testMessage, key, options);
    const decrypted = await decryptText(encrypted, key, options);
    return decrypted === testMessage;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
};

/**
 * Create encryption functions object matching RN interface
 */
export const createEncryptionFunctions = (
  key: string,
  options: EncryptionOptions = DEFAULT_ENCRYPTION_OPTIONS
): EncryptionFunctions => {
  return {
    generateKeyFunctionProp: async (password: string) =>
      generateKeyFromPassword(password, 'defaultSalt', options),
    encryptFunctionProp: async (text: string) =>
      encryptText(text, key, options),
    decryptFunctionProp: async (text: string) =>
      decryptText(text, key, options),
  };
};

/**
 * Check encryption status
 */
export const getEncryptionStatus = async (
  key?: string,
  options: EncryptionOptions = DEFAULT_ENCRYPTION_OPTIONS
): Promise<EncryptionStatus> => {
  const isEnabled = Boolean(key);
  let isReady = false;
  const keyGenerated = Boolean(key);
  let testPassed = false;

  if (key) {
    try {
      isReady = Boolean(window.crypto && window.crypto.subtle);
      if (isReady) {
        testPassed = await testEncryption(key, options);
      }
    } catch (error) {
      console.error('Error checking encryption status:', error);
    }
  }

  return {
    isEnabled,
    isReady,
    keyGenerated,
    testPassed,
    lastTestedAt: Date.now(),
  };
};

/**
 * Check if encryption is supported in current environment
 */
export const isEncryptionSupported = (): boolean => {
  return Boolean(window.crypto && window.crypto.subtle);
};
