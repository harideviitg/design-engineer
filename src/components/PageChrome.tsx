import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE_OUT, useReducedMotion, useTools } from "../lib/hooks";
import { useEscapeTo } from "../lib/router";
import { Icon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

/** A quiet back arrow (with the Esc hint on desktop) on the left, theme toggle on the right. */
export function TopBar({ backTo, backLabel }: { backTo: string; backLabel: string }) {
  const tools = useTools();
  useEscapeTo(backTo);
  return (
    <div className="mb-12 flex items-center justify-between md:mb-16">
      <a
        href={backTo}
        aria-label={`Back to ${backLabel}`}
        data-measure
        className="group -ml-2 inline-flex h-8 items-center gap-2 rounded-md px-2 text-fg-3 transition-colors duration-150 ease-out hover:text-fg"
      >
        <Icon
          name="arrowLeft"
          size={14}
          className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
        />
        {tools && <span className="font-mono text-[12px] uppercase leading-4">Esc</span>}
      </a>
      <ThemeToggle />
    </div>
  );
}

/** Appears after you've scrolled a screen or so. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="fixed bottom-5 right-5 z-30 grid size-10 place-items-center rounded-full border border-line bg-bg text-fg-2 shadow-[0_4px_16px_-6px_rgb(0_0_0/0.25)] transition-colors duration-150 hover:bg-bg-2 hover:text-fg active:scale-[0.94]"
        >
          <Icon name="arrowUp" size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
