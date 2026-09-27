import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM at-rest encryption for OAuth refresh/access tokens.
// GOOGLE_TOKEN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).
const getKey = () => {
  const hex = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be set to a 64-character hex string');
  }
  return Buffer.from(hex, 'hex');
};

// Returns "ivHex:authTagHex:cipherTextHex"
export const encryptToken = (plainText) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptToken = (payload) => {
  const [ivHex, authTagHex, cipherHex] = String(payload).split(':');
  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error('Malformed encrypted token payload');
  }
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
};
