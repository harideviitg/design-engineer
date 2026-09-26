import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const system = window.matchMedia("(prefers-color-scheme: dark)");

export function useTheme() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    read,
    () => "light" as Theme,
  );
}

function apply(next: Theme) {
  document.documentElement.dataset.theme = next;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", next === "dark" ? "#111110" : "#fbfbfa");
  listeners.forEach((l) => l());
}

// The device decides. A click only overrides it until the page reloads
// or the system theme changes again. The colour blend itself lives in index.css.
system.addEventListener("change", (e) => apply(e.matches ? "dark" : "light"));

export const toggleTheme = () => apply(read() === "dark" ? "light" : "dark");
