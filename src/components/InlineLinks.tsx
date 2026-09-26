import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE_OUT } from "../lib/hooks";
import { Icon } from "./icons";

/** A small dark chip that pops up above a word, in the same style as the clock tooltip. */
function Chip({ children, id }: { children: ReactNode; id: string }) {
  return (
    <motion.span
      id={id}
      role="tooltip"
      initial={{ opacity: 0, y: 3, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 3, scale: 0.92 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 flex -translate-x-1/2 origin-bottom items-center gap-1.5 whitespace-nowrap rounded-md bg-fg px-2 py-1.5 text-[12px] leading-none text-bg shadow-lg"
    >
      {children}
    </motion.span>
  );
}

function useHoverFocus() {
  const [open, setOpen] = useState(false);
  return {
    open,
    props: {
      onPointerEnter: () => setOpen(true),
      onPointerLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    },
  };
}

/** A plain underlined link, e.g. "shelf". */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="link text-fg">
      {children}
    </a>
  );
}

/** Underlined; an arrow chip on hover says it opens in a new tab. */
export function LinkedInLink({ href, children }: { href: string; children: ReactNode }) {
  const { open, props } = useHoverFocus();
  return (
    <span className="relative inline-block" {...props}>
      <a href={href} target="_blank" rel="noreferrer" className="link text-fg">
        {children}
      </a>
      <AnimatePresence>
        {open && (
          <Chip id="chip-linkedin">
            <Icon name="arrow" size={13} />
          </Chip>
        )}
      </AnimatePresence>
    </span>
  );
}

/** Underlined; shows a copy icon on hover and copies the address when clicked. */
export function EmailLink({ email, children }: { email: string; children: ReactNode }) {
  const { open, props } = useHoverFocus();
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
    <span className="relative inline-block" {...props}>
      <button type="button" onClick={copy} className="link inline text-fg" aria-label={`Copy email address ${email}`}>
        {children}
      </button>
      <AnimatePresence>
        {(open || copied) && (
          <Chip id="chip-email">
            <span className="relative grid size-[13px] place-items-center">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={copied ? "check" : "copy"}
                  className="grid"
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                >
                  <Icon name={copied ? "check" : "copy"} size={13} />
                </motion.span>
              </AnimatePresence>
            </span>
            {copied && <span>Copied</span>}
          </Chip>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email address copied" : ""}
      </span>
    </span>
  );
}
