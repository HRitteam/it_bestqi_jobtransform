import { useEffect, useState, type RefObject } from "react";

export function useInViewAnimation(ref: RefObject<HTMLElement | null>) {
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) setHasAnimated(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, hasAnimated]);
  return hasAnimated;
}
