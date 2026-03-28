import { EncryptionOptions } from '../types';

const DEFAULT_ITERATIONS = 10000;
const DEFAULT_KEY_LENGTH = 256;

const HEX_CHARS = '0123456789abcdef';
// IV is 16 bytes = 32 hex characters (matches rn-firebase-chat)
const IV_LENGTH = 32;

// Generate a hex IV using Web Crypto random values
const createIV = (length = IV_LENGTH): string => {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);

  let result = '';
  for (let i = 0; i < array.length; i++) {
    const byte = array[i] ?? 0;
    result += HEX_CHARS.charAt(byte >> 4);
    result += HEX_CHARS.charAt(byte & 0x0f);
  }
  return result;
};

// Derive a hex key from password + salt using PBKDF2/SHA-256 (AES-256-CBC)
const generateKey = async (
  password: string,
  salt: string,
  cost: number,
  length: number
): Promise<string> => {
  if (!password || !salt) {
    throw new Error('Password and salt are required for key generation');
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: cost,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-CBC', length },
    true,
    ['encrypt', 'decrypt']
  );

  const raw = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(raw))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// Encrypt text with AES-256-CBC; returns hex IV prepended to hex ciphertext
const encryptData = async (text: string, key: string): Promise<string> => {
  if (!text || !key) {
    throw new Error('Text and key are required for encryption');
  }

  try {
    const iv = createIV();
    const ivBytes = new Uint8Array(
      (iv.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    const keyBytes = new Uint8Array(
      (key.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-CBC' },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: ivBytes },
      cryptoKey,
      new TextEncoder().encode(text)
    );

    const cipherHex = Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return iv + cipherHex;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt: extract hex IV prefix then AES-256-CBC decrypt
const decryptData = async (cipher: string, key: string): Promise<string> => {
  if (!cipher || !key) {
    throw new Error('Cipher and key are required for decryption');
  }

  if (cipher.length < IV_LENGTH) {
    throw new Error('Invalid cipher format');
  }

  try {
    const iv = cipher.substring(0, IV_LENGTH);
    const encryptedHex = cipher.substring(IV_LENGTH);

    const ivBytes = new Uint8Array(
      (iv.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    const encryptedBytes = new Uint8Array(
      (encryptedHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );
    const keyBytes = new Uint8Array(
      (key.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16))
    );

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: ivBytes },
      cryptoKey,
      encryptedBytes
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Failed to decrypt message');
  }
};

// High-level key generation matching rn-firebase-chat's generateEncryptionKey
const generateEncryptionKey = async (
  encryptKey: string,
  options: EncryptionOptions
): Promise<string> => {
  const {
    salt,
    iterations = DEFAULT_ITERATIONS,
    keyLength = DEFAULT_KEY_LENGTH,
  } = options;

  try {
    return await generateKey(encryptKey, salt, iterations, keyLength);
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw error;
  }
};

// Safe decrypt with fallback — matches rn-firebase-chat's decryptedMessageData
const decryptedMessageData = async (
  text: string,
  key: string
): Promise<string> => {
  if (!text || !key) {
    return text;
  }

  if (text.length <= IV_LENGTH) {
    return text;
  }

  try {
    const decryptedMessage = await decryptData(text, key);
    return decryptedMessage || text;
  } catch {
    return text;
  }
};

export {
  generateKey,
  encryptData,
  decryptData,
  createIV,
  generateEncryptionKey,
  decryptedMessageData,
};
