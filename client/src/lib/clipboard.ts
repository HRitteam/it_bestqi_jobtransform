/**
 * 跨环境剪贴板复制工具
 *
 * 已知问题：
 * 1. navigator.clipboard.writeText() 在 iframe / 失焦页面中静默失败
 * 2. Radix UI Dialog 使用 FocusScope (trapFocus)，如果 textarea 插入到
 *    document.body，FocusScope 会立即抢回焦点，导致 execCommand("copy")
 *    虽然返回 true 但实际复制的是空内容
 *
 * 解决方案：
 * - 将 textarea 插入到当前活动元素（按钮）的父容器中，确保在 FocusScope 内部
 * - 如果找不到合适的容器，fallback 到 document.body
 */

/**
 * 将文本复制到剪贴板
 * @param text 要复制的文本
 * @returns 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 方案一（优先）：textarea + execCommand
  // 关键：textarea 必须插入到 FocusScope 内部（即 Dialog 内部），否则焦点会被抢走
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "0";
    textarea.style.top = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.opacity = "0.01";
    textarea.style.zIndex = "99999";
    textarea.setAttribute("readonly", "");

    // 优先插入到当前活动元素的最近 Dialog Content 容器中
    // 这样 FocusScope 不会抢走焦点
    const activeEl = document.activeElement;
    const dialogContent = activeEl?.closest?.('[data-slot="dialog-content"]')
      || activeEl?.closest?.('[role="dialog"]')
      || activeEl?.closest?.('.dialog-content');
    const container = dialogContent || document.body;

    container.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    container.removeChild(textarea);
    if (ok) return true;
  } catch {
    /* execCommand 失败，继续尝试 Clipboard API */
  }

  // 方案二（备选）：Clipboard API
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Clipboard API 也失败 */
  }

  return false;
}
