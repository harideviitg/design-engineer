import { useEffect, useSyncExternalStore } from "react";

/**
 * Shared state for the rulers + inspector.
 * `target` is the [data-measure] element under the mouse,
 * `alt` is true while Alt/⌥ is held, `pinned` is the sticky toggle (M key / ruler corner).
 */
type State = { target: HTMLElement | null; alt: boolean; pinned: boolean };

let state: State = { target: null, alt: false, pinned: false };
const listeners = new Set<() => void>();

export const measure = {
  get: () => state,
  set(patch: Partial<State>) {
    const next = { ...state, ...patch };
    if (next.target === state.target && next.alt === state.alt && next.pinned === state.pinned) return;
    state = next;
    document.documentElement.classList.toggle("measuring", next.alt || next.pinned);
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useMeasure = () => useSyncExternalStore(measure.subscribe, measure.get, measure.get);
export const isMeasuring = (s: State) => s.alt || s.pinned;

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** Tracks what's under the mouse plus the measure-mode keys. Mount once. */
export function useMeasureTracking(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lastX = -1;
    let lastY = -1;
    let clearTimer = 0;

    // Crossing the gap between two elements shouldn't flicker the overlay off and on again.
    const pick = (el: Element | null) => {
      const target = (el?.closest("[data-measure]") as HTMLElement | null) ?? null;
      if (target) {
        window.clearTimeout(clearTimer);
        clearTimer = 0;
        measure.set({ target });
      } else if (!clearTimer && state.target) {
        clearTimer = window.setTimeout(() => {
          clearTimer = 0;
          measure.set({ target: null });
        }, 120);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      lastX = e.clientX;
      lastY = e.clientY;
      pick(e.target as Element);
    };
    const onScroll = () => {
      if (lastX >= 0) pick(document.elementFromPoint(lastX, lastY));
    };
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      lastX = -1;
      window.clearTimeout(clearTimer);
      clearTimer = 0;
      measure.set({ target: null });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        e.preventDefault(); // stops Windows from focusing the browser menu
        measure.set({ alt: true });
        return;
      }
      if (e.key === "Escape") measure.set({ pinned: false });
      if (e.key.toLowerCase() === "m" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) {
        measure.set({ pinned: !state.pinned });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Alt") return;
      e.preventDefault();
      measure.set({ alt: false });
    };
    const onBlur = () => measure.set({ alt: false });
    // While measuring, links inspect instead of navigate (and Alt+click won't download them).
    const onClick = (e: MouseEvent) => {
      if (!isMeasuring(state) && !e.altKey) return;
      if ((e.target as Element).closest("a")) e.preventDefault();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("click", onClick, true);
      measure.set({ target: null, alt: false, pinned: false });
    };
  }, [enabled]);
}
