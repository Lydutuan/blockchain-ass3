const crypto = require("crypto");

const algorithm = "aes-256-gcm";

/**
 * Encrypts a buffer using AES-256-GCM
 */
function encryptBuffer(buffer) {
  const key = crypto.randomBytes(32); // 256-bit key
  const iv = crypto.randomBytes(16);  // initialization vector

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encryptedData = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedData,
    key,
    iv,
    authTag,
  };
}

module.exports = { encryptBuffer };