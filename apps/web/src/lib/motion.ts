import type { Variants } from 'framer-motion'

/** Material-style ease-out cubic-bezier — the shared timing curve for entrances. */
export const EASE_OUT: number[] = [0.4, 0, 0.2, 1]

/**
 * Fade + rise entrance for a single element.
 * Use as: <motion.div variants={fadeUp()} initial="hidden" animate="show" />
 */
export function fadeUp(delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: EASE_OUT, delay },
    },
  }
}

/**
 * Parent container that staggers its children's entrances.
 * Pair with `staggerItem` on each child.
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
}

/** Child entrance for use inside `staggerContainer`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
}

/**
 * Per-index delay for long lists, capped so late items don't lag forever.
 * Defaults: start 0.1s, step 0.04s, max 0.6s.
 */
export function cappedDelay(
  i: number,
  opts?: { start?: number; step?: number; max?: number },
): number {
  const { start = 0.1, step = 0.04, max = 0.6 } = opts ?? {}
  return Math.min(start + i * step, max)
}

/**
 * Direction-aware slide variants for carousel/stepper transitions.
 * `custom` is the direction: positive = forward, negative = back.
 */
export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
}
