# 子域 1：模型配置与管理 - 测试用例文档

本文档由全球顶尖测试工程师编写，针对“平台级大模型路由管理”的第一个子域（模型配置与管理）提供完整、可执行的测试用例。测试范围涵盖底层加密工具函数以及后端 tRPC 接口的业务逻辑。

## 1. 测试范围与策略

本子域的核心职责是提供模型配置的 CRUD 能力，并确保 API Key 的安全存储。测试策略主要分为两部分：
1. **单元测试 (Unit Tests)**：针对 `server/utils/crypto.ts` 中的加密、解密和脱敏函数，验证其在不同输入和环境变量配置下的正确性与鲁棒性。
2. **集成测试 (Integration Tests)**：针对 `server/llmModelRouter.ts` 中的 tRPC 接口，模拟真实的数据库交互，验证模型创建、查询、更新、状态切换和软删除的业务逻辑。

## 2. 单元测试用例：加密工具 (`crypto.ts`)

| 用例编号 | 测试模块 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TC-CRYPTO-01` | `encrypt` / `decrypt` | 正常加密与解密 | 设置 `ENCRYPTION_KEY` 为 64 位 hex 字符串 | 1. 调用 `encrypt('sk-test-123')`<br>2. 调用 `decrypt` 解密返回的密文 | 1. 密文格式为 `iv:authTag:ciphertext`<br>2. 解密结果等于 `'sk-test-123'` |
| `TC-CRYPTO-02` | `encrypt` / `decrypt` | 环境变量 Fallback 机制 | 未设置 `ENCRYPTION_KEY`，仅设置 `JWT_SECRET` | 1. 调用 `encrypt('sk-fallback')`<br>2. 调用 `decrypt` 解密 | 能够正常加密和解密，内部正确使用了 SHA-256 哈希作为密钥 |
| `TC-CRYPTO-03` | `decrypt` | 异常密文格式处理 | 设置正确的环境变量 | 调用 `decrypt('invalid-format-string')` | 抛出错误 `Invalid encrypted format: expected iv:authTag:ciphertext` |
| `TC-CRYPTO-04` | `maskApiKey` | 正常长度 Key 脱敏 | 无 | 调用 `maskApiKey('sk-1234567890abcdef')` | 返回 `'sk-****cdef'`（保留前3后4） |
| `TC-CRYPTO-05` | `maskApiKey` | 短 Key 脱敏 | 无 | 调用 `maskApiKey('short')` | 返回 `'****'` |

## 3. 集成测试用例：tRPC 接口 (`llmModelRouter.ts`)

| 用例编号 | 接口 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TC-API-01` | `create` | 成功创建新模型 | 数据库中无 `gpt-4-test` 编码 | 调用 `create` 接口，传入完整模型数据（包含明文 API Key） | 1. 返回 `{ success: true }`<br>2. 数据库中新增记录，且 `apiKey` 字段为加密格式 |
| `TC-API-02` | `create` | 模型编码冲突拦截 | 数据库中已存在 `gpt-4-test` 编码 | 再次调用 `create` 接口，传入相同的 `modelCode` | 抛出 `TRPCError`，状态码为 `CONFLICT`，提示编码已存在 |
| `TC-API-03` | `list` | 获取模型列表及脱敏 | 数据库中存在测试模型 | 调用 `list` 接口 | 1. 返回模型列表<br>2. 列表中的 `apiKey` 字段为脱敏格式（如 `sk-****cdef`）<br>3. 默认不包含 `isDeleted=1` 的模型 |
| `TC-API-04` | `update` | 更新模型基础信息（不改Key） | 存在 ID 为 1 的模型 | 调用 `update` 接口，传入 `id: 1` 和新的 `modelName`，`apiKey` 留空 | 1. 返回 `{ success: true }`<br>2. 数据库中 `modelName` 更新，`apiKey` 密文保持不变 |
| `TC-API-05` | `update` | 更新模型并修改 API Key | 存在 ID 为 1 的模型 | 调用 `update` 接口，传入 `id: 1` 和新的 `apiKey` | 1. 返回 `{ success: true }`<br>2. 数据库中 `apiKey` 字段更新为新的密文 |
| `TC-API-06` | `toggleStatus` | 切换模型启用状态 | 存在 ID 为 1 的模型，当前 `isActive=1` | 调用 `toggleStatus` 接口，传入 `id: 1, isActive: 0` | 1. 返回 `{ success: true }`<br>2. 数据库中该模型的 `isActive` 变为 0 |
| `TC-API-07` | `delete` | 软删除模型 | 存在 ID 为 1 的模型 | 调用 `delete` 接口，传入 `id: 1` | 1. 返回 `{ success: true }`<br>2. 数据库中该模型的 `isDeleted` 变为 1，`isActive` 变为 0 |

## 4. 测试执行计划

为了验证上述用例，我们将使用 `vitest` 编写自动化测试脚本。测试脚本将分为两个文件：
1. `server/utils/crypto.test.ts`：执行 `TC-CRYPTO-*` 系列单元测试。
2. `server/llmModelRouter.test.ts`：执行 `TC-API-*` 系列集成测试（使用内存 SQLite 或 Mock 数据库连接）。

测试执行命令：
```bash
pnpm exec vitest run server/utils/crypto.test.ts
```
