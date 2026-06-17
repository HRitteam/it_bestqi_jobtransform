/**
 * Spring Animation Presets for Framer Motion
 * Five physics-based spring presets as defined in the design system
 */

export const springPresets = {
  /** Gentle: smooth, no overshoot — page transitions, modals */
  gentle: { type: "spring" as const, stiffness: 120, damping: 20, mass: 1 },
  /** Snappy: quick response with slight overshoot — buttons, toggles */
  snappy: { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 },
  /** Bouncy: playful with visible bounce — notifications, success states */
  bouncy: { type: "spring" as const, stiffness: 400, damping: 15, mass: 1 },
  /** Layout: optimized for layout shifts — sidebar, panels */
  layout: { type: "spring" as const, stiffness: 200, damping: 28, mass: 1 },
  /** Micro: ultra-fast for micro-interactions — hover, focus */
  micro: { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.5 },
} as const;

export type SpringPreset = keyof typeof springPresets;

/**
 * Common animation variants using spring presets
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: springPresets.gentle,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: springPresets.micro,
};

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: springPresets.layout,
};

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: springPresets.layout,
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: springPresets.snappy,
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: springPresets.gentle },
};
