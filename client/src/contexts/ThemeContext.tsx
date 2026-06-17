import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  isPrintMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  // 检测 print 模式（PDF导出时 Puppeteer 会带 print=1 参数）
  const isPrintMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';

  const [theme, setTheme] = useState<Theme>(() => {
    // PDF 导出模式下强制使用 light 主题
    if (isPrintMode) return "light";
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    // Force dark mode - clear any previously stored light preference
    localStorage.removeItem("theme");
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isPrintMode) {
      root.classList.remove("dark");
      root.classList.add("print-mode");
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable && !isPrintMode) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable, isPrintMode]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, isPrintMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
