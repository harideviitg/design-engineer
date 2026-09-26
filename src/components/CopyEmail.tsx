import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "../lib/hooks";
import { Icon } from "./icons";

const swap = {
  initial: { opacity: 0, y: 8, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(3px)" },
  transition: { duration: 0.22, ease: EASE_OUT },
};

const iconSwap = {
  initial: { opacity: 0, scale: 0.5, filter: "blur(2px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.5, filter: "blur(2px)" },
  transition: { duration: 0.18, ease: EASE_OUT },
};

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      data-measure="text"
      className="group relative inline-flex items-center gap-2 text-fg transition-transform duration-150 ease-out active:scale-[0.98]"
    >
      <span className="relative">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={copied ? "copied" : "email"} className="inline-block" {...swap}>
            {copied ? "Copied to clipboard" : <span className="link">{email}</span>}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative grid size-3 place-items-center text-fg-3 transition-colors duration-150 group-hover:text-fg">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={copied ? "check" : "copy"} className="grid" {...iconSwap}>
            <Icon name={copied ? "check" : "copy"} size={14} />
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied" : ""}
      </span>
    </button>
  );
}
