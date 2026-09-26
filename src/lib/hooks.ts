import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function useMediaQuery(query: string) {
  const subscribe = useMemo(
    () => (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** A Date that ticks on the second boundary. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setNow(new Date());
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => window.clearTimeout(id);
  }, []);
  return now;
}

/** Runs `onChange` whenever the colour theme flips. */
export function useThemeChange(onChange: () => void) {
  useEffect(() => {
    const mo = new MutationObserver(onChange);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [onChange]);
}

export function cssVar(name: string, el: Element = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
