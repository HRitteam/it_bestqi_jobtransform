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

  const bufferCount = 5;
  const visibleCount = Math.ceil(maxHeight / rowHeight);
  const totalHeight = data.length * rowHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferCount);
  const endIndex = Math.min(data.length, startIndex + visibleCount + bufferCount * 2);
  const visibleData = data.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

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
    <div className={`border border-border rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex bg-layer-2 border-b border-border sticky top-0 z-10">
        {expandable && <div className="w-10 shrink-0" />}
        {columns.map(col => (
          <div
            key={col.key}
            className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
          >
            {col.title}
          </div>
        ))}
      </div>

      {/* Scrollable Body */}
      <div
        ref={containerRef}
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleData.map((row, i) => {
              const actualIndex = startIndex + i;
              const isExpanded = expandedRows.has(actualIndex);

              return (
                <div key={actualIndex}>
                  <div
                    className={`flex items-center border-b border-border/50 transition-colors hover:bg-layer-1/50 ${
                      isExpanded ? "bg-layer-1/30" : ""
                    }`}
                    style={{ height: rowHeight }}
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
                          className="px-3 py-2 text-sm text-foreground"
                          style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
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
