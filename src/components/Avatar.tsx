import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { intro, useReducedMotion } from "../lib/hooks";

/**
 * Hari's portrait, typed out in Geist Mono bits (Figma "Frame 25" dark / "Frame 26" light).
 * 1s are the hair, 0s are the face. Every row is copied exactly, spaces included; the top two
 * rows sit 3.75em (45px at 12px) to the right, off the grid, as drawn.
 */
const ROWS: { indent: number; bits: string }[] = [
  { indent: 3.75, bits: "1111111111" },
  { indent: 3.75, bits: "1111111111" },
  { indent: 0, bits: "  1111111111111111" },
  { indent: 0, bits: "111111111111111111" },
  { indent: 0, bits: "111110001111111111111" },
  { indent: 0, bits: "111110000001111111111" },
  { indent: 0, bits: "  1000000000001111111" },
  { indent: 0, bits: " 1100000000000111111" },
  { indent: 0, bits: "111011000011001111111" },
  { indent: 0, bits: "111100000000000111111" },
  { indent: 0, bits: "1111100000000001111" },
  { indent: 0, bits: "  111001100000111" },
  { indent: 0, bits: "    1000000000111" },
  { indent: 0, bits: "     111111111" },
];

// Near the cursor (sizes in em, so they scale with the portrait):
const REACH = 3; // how far the cursor's pull reaches
const PUSH = 0.24; // how far a bit drifts at most, straight away from the cursor
const EASE = 14; // drift speed (1/s)
const GLITCH_RATE = 1.6; // glitches per bit per second, right under the cursor (faint: see .bit[data-g])

/**
 * As the cursor comes near, the bits drift very slightly away from it and ease back when it leaves.
 * Now and then one flickers into some other digit, faintly, for a split second.
 */
export function Avatar({ size, alt }: { size: number; alt: string }) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const bits = [...root.querySelectorAll<HTMLElement>(".bit")];
    const n = bits.length;
    const restX = new Float32Array(n); // each bit's resting centre, px from the portrait's corner
    const restY = new Float32Array(n);
    const offX = new Float32Array(n); // how far it has drifted
    const offY = new Float32Array(n);
    const glitchUntil = new Float64Array(n);
    let cursor: { x: number; y: number } | null = null;
    let raf = 0;
    let last = 0;
    let reach = 0;
    let push = 0;

    const measure = () => {
      const r = root.getBoundingClientRect();
      const em = parseFloat(getComputedStyle(root).fontSize);
      reach = REACH * em;
      push = PUSH * em;
      bits.forEach((b, i) => {
        const br = b.getBoundingClientRect();
        restX[i] = br.left + br.width / 2 - r.left - offX[i];
        restY[i] = br.top + br.height / 2 - r.top - offY[i];
      });
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const ease = 1 - Math.exp(-dt * EASE);
      let busy = cursor !== null;

      for (let i = 0; i < n; i++) {
        const b = bits[i];
        let near = 0;
        let tx = 0;
        let ty = 0;
        if (cursor) {
          const dx = restX[i] - cursor.x;
          const dy = restY[i] - cursor.y;
          const d = Math.hypot(dx, dy);
          if (d < reach) {
            near = (1 - d / reach) ** 2;
            if (d > 0.01) {
              tx = (dx / d) * push * near;
              ty = (dy / d) * push * near;
            }
          }
        }

        // drift
        const px = offX[i];
        const py = offY[i];
        offX[i] += (tx - offX[i]) * ease;
        offY[i] += (ty - offY[i]) * ease;
        if (!tx && !ty && Math.abs(offX[i]) + Math.abs(offY[i]) < 0.01) offX[i] = offY[i] = 0;
        else busy = true;
        if (offX[i] !== px || offY[i] !== py) {
          b.style.transform = offX[i] || offY[i] ? `translate(${offX[i].toFixed(2)}px, ${offY[i].toFixed(2)}px)` : "";
        }

        // glitch
        if (glitchUntil[i]) {
          if (now >= glitchUntil[i]) {
            glitchUntil[i] = 0;
            b.dataset.b = b.dataset.v;
            delete b.dataset.g;
          } else busy = true;
        } else if (near && Math.random() < dt * GLITCH_RATE * near) {
          glitchUntil[i] = now + 120 + Math.random() * 260;
          b.dataset.b = String(2 + Math.floor(Math.random() * 8)); // any digit but a 0 or 1
          b.dataset.g = "";
          busy = true;
        }
      }
      if (busy) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    // Listen on the window so the bits react as the cursor approaches, not only once it's over them.
    let inside = false;
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const near = x > -reach && y > -reach && x < r.width + reach && y < r.height + reach;
      if (near && !inside) measure(); // fresh positions each visit (layout or fonts may have moved)
      inside = near;
      const next = near ? { x, y } : null;
      if (next || cursor) {
        cursor = next;
        wake();
      }
    };
    const onLeave = () => {
      inside = false;
      cursor = null;
      wake();
    };

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, size]);

  return (
    <motion.div
      ref={rootRef}
      role="img"
      aria-label={alt}
      data-measure
      className="relative w-fit select-none font-mono font-normal leading-[calc(11em/12)]"
      style={{ fontSize: size }}
      initial={reduced || intro.played ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
    >
      {/* trimmed to the caps of the first row and the baseline of the last, like the Figma text boxes */}
      <div aria-hidden className="whitespace-pre [text-box:trim-both_cap_alphabetic]">
        {ROWS.map((row, i) => (
          <div key={i} style={{ paddingLeft: `${row.indent}em` }}>
            {[...row.bits].map((c, j) => (c === " " ? " " : <span key={j} className="bit" data-v={c} data-b={c} />))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
