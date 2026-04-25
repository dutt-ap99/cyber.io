import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes is standard for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag

export interface AuthSession {
  isAuthenticated: boolean;
  userId?: string;
}

/**
 * Gets the encryption key from environment variables.
 * Must be exactly 32 bytes (256 bits) for aes-256-gcm.
 * The key is expected to be hex encoded in the ENCRYPTION_KEY environment variable.
 */
const getKey = (): Buffer => {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters) long');
  }
  return key;
};

/**
 * Encrypts a string field using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns The encrypted string formatted as hex:iv:authTag
 */
export const encryptField = (text: string): string => {
  if (!text) return text;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts a string field using AES-256-GCM.
 * @param encryptedText The encrypted string formatted as hex:iv:authTag
 * @returns The decrypted plaintext string.
 */
export const decryptField = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const [ivHex, authTagHex, encryptedDataHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Helper to deep-encrypt specific sensitive fields in an object.
 */
const encryptValue = (value: any): any => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return encryptField(value);
  } else if (Array.isArray(value)) {
    return value.map(item => encryptValue(item));
  } else if (typeof value === 'object') {
    // Preserve instances like Date, Buffer, etc. (we only want to recurse plain objects)
    if (value.constructor === Object) {
      const encryptedObj: any = {};
      for (const k in value) {
        encryptedObj[k] = encryptValue(value[k]);
      }
      return encryptedObj;
    }
  }
  // Return numbers, booleans, dates, etc., as is
  return value;
};

/**
 * Helper to deep-decrypt specific sensitive fields in an object.
 */
const decryptValue = (value: any): any => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    try {
      return decryptField(value);
    } catch (e) {
      // If decryption fails (e.g. invalid format or wrong key), just return the original value or log.
      return value;
    }
  } else if (Array.isArray(value)) {
    return value.map(item => decryptValue(item));
  } else if (typeof value === 'object') {
    if (value.constructor === Object) {
      const decryptedObj: any = {};
      for (const k in value) {
        decryptedObj[k] = decryptValue(value[k]);
      }
      return decryptedObj;
    }
  }
  return value;
};

/**
 * Helper to deep-mask specific sensitive fields when not authenticated.
 */
const maskValue = (value: any): any => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return '***REDACTED***';
  } else if (Array.isArray(value)) {
    return value.map(item => maskValue(item));
  } else if (typeof value === 'object') {
    if (value.constructor === Object) {
      const maskedObj: any = {};
      for (const k in value) {
        maskedObj[k] = maskValue(value[k]);
      }
      return maskedObj;
    }
  }
  return '***REDACTED***';
};

/**
 * Middleware utility to encrypt specific sensitive fields in an object.
 * Useful before saving to the database.
 * @param data The object containing data to encrypt.
 * @param fields Array of field names to encrypt.
 * @returns A new object with the specified fields encrypted.
 */
export const encryptSensitiveData = <T extends Record<string, any>>(data: T, fields: (keyof T)[]): T => {
  const result = { ...data };
  for (const field of fields) {
    if (result[field] !== undefined) {
      result[field] = encryptValue(result[field]) as any;
    }
  }
  return result;
};

/**
 * Middleware utility to decrypt specific sensitive fields in an object.
 * Useful after retrieving from the database. Only decrypts if the session is authenticated.
 * If not authenticated, the fields are redacted.
 * @param data The object containing encrypted data.
 * @param fields Array of field names to decrypt.
 * @param session The authentication session of the user requesting the data.
 * @returns A new object with the specified fields decrypted or redacted.
 */
export const decryptSensitiveData = <T extends Record<string, any>>(data: T, fields: (keyof T)[], session?: AuthSession | null): T => {
  const result = { ...data };

  const isAuthenticated = session && session.isAuthenticated;

  for (const field of fields) {
    if (result[field] !== undefined) {
      if (isAuthenticated) {
        result[field] = decryptValue(result[field]) as any;
      } else {
        result[field] = maskValue(result[field]) as any;
      }
    }
  }
  return result;
};
