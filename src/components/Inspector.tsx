import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EASE_OUT } from "../lib/hooks";
import { isMeasuring, useMeasure } from "../lib/measure";

type Box = { x: number; y: number; w: number; h: number };
type Side = "top" | "bottom" | "left" | "right";
type Gap = { side: Side; x: number; y: number; len: number };
type Geo = { box: Box; gaps: Gap[]; ghosts: { side: Side; box: Box }[]; spec: string | null };

const spring = { type: "spring", stiffness: 650, damping: 48, mass: 0.8 } as const;

export const fmt = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

const toDoc = (r: DOMRect): Box => ({ x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height });

function typeSpec(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
  const lh = cs.lineHeight === "normal" ? "auto" : fmt(parseFloat(cs.lineHeight));
  return `${family} ${fmt(parseFloat(cs.fontSize))}/${lh} · ${cs.fontWeight}`;
}

/** Figma-style Alt-hover: the element's box plus the distance to its nearest neighbours. */
function computeGeo(el: HTMLElement, column: HTMLElement | null): Geo {
  const r = el.getBoundingClientRect();
  const near: Partial<Record<Side, DOMRect>> = {};

  for (const other of document.querySelectorAll<HTMLElement>("[data-measure]")) {
    if (other === el || other.contains(el) || el.contains(other)) continue;
    const q = other.getBoundingClientRect();
    if (!q.width || !q.height) continue;
    const overlapX = Math.min(q.right, r.right) - Math.max(q.left, r.left) > 1;
    const overlapY = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top) > 1;
    if (overlapX && q.bottom <= r.top + 0.5 && (!near.top || q.bottom > near.top.bottom)) near.top = q;
    if (overlapX && q.top >= r.bottom - 0.5 && (!near.bottom || q.top < near.bottom.top)) near.bottom = q;
    if (overlapY && q.right <= r.left + 0.5 && (!near.left || q.right > near.left.right)) near.left = q;
    if (overlapY && q.left >= r.right - 0.5 && (!near.right || q.left < near.right.left)) near.right = q;
  }

  const sx = window.scrollX;
  const sy = window.scrollY;
  const gaps: Gap[] = [];
  const ghosts: Geo["ghosts"] = [];
  const midX = (q: DOMRect) => (Math.max(q.left, r.left) + Math.min(q.right, r.right)) / 2 + sx;
  const midY = (q: DOMRect) => (Math.max(q.top, r.top) + Math.min(q.bottom, r.bottom)) / 2 + sy;
  const col = column?.getBoundingClientRect();

  if (near.top && r.top - near.top.bottom >= 1) {
    gaps.push({ side: "top", x: midX(near.top), y: near.top.bottom + sy, len: r.top - near.top.bottom });
    ghosts.push({ side: "top", box: toDoc(near.top) });
  }
  if (near.bottom && near.bottom.top - r.bottom >= 1) {
    gaps.push({ side: "bottom", x: midX(near.bottom), y: r.bottom + sy, len: near.bottom.top - r.bottom });
    ghosts.push({ side: "bottom", box: toDoc(near.bottom) });
  }
  if (near.left && r.left - near.left.right >= 1) {
    gaps.push({ side: "left", x: near.left.right + sx, y: midY(near.left), len: r.left - near.left.right });
    ghosts.push({ side: "left", box: toDoc(near.left) });
  } else if (col && r.left - col.left >= 1) {
    gaps.push({ side: "left", x: col.left + sx, y: r.top + r.height / 2 + sy, len: r.left - col.left });
  }
  if (near.right && near.right.left - r.right >= 1) {
    gaps.push({ side: "right", x: r.right + sx, y: midY(near.right), len: near.right.left - r.right });
    ghosts.push({ side: "right", box: toDoc(near.right) });
  } else if (col && col.right - r.right >= 1) {
    gaps.push({ side: "right", x: r.right + sx, y: r.top + r.height / 2 + sy, len: col.right - r.right });
  }

  return { box: toDoc(r), gaps, ghosts, spec: el.dataset.measure === "text" ? typeSpec(el) : null };
}

