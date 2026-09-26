import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT, intro, useReducedMotion } from "../lib/hooks";

type RevealProps = { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "header" };

/** Fade + un-blur into place, once, as it scrolls into view. */
export function Reveal({ children, className, delay = 0, as = "div", ...rest }: RevealProps & Record<`data-${string}`, string | boolean>) {
  const reduced = useReducedMotion();
  const Tag = as === "section" ? motion.section : as === "header" ? motion.header : motion.div;
  return (
    <Tag
      className={className}
      initial={reduced || intro.played ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Section({
  label,
  children,
  align = "baseline",
  delay,
}: {
  label: string;
  children: ReactNode;
  align?: "baseline" | "start";
  delay?: number;
}) {
  return (
    <Reveal
      as="section"
      delay={delay}
      data-measure
      className={`grid grid-cols-1 gap-y-3 md:grid-cols-[128px_minmax(0,1fr)] md:gap-x-8 ${
        align === "baseline" ? "md:items-baseline" : "md:items-start"
      }`}
    >
      <h2
        data-measure="text"
        className={`w-fit font-mono text-[12px] uppercase leading-6 text-fg-3 ${align === "start" ? "md:leading-none" : ""}`}
      >
        {label}
      </h2>
      <div className="min-w-0">{children}</div>
    </Reveal>
  );
}

/** Inline markdown-style links: "at [Acme](https://acme.com)". */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? (
          <a key={i} href={m[2]} className="link text-fg">
            {m[1]}
          </a>
        ) : (
          part
        );
      })}
    </>
  );
}
