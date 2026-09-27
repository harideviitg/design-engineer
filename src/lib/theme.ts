import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

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

// Every visit starts dark (set on <html> in index.html), whatever the device theme is.
// A click switches it until the page reloads. The colour blend itself lives in index.css.
export const toggleTheme = () => apply(read() === "dark" ? "light" : "dark");
