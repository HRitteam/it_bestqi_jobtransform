import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import { ChevronDown } from "lucide-react";

export interface VirtualColumn<T = any> {
  key: string;
  title: string;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface VirtualTableProps<T = any> {
  columns: VirtualColumn<T>[];
  data: T[];
  rowHeight?: number;
  expandable?: boolean;
  expandRender?: (row: T, index: number) => React.ReactNode;
  maxHeight?: number;
  className?: string;
}

/**
 * Virtual scrolling table with row expand support.
 * Only renders visible rows + buffer for smooth scrolling performance.
 */
export default function VirtualTable<T extends Record<string, any>>({
  columns,
  data,
  rowHeight = 48,
  expandable = false,
  expandRender,
  maxHeight = 500,
  className = "",
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // [修复] 打印/PDF 导出模式检测：URL 带 ?print=1 或 <html> 有 print-mode 类。
  // 打印态下虚拟滚动会导致只渲染可视行、容器裁剪、行错位，必须退化为完整渲染的普通表格。
  const isPrintMode = typeof window !== "undefined" && (
    new URLSearchParams(window.location.search).get("print") === "1" ||
    document.documentElement.classList.contains("print-mode")
  );

  const bufferCount = 5;
  const visibleCount = Math.ceil(maxHeight / rowHeight);
  const totalHeight = data.length * rowHeight;

  // 打印态：渲染全部行、无偏移；普通态：虚拟滚动窗口
  const startIndex = isPrintMode ? 0 : Math.max(0, Math.floor(scrollTop / rowHeight) - bufferCount);
  const endIndex = isPrintMode ? data.length : Math.min(data.length, startIndex + visibleCount + bufferCount * 2);
  const visibleData = data.slice(startIndex, endIndex);
  const offsetY = isPrintMode ? 0 : startIndex * rowHeight;

  // [修复] 打印态列宽锁死：用 flexBasis + flexShrink:0 让表头与数据行用完全一致的宽度计算，
  // 消除 flex 收缩/四舍五入造成的表头-数据列错位（导出 PDF 表格变形）。
  const colStyle = (width?: string): React.CSSProperties => {
    if (width) {
      return isPrintMode
        ? { flex: "none", flexBasis: width, flexGrow: 0, flexShrink: 0, width, minWidth: 0 }
        : { width, flex: "none" };
    }
    return isPrintMode
      ? { flex: "1 1 0", flexShrink: 0, minWidth: 0 }
      : { flex: 1, width: "auto" };
  };

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className={`border border-border rounded-xl ${isPrintMode ? "" : "overflow-hidden"} ${className}`}>
      {/* Header */}
      <div className={`flex bg-layer-2 border-b border-border ${isPrintMode ? "" : "sticky top-0 z-10"}`}>
        {expandable && <div className="w-10 shrink-0" />}
        {columns.map(col => (
          <div
            key={col.key}
            className={`px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider`}
            style={colStyle(col.width)}
          >
            {col.title}
          </div>
        ))}
      </div>

      {/* Body：打印态去掉 maxHeight/overflow/虚拟滚动偏移，完整展开自动分页 */}
      <div
        ref={containerRef}
        className={isPrintMode ? "" : "overflow-y-auto"}
        style={isPrintMode ? undefined : { maxHeight }}
      >
        <div style={isPrintMode ? undefined : { height: totalHeight, position: "relative" }}>
          <div style={isPrintMode ? undefined : { transform: `translateY(${offsetY}px)` }}>
            {visibleData.map((row, i) => {
              const actualIndex = startIndex + i;
              const isExpanded = expandedRows.has(actualIndex);

              return (
                <div key={actualIndex}>
                  <div
                    className={`flex items-center border-b border-border/50 transition-colors hover:bg-layer-1/50 ${
                      isExpanded ? "bg-layer-1/30" : ""
                    }`}
                    style={isPrintMode
                      ? { minHeight: rowHeight, breakInside: "avoid" as any, pageBreakInside: "avoid" as any }
                      : { height: rowHeight }}
                  >
                    {expandable && (
                      <button
                        onClick={() => toggleRow(actualIndex)}
                        className="w-10 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={isExpanded ? "收起详情" : "展开详情"}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={springPresets.micro}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                    )}
                    {columns.map(col => {
                      const cellValue = col.render
                        ? col.render(row[col.key], row, actualIndex)
                        : String(row[col.key] ?? "");
                      const titleStr = typeof row[col.key] === "string" ? row[col.key] : undefined;
                      return (
                        <div
                          key={col.key}
                          className={`px-3 py-2 text-sm text-foreground ${isPrintMode ? "break-words" : ""}`}
                          style={colStyle(col.width)}
                          title={titleStr}
                        >
                          {cellValue}
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && expandRender && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={springPresets.snappy}
                        className="overflow-hidden border-b border-border/50 bg-layer-1/20"
                      >
                        <div className="p-4">
                          {expandRender(row, actualIndex)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      {data.length > 0 && (
        <div className="px-3 py-2 bg-layer-2 border-t border-border text-xs text-muted-foreground">
          共 {data.length} 条记录
        </div>
      )}
    </div>
  );
}
