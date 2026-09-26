import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import raw from "../assets/avatar.svg?raw";
import { BinarySim, buildCells, type Palette } from "../lib/binary";
import { useFinePointer, useReducedMotion } from "../lib/hooks";

// Inlined so the ink can follow the theme (black on light, see --avatar-ink).
const svg = raw.replace("<svg ", '<svg aria-hidden="true" focusable="false" ');

// The art is a 15 × 14 pixel-art grid.
const COLS = 15;
const ROWS = 14;
const ART_RATIO = 310.202 / 331.5195;

/**
 * Hari's pixel portrait, exactly as drawn (scaled uniformly). With a mouse, hovering flips every
 * pixel into a 0 or 1 by colour; touch and reduced-motion get the plain SVG.
 */
export function Avatar({ width, alt }: { width: number; alt: string }) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const height = width * ART_RATIO;
  const enhanced = fine && !reduced;
  const [failed, setFailed] = useState(false);
  const showSvg = !enhanced || failed;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!enhanced || !root || !canvas) return;

    let sim: BinarySim | null = null;
    let dead = false;
    let themeRaf = 0;
    let themeUntil = 0;

    const readPalette = (): Palette => {
      const cs = getComputedStyle(root);
      return { ink: cs.color, one: cs.getPropertyValue("--fg").trim(), zero: cs.getPropertyValue("--fg-3").trim() };
    };
    const local = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !sim) return;
      const p = local(e);
      sim.enter(p.x, p.y);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !sim) return;
      const p = local(e);
      sim.move(p.x, p.y);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !sim) return;
      sim.leave();
    };

    // Theme colours blend over ~400ms; keep the palette in step with them.
    const followTheme = () => {
      themeRaf = 0;
      sim?.setPalette(readPalette());
      if (performance.now() < themeUntil) themeRaf = requestAnimationFrame(followTheme);
    };
    const themeObserver = new MutationObserver(() => {
      themeUntil = performance.now() + 500;
      if (!themeRaf) followTheme();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    buildCells(svg, COLS, ROWS)
      .then((cells) => {
        if (dead) return;
        sim = new BinarySim(canvas, cells, width, height, readPalette());
        canvas.style.visibility = "visible";
        document.fonts.load('500 8px "Geist Mono"').then(() => sim?.refresh(), () => {});
      })
      .catch(() => !dead && setFailed(true));

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      dead = true;
      cancelAnimationFrame(themeRaf);
      themeObserver.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      sim?.destroy();
    };
  }, [enhanced, width, height]);

  return (
    <motion.div
      ref={rootRef}
      role="img"
      aria-label={alt}
      data-measure
      className="relative text-[var(--avatar-ink)]"
      style={{ width, height }}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
    >
      {showSvg && <div className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />}
      {enhanced && !failed && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="absolute inset-0"
          style={{ width, height, visibility: "hidden" }}
        />
      )}
    </motion.div>
  );
}
