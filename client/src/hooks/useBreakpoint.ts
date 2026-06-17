import { useEffect, useState } from "react";

/**
 * Layout breakpoints matching the five layout states (S1-S5)
 * Mobile: < 768px
 * Tablet: 768px - 1023px
 * Desktop: 1024px - 1439px
 * Wide: >= 1440px
 */
export type Breakpoint = "mobile" | "tablet" | "desktop" | "wide";

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.wide) return "wide";
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    typeof window !== "undefined" ? getBreakpoint(window.innerWidth) : "desktop"
  );

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
}

export function useIsMobileOrTablet(): boolean {
  const bp = useBreakpoint();
  return bp === "mobile" || bp === "tablet";
}
