import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT } from "../lib/hooks";
import { toggleTheme, useTheme } from "../lib/theme";
import { Icon } from "./icons";

export function ThemeToggle() {
  const theme = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      data-measure
      className="relative -m-2 grid size-8 place-items-center rounded-full text-fg-3 transition-[color,transform] duration-150 ease-out hover:text-fg active:scale-[0.92]"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={theme}
          className="grid"
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <Icon name={dark ? "moon" : "sun"} size={16} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
