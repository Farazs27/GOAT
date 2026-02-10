import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export interface EncryptedData {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
}

export interface EncryptedBsn {
  encrypted: Buffer;
  hash: Buffer;
  keyVersion: number;
}

/**
 * Encrypts a BSN using AES-256-GCM with envelope encryption pattern
 * In production, the dataKey should come from AWS KMS
 */
export function encryptBsn(bsn: string, dataKey: Buffer): EncryptedBsn {
  // Generate a random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, dataKey, iv);
  
  // Encrypt the BSN
  let encrypted = cipher.update(bsn, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Get the authentication tag
  const tag = cipher.getAuthTag();
  
  // Combine IV + ciphertext + tag
  const combined = Buffer.concat([iv, encrypted, tag]);
  
  // Create HMAC hash for lookups (without decrypting)
  const hash = crypto.createHmac('sha256', dataKey).update(bsn).digest();
  
  return {
    encrypted: combined,
    hash,
    keyVersion: 1,
  };
}

/**
 * Decrypts a BSN using AES-256-GCM
 */
export function decryptBsn(encryptedData: Buffer, dataKey: Buffer): string {
  // Extract IV, ciphertext, and tag
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const tag = encryptedData.subarray(encryptedData.length - TAG_LENGTH);
  const ciphertext = encryptedData.subarray(IV_LENGTH, encryptedData.length - TAG_LENGTH);
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, dataKey, iv);
  decipher.setAuthTag(tag);
  
  // Decrypt
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * Creates a hash for BSN lookup without storing the plain BSN
 */
export function hashBsnForLookup(bsn: string, key: Buffer): Buffer {
  return crypto.createHmac('sha256', key).update(bsn).digest();
}

/**
 * Masks a BSN for display (e.g., "***.***.**1")
 */
export function maskBsn(bsn: string): string {
  if (!bsn || bsn.length < 4) return '***';
  const lastDigits = bsn.slice(-2);
  return `***.***.**${lastDigits}`;
}

/**
 * Validates a Dutch BSN using the elf-proef (11-proof)
 */
export function validateBsn(bsn: string): boolean {
  // Remove dots
  const cleanBsn = bsn.replace(/\./g, '');
  
  // Check length (8 or 9 digits)
  if (!/^\d{8,9}$/.test(cleanBsn)) return false;
  
  // Pad to 9 digits if needed
  const paddedBsn = cleanBsn.padStart(9, '0');
  
  // 11-proof validation
  const weights = [9, 8, 7, 6, 5, 4, 3, 2, -1];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(paddedBsn[i]) * weights[i];
  }
  
  return sum % 11 === 0;
}
