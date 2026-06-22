/**
 * 安全存储封装与全局守卫
 *
 * 背景：当浏览器关闭「允许站点保存和读取 Cookie 数据」时，访问
 * `window.localStorage` / `window.sessionStorage` 会直接抛出
 * `SecurityError: Failed to read the 'localStorage' property from 'Window'`，
 * 导致应用在最早一次读取存储（如 ThemeContext / PasswordGate 的 useState 初始化）
 * 时整体崩溃白屏。
 *
 * 方案：用一个 try/catch 包裹的内存兜底实现替换全局的 localStorage/sessionStorage，
 * 使所有现有直接访问存储的代码无需逐处修改即可在禁用 Cookie 的环境下静默降级。
 */

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

/** 探测某个原生 Storage 是否真正可读写；不可用返回 false */
function isStorageUsable(getStore: () => Storage | undefined): boolean {
  try {
    const store = getStore();
    if (!store) return false;
    const testKey = "__safe_storage_test__";
    store.setItem(testKey, "1");
    store.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 安装全局存储守卫：若原生存储不可用，则用内存存储替换 window.localStorage /
 * window.sessionStorage，避免后续任何访问抛出 SecurityError。
 * 必须在应用其它任何模块读取存储之前调用。
 */
export function installStorageGuard(): void {
  if (typeof window === "undefined") return;

  const replacements: Array<["localStorage" | "sessionStorage", () => Storage | undefined]> = [
    ["localStorage", () => window.localStorage],
    ["sessionStorage", () => window.sessionStorage],
  ];

  for (const [prop, getStore] of replacements) {
    if (!isStorageUsable(getStore)) {
      const fallback = new MemoryStorage();
      try {
        Object.defineProperty(window, prop, {
          configurable: true,
          get() {
            return fallback;
          },
        });
      } catch {
        // 某些浏览器不允许重定义该属性；此时退而求其次仅做无操作，
        // 但配合 safeStorage 工具函数仍可保证关键路径不崩溃。
      }
      // eslint-disable-next-line no-console
      console.warn(`[safeStorage] window.${prop} 不可用（可能浏览器禁用了 Cookie/存储），已回退为内存存储。`);
    }
  }
}

/** 显式的安全存储工具，供新代码直接使用（带 try/catch 兜底） */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

// [关键] 在本模块被加载时立即安装守卫。只要本模块的 import 语句位于其它业务模块之前，
// 守卫即可在任何业务模块读取存储之前生效。installStorageGuard 自身幂等且带 try/catch。
installStorageGuard();