export function Inspector({ columnRef }: { columnRef: React.RefObject<HTMLElement | null> }) {
  const m = useMeasure();
  const on = isMeasuring(m);
  const [geo, setGeo] = useState<Geo | null>(null);

  useLayoutEffect(() => {
    if (!on || !m.target) {
      setGeo(null);
      return;
    }
    const el = m.target;
    const update = () => setGeo(computeGeo(el, columnRef.current));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [on, m.target, columnRef]);

  return createPortal(
    <>
      <AnimatePresence>{on && <LayoutGrid key="grid" columnRef={columnRef} />}</AnimatePresence>
      <AnimatePresence>{on && geo && <Overlay key="overlay" geo={geo} />}</AnimatePresence>
      <AnimatePresence>
        {on && (
          <motion.div
            key="hud"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="pointer-events-none fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-full bg-fg px-3 py-1.5 text-[12px] leading-none text-bg shadow-lg"
          >
            Measuring <span className="opacity-60">· {m.pinned ? "M or Esc to exit" : "release Alt to exit"}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

function Overlay({ geo }: { geo: Geo }) {
  const { box } = geo;
  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      <AnimatePresence>
        {geo.ghosts.map((g) => (
          <motion.div
            key={g.side}
            className="absolute left-0 top-0"
            style={{ outline: "1px dashed var(--red)", outlineOffset: -1 }}
            initial={{ opacity: 0, x: g.box.x, y: g.box.y, width: g.box.w, height: g.box.h }}
            animate={{ opacity: 0.55, x: g.box.x, y: g.box.y, width: g.box.w, height: g.box.h }}
            exit={{ opacity: 0 }}
            transition={spring}
          />
        ))}
      </AnimatePresence>

      <motion.div
        className="absolute left-0 top-0"
        style={{ outline: "1px solid var(--accent)", outlineOffset: -1 }}
        initial={false}
        animate={{ x: box.x, y: box.y, width: box.w, height: box.h }}
        transition={spring}
      />

      <AnimatePresence>
        {geo.gaps.map((g) => (
          <GapLine key={g.side} gap={g} />
        ))}
      </AnimatePresence>

      <motion.div
        className="absolute left-0 top-0"
        initial={false}
        animate={{ x: box.x + box.w / 2, y: box.y + box.h + 6 }}
        transition={spring}
      >
        <div className="flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-[11px] font-medium tabular-nums leading-4">
          <span className="rounded-[3px] bg-accent px-1 text-white">
            {fmt(box.w)} × {fmt(box.h)}
          </span>
          {geo.spec && <span className="rounded-[3px] bg-fg px-1 text-bg">{geo.spec}</span>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GapLine({ gap }: { gap: Gap }) {
  const vertical = gap.side === "top" || gap.side === "bottom";
  const size = vertical ? { height: gap.len } : { width: gap.len };
  return (
    <motion.div
      className="absolute left-0 top-0"
      style={vertical ? { width: 1 } : { height: 1 }}
      initial={{ opacity: 0, x: gap.x, y: gap.y, ...size }}
      animate={{ opacity: 1, x: gap.x, y: gap.y, ...size }}
      exit={{ opacity: 0 }}
      transition={spring}
    >
      <div className="absolute inset-0 bg-red" />
      {vertical ? (
        <>
          <div className="absolute -left-[2px] top-0 h-px w-[5px] bg-red" />
          <div className="absolute -left-[2px] bottom-0 h-px w-[5px] bg-red" />
          <div className="absolute left-[5px] top-1/2 -translate-y-1/2">
            <span className="rounded-[3px] bg-red px-1 text-[11px] font-medium tabular-nums leading-4 text-white">{fmt(gap.len)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="absolute -top-[2px] left-0 h-[5px] w-px bg-red" />
          <div className="absolute -top-[2px] right-0 h-[5px] w-px bg-red" />
          <div className="absolute left-1/2 top-[5px] -translate-x-1/2">
            <span className="rounded-[3px] bg-red px-1 text-[11px] font-medium tabular-nums leading-4 text-white">{fmt(gap.len)}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}

/** The two-column layout grid, drawn like a Figma layout grid while measuring. */
function LayoutGrid({ columnRef }: { columnRef: React.RefObject<HTMLElement | null> }) {
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const el = columnRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, width: r.width });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [columnRef]);

  if (!rect) return null;
  return (
    <motion.div
      className="pointer-events-none fixed inset-y-0 z-[55]"
      style={{ left: rect.left, width: rect.width }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-y-0 left-0 w-[128px] bg-red/[0.055]" />
      <div className="absolute inset-y-0 left-[160px] right-0 bg-red/[0.055]" />
    </motion.div>
  );
}
