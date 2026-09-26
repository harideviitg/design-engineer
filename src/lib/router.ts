import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { measure } from "./measure";

/**
 * A tiny hash router. GitHub Pages can't rewrite unknown paths to index.html,
 * so #/notes/some-note works everywhere with no server config.
 */
export type Route = { name: "home" } | { name: "notes" } | { name: "note"; slug: string };

export const paths = {
  home: "#/",
  notes: "#/notes",
  note: (slug: string) => `#/notes/${slug}`,
};

export function parseRoute(hash: string): Route {
  const [a, b] = hash.replace(/^#\/?/, "").split("/");
  if (a === "notes" && b) return { name: "note", slug: decodeURIComponent(b) };
  if (a === "notes") return { name: "notes" };
  return { name: "home" };
}

export const routeKey = (r: Route) => (r.name === "note" ? `note:${r.slug}` : r.name);

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  return useMemo(() => parseRoute(hash), [hash]);
}

/** Each page remembers where you were, so Back lands you exactly where you left off. */
export function useScrollMemory(key: string) {
  const lastY = useRef(0);
  const prev = useRef<string | null>(null);
  const saved = useRef(new Map<string, number>());

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const sync = () => {
      lastY.current = window.scrollY;
    };
    // Scroll events arrive a frame late. Interactions that can trigger a navigation
    // capture the position at the moment they happen, so it can't be stale or clamped.
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("pointerdown", sync, true);
    window.addEventListener("click", sync, true);
    window.addEventListener("keydown", sync, true);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("pointerdown", sync, true);
      window.removeEventListener("click", sync, true);
      window.removeEventListener("keydown", sync, true);
    };
  }, []);

  useLayoutEffect(() => {
    if (prev.current !== null) saved.current.set(prev.current, lastY.current);
    prev.current = key;
    const y = saved.current.get(key) ?? 0;
    window.scrollTo(0, y);
    lastY.current = y;
  }, [key]);
}

/** Esc goes back one level, unless Esc is busy closing measure mode. */
export function useEscapeTo(to: string) {
  useEffect(() => {
    let measuring = false;
    // capture phase: read the state before the measure handler clears it
    const down = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const m = measure.get();
      measuring = m.pinned || m.alt;
      if (!measuring) window.location.hash = to;
    };
    window.addEventListener("keydown", down, true);
    return () => window.removeEventListener("keydown", down, true);
  }, [to]);
}
