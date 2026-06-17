import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt, maskApiKey } from "./crypto";

describe("crypto.ts - AES-256-GCM 加密工具", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // 隔离环境变量
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("TC-CRYPTO-01: 正常加密与解密 (ENCRYPTION_KEY)", () => {
    it("使用 ENCRYPTION_KEY 加密后能正确解密", () => {
      // 设置 64 位 hex 字符串（32 字节密钥）
      process.env.ENCRYPTION_KEY =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const plaintext = "sk-test-123-secret-key";
      const ciphertext = encrypt(plaintext);

      // 验证密文格式: iv:authTag:encrypted
      const parts = ciphertext.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // IV 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32); // AuthTag 16 bytes = 32 hex chars
      expect(parts[2].length).toBeGreaterThan(0); // 密文不为空

      // 验证解密结果
      const decrypted = decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it("相同明文每次加密产生不同密文（随机 IV）", () => {
      process.env.ENCRYPTION_KEY =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const plaintext = "sk-same-key";
      const cipher1 = encrypt(plaintext);
      const cipher2 = encrypt(plaintext);

      expect(cipher1).not.toBe(cipher2); // 不同 IV 导致不同密文
      expect(decrypt(cipher1)).toBe(plaintext);
      expect(decrypt(cipher2)).toBe(plaintext);
    });

    it("能正确处理包含特殊字符的 API Key", () => {
      process.env.ENCRYPTION_KEY =
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

      const specialKeys = [
        "sk-proj-abc123!@#$%^&*()",
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0",
        "密钥中文测试+emoji🔑",
        "", // 空字符串
        "a".repeat(500), // 超长 Key
      ];

      for (const key of specialKeys) {
        const encrypted = encrypt(key);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(key);
      }
    });
  });

  describe("TC-CRYPTO-02: 环境变量 Fallback 机制 (JWT_SECRET)", () => {
    it("未设置 ENCRYPTION_KEY 时使用 JWT_SECRET 的 SHA-256 哈希", () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.JWT_SECRET = "my-jwt-secret-for-testing";

      const plaintext = "sk-fallback-key";
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it("ENCRYPTION_KEY 长度不足 64 时 fallback 到 JWT_SECRET", () => {
      process.env.ENCRYPTION_KEY = "too-short"; // 不足 64 位
      process.env.JWT_SECRET = "fallback-secret";

      const plaintext = "sk-short-key-test";
      const ciphertext = encrypt(plaintext);
      const decrypted = decrypt(ciphertext);

      expect(decrypted).toBe(plaintext);
    });

    it("ENCRYPTION_KEY 和 JWT_SECRET 都未设置时抛出错误", () => {
      delete process.env.ENCRYPTION_KEY;
      delete process.env.JWT_SECRET;

      expect(() => encrypt("anything")).toThrow(
        "ENCRYPTION_KEY or JWT_SECRET must be configured for API Key encryption"
      );
    });
  });

  describe("TC-CRYPTO-03: 异常密文格式处理", () => {
    it("密文格式不正确时抛出错误", () => {
      process.env.JWT_SECRET = "test-secret";

      expect(() => decrypt("invalid-format-string")).toThrow(
        "Invalid encrypted format: expected iv:authTag:ciphertext"
      );
    });

    it("密文只有两段时抛出错误", () => {
      process.env.JWT_SECRET = "test-secret";

      expect(() => decrypt("part1:part2")).toThrow(
        "Invalid encrypted format: expected iv:authTag:ciphertext"
      );
    });

    it("密文被篡改时解密失败", () => {
      process.env.JWT_SECRET = "test-secret";

      const ciphertext = encrypt("original-key");
      const parts = ciphertext.split(":");
      // 篡改密文部分
      parts[2] = "0000000000000000000000000000000000";
      const tampered = parts.join(":");

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe("TC-CRYPTO-04 & TC-CRYPTO-05: API Key 脱敏", () => {
    it("正常长度 Key 保留前3后4", () => {
      expect(maskApiKey("sk-1234567890abcdef")).toBe("sk-****cdef");
    });

    it("刚好超过8位的 Key 正常脱敏", () => {
      expect(maskApiKey("123456789")).toBe("123****6789");
    });

    it("短 Key (<=8位) 返回 ****", () => {
      expect(maskApiKey("short")).toBe("****");
      expect(maskApiKey("12345678")).toBe("****");
    });

    it("空字符串返回 ****", () => {
      expect(maskApiKey("")).toBe("****");
    });

    it("null/undefined 安全处理", () => {
      expect(maskApiKey(null as any)).toBe("****");
      expect(maskApiKey(undefined as any)).toBe("****");
    });
  });
});
