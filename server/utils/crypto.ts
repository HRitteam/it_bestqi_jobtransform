import crypto from "node:crypto";

/**
 * AES-256-GCM 加密/解密工具
 * 用于安全存储大模型 API Key
 *
 * 加密后的格式: iv:authTag:ciphertext (均为 hex 编码)
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * 获取加密密钥
 * 从环境变量 ENCRYPTION_KEY 读取，要求为 64 位 hex 字符串（32 字节）
 * 如果未配置，使用 JWT_SECRET 的 SHA-256 哈希作为 fallback
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }

  // Fallback: 使用 JWT_SECRET 的 SHA-256 哈希
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      "ENCRYPTION_KEY or JWT_SECRET must be configured for API Key encryption"
    );
  }
  return crypto.createHash("sha256").update(jwtSecret).digest();
}

/**
 * 加密明文字符串
 * @param plaintext - 需要加密的明文（如 API Key）
 * @returns 加密后的字符串，格式为 iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * 解密密文字符串
 * @param ciphertext - 加密后的字符串，格式为 iv:authTag:encrypted
 * @returns 解密后的明文
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format: expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * 对 API Key 进行脱敏处理
 * 保留前 3 位和后 4 位，中间用 **** 替代
 * @param apiKey - 原始 API Key 明文
 * @returns 脱敏后的字符串
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 8) {
    return "****";
  }
  return `${apiKey.slice(0, 3)}****${apiKey.slice(-4)}`;
}
