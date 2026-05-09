/**
 * Vajra motion constants and spring configs.
 * Single source of truth for all animation parameters.
 */
import type { Transition } from "framer-motion";

// ─── Spring presets ─────────────────────────────────────────────────────────

export const spring = {
  snappy: { type: "spring", stiffness: 400, damping: 30 } as Transition,
  gentle: { type: "spring", stiffness: 160, damping: 24 } as Transition,
  elastic: { type: "spring", stiffness: 300, damping: 18 } as Transition,
  slow: { type: "spring", stiffness: 80, damping: 20 } as Transition,
} as const;

// ─── Easing curves ──────────────────────────────────────────────────────────

export const ease = {
  out: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
  in: [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],
  inOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
  cinematic: [0.16, 1, 0.3, 1] as [number, number, number, number],
  impact: [0.0, 0.0, 0.0, 1.0] as [number, number, number, number],
} as const;

// ─── Duration constants ──────────────────────────────────────────────────────

export const dur = {
  instant: 0,
  micro: 0.1,
  fast: 0.2,
  normal: 0.35,
  beam: 0.65,
  dramatic: 0.9,
  slow: 1.4,
} as const;

// ─── Standard page transition ─────────────────────────────────────────────────

export const pageVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(2px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(1px)" },
};

export const pageTransition: Transition = {
  duration: 0.35,
  ease: ease.cinematic,
};

// ─── Stagger helpers ─────────────────────────────────────────────────────────

export const staggerContainer = (stagger = 0.06, delay = 0) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.cinematic } },
};

// ─── Colors ──────────────────────────────────────────────────────────────────

export const CYAN = "#00E5FF";
export const CRIMSON = "#E11D48";
export const EMERALD = "#10B981";
export const AMBER = "#F59E0B";
export const BG = "#050505";

// ─── Beam particle count by reduced-motion state ─────────────────────────────

export const particleCount = (reduced: boolean) => (reduced ? 0 : 18);

// ─── Fade-in shorthand ───────────────────────────────────────────────────────

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 as const },
  transition: { duration: 0.5, delay, ease: ease.cinematic },
});
