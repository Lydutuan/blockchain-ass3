import crypto from 'crypto';

export function encryptBuffer(data: Buffer) {
  const key = crypto.randomBytes(32); // AES-256 key
  const iv = crypto.randomBytes(12); // GCM recommended 12 bytes
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted,
    key: key.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptBuffer(encrypted: Buffer, keyHex: string, ivHex: string, tagHex: string) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return out;
}
