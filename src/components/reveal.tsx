"use client";

import { MotionConfig, motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/** Respects prefers-reduced-motion for every motion component below it. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const SPRING = { type: "spring", bounce: 0.22, duration: 0.7 } as const;

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

type DivProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Rise distance in px (default 26). */
  y?: number;
};

/** Animates in on mount — for above-the-fold content. */
export function Enter({ children, className, delay = 0, y = 26 }: DivProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Animates in once when scrolled into view. */
export function Reveal({ children, className, delay = 0, y = 26 }: DivProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its <Item> children — on mount by default,
 *  on scroll into view with `inView`. */
export function Stagger({
  children,
  className,
  inView = false,
  stagger = 0.06,
}: {
  children: ReactNode;
  className?: string;
  /** true = animate when scrolled into view instead of on mount. */
  inView?: boolean;
  stagger?: number;
}) {
  const variants: Variants = {
    ...container,
    show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
  };
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      {...(inView
        ? { whileInView: "show", viewport: { once: true, margin: "0px 0px -60px 0px" } }
        : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

/** A staggered child — must sit under <Stagger>. */
export function Item({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}
