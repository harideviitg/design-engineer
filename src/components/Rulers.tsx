import { useEffect, useRef } from "react";
import { cssVar } from "../lib/hooks";
import { measure, useMeasure } from "../lib/measure";
import { Icon } from "./icons";

const T = 20; // ruler thickness (CSS px)

const readColors = () => ({
  bg: cssVar("--ruler-bg"),
  line: cssVar("--line"),
  tick: cssVar("--ruler-tick"),
  label: cssVar("--fg-3"),
  accent: cssVar("--accent"),
  soft: cssVar("--accent-soft"),
});

/**
 * Design-tool rulers pinned to the top and left edges.
 * x = 0 sits on the content column's left edge, y = 0 on its top edge.
 * The cursor gets a live readout; whatever [data-measure] element is hovered
 * gets its extent banded on both rulers.
 */
export function Rulers({ originRef }: { originRef: React.RefObject<HTMLElement | null> }) {
  const topRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const { pinned, alt } = useMeasure();

  useEffect(() => {
    const top = topRef.current;
    const left = leftRef.current;
    const ct = top?.getContext("2d");
    const cl = left?.getContext("2d");
    if (!top || !left || !ct || !cl) return;

    let colors = readColors();
    let dpr = 1;
    let hair = 1;
    let vw = 0;
    let vh = 0;
    let raf = 0;
    let last = 0;

    const s = {
      mx: 0,
      my: 0,
      pointer: false,
      pop: 0,
      popTo: 0,
      alpha: 0,
      alphaTo: 0,
      band: { x0: 0, x1: 0, y0: 0, y1: 0 }, // x: viewport px, y: document px
      goal: { x0: 0, x1: 0, y0: 0, y1: 0 },
      el: null as HTMLElement | null,
    };

    const px = (v: number) => Math.round(v * dpr);

    const readGoal = () => {
      if (!s.el?.isConnected) return;
      const r = s.el.getBoundingClientRect();
      s.goal = { x0: r.left, x1: r.right, y0: r.top + window.scrollY, y1: r.bottom + window.scrollY };
    };

    // Tick labels are light; readouts get a little more weight so they stay legible.
    const setFont = (c: CanvasRenderingContext2D, weight = 300) => {
      c.font = `${weight} ${10 * dpr}px Geist, ui-sans-serif, system-ui, sans-serif`;
      c.textBaseline = "alphabetic";
      c.textAlign = "left";
    };

    // Accent readout pill. `rot` = -90° on the vertical ruler.
    const pill = (c: CanvasRenderingContext2D, text: string, cx: number, cy: number, scale: number, rot: number) => {
      c.save();
      setFont(c, 500);
      const m = c.measureText(text);
      // sized off zeros so the pill doesn't twitch as the digits change
      const w = Math.ceil(c.measureText("0".repeat(text.length)).width) + px(8);
      const h = px(14);
      c.translate(cx, cy);
      if (rot) c.rotate(rot);
      c.scale(scale, scale);
      c.fillStyle = colors.accent;
      c.beginPath();
      c.roundRect(-w / 2, -h / 2, w, h, px(3));
      c.fill();
      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.fillText(text, 0, Math.round((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2));
      c.restore();
    };

    // Text rotated -90°, reading upwards, starting at y = `start`.
    const vText = (c: CanvasRenderingContext2D, text: string, start: number, color: string) => {
      c.save();
      c.translate(px(10), start);
      c.rotate(-Math.PI / 2);
      c.fillStyle = color;
      c.fillText(text, 0, 0);
      c.restore();
    };

    const drawTop = (ox: number) => {
      const c = ct;
      const W = top.width;
      const H = top.height;
      c.fillStyle = colors.bg;
      c.fillRect(0, 0, W, H);
      setFont(c);

      for (let v = Math.ceil((T - ox) / 10) * 10; v <= vw - ox; v += 10) {
        const x = px(ox + v - T);
        const major = v % 100 === 0;
        const len = major ? T : v % 50 === 0 ? 6 : 3;
        c.fillStyle = colors.tick;
        c.fillRect(x, H - px(len), hair, px(len));
        if (major) {
          c.fillStyle = colors.label;
          c.fillText(String(v), x + px(3), px(10));
        }
      }

      if (s.alpha > 0.004) {
        c.globalAlpha = s.alpha;
        const x0 = px(s.band.x0 - T);
        const x1 = px(s.band.x1 - T);
        c.fillStyle = colors.soft;
        c.fillRect(x0, 0, x1 - x0, H);
        c.fillStyle = colors.accent;
        c.fillRect(x0, 0, hair, H);
        c.fillRect(x1 - hair, 0, hair, H);
        setFont(c, 400);
        const a = String(Math.round(s.band.x0 - ox));
        const b = String(Math.round(s.band.x1 - ox));
        const wa = Math.ceil(c.measureText(a).width) + px(4);
        const wb = Math.ceil(c.measureText(b).width) + px(4);
        c.fillStyle = colors.bg;
        c.fillRect(x0 - wa - px(2), 0, wa, H - hair);
        c.fillRect(x1 + px(2), 0, wb, H - hair);
        c.fillStyle = colors.accent;
        c.fillText(a, x0 - wa, px(10));
        c.fillText(b, x1 + px(4), px(10));
        c.globalAlpha = 1;
      }

      if (s.pointer && s.pop > 0.004) {
        c.globalAlpha = s.pop;
        const x = px(s.mx - T);
        c.fillStyle = colors.accent;
        c.fillRect(x, 0, hair, H);
        pill(c, String(Math.round(s.mx - ox)), x, H / 2, 0.75 + 0.25 * s.pop, 0);
        c.globalAlpha = 1;
      }

      c.fillStyle = colors.line;
      c.fillRect(0, H - hair, W, hair);
    };

    const drawLeft = (oy: number) => {
      const c = cl;
      const W = left.width;
      const H = left.height;
      c.fillStyle = colors.bg;
      c.fillRect(0, 0, W, H);
      setFont(c);

      for (let v = Math.ceil((T - oy) / 10) * 10; v <= vh - oy; v += 10) {
        const y = px(oy + v - T);
        const major = v % 100 === 0;
        const len = major ? T : v % 50 === 0 ? 6 : 3;
        c.fillStyle = colors.tick;
        c.fillRect(W - px(len), y, px(len), hair);
        if (major) vText(c, String(v), y - px(3), colors.label);
      }

      if (s.alpha > 0.004) {
        c.globalAlpha = s.alpha;
        const y0 = px(s.band.y0 - window.scrollY - T);
        const y1 = px(s.band.y1 - window.scrollY - T);
        c.fillStyle = colors.soft;
        c.fillRect(0, y0, W, y1 - y0);
        c.fillStyle = colors.accent;
        c.fillRect(0, y0, W, hair);
        c.fillRect(0, y1 - hair, W, hair);
        setFont(c, 400);
        const a = String(Math.round(s.band.y0 - window.scrollY - oy));
        const b = String(Math.round(s.band.y1 - window.scrollY - oy));
        const wa = Math.ceil(c.measureText(a).width) + px(4);
        const wb = Math.ceil(c.measureText(b).width) + px(4);
        c.fillStyle = colors.bg;
        c.fillRect(0, y0 - wa - px(2), W - hair, wa);
        c.fillRect(0, y1 + px(2), W - hair, wb);
        vText(c, a, y0 - px(4), colors.accent);
        vText(c, b, y1 + wb, colors.accent);
        c.globalAlpha = 1;
      }

      if (s.pointer && s.pop > 0.004) {
        c.globalAlpha = s.pop;
        const y = px(s.my - T);
        c.fillStyle = colors.accent;
        c.fillRect(0, y, W, hair);
        pill(c, String(Math.round(s.my - oy)), W / 2, y, 0.75 + 0.25 * s.pop, -Math.PI / 2);
        c.globalAlpha = 1;
      }

      c.fillStyle = colors.line;
      c.fillRect(W - hair, 0, hair, H);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      readGoal();
      let moving = false;
      const approach = (cur: number, to: number, rate: number) => {
        const next = cur + (to - cur) * (1 - Math.exp(-dt * rate));
        if (Math.abs(to - next) < 0.01) return to;
        moving = true;
        return next;
      };
      s.alpha = approach(s.alpha, s.alphaTo, 14);
      s.pop = approach(s.pop, s.popTo, 18);
      s.band.x0 = approach(s.band.x0, s.goal.x0, 22);
      s.band.x1 = approach(s.band.x1, s.goal.x1, 22);
      s.band.y0 = approach(s.band.y0, s.goal.y0, 22);
      s.band.y1 = approach(s.band.y1, s.goal.y1, 22);

      paint();

      if (moving) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const paint = () => {
      const col = originRef.current?.getBoundingClientRect();
      drawTop(col?.left ?? 0);
      drawLeft(col?.top ?? 0);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      hair = Math.max(1, Math.floor(dpr));
      vw = document.documentElement.clientWidth;
      vh = window.innerHeight;
      top.width = px(vw - T);
      top.height = px(T);
      top.style.width = `${vw - T}px`;
      top.style.height = `${T}px`;
      left.width = px(T);
      left.height = px(vh - T);
      left.style.width = `${T}px`;
      left.style.height = `${vh - T}px`;
      schedule();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      s.mx = e.clientX;
      s.my = e.clientY;
      s.pointer = true;
      s.popTo = 1;
      schedule();
    };
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      s.popTo = 0;
      schedule();
    };

    const unsubscribe = measure.subscribe(() => {
      const el = measure.get().target;
      if (el === s.el) return;
      s.el = el;
      if (el) {
        readGoal();
        if (s.alpha < 0.05) s.band = { ...s.goal }; // appear in place, glide only between targets
        s.alphaTo = 1;
      } else {
        s.alphaTo = 0;
      }
      schedule();
    });

    // Theme colours blend over ~400ms, so keep re-reading them until they've landed.
    let themeUntil = 0;
    const followTheme = () => {
      colors = readColors();
      paint();
      if (performance.now() < themeUntil) requestAnimationFrame(followTheme);
    };
    const themeObserver = new MutationObserver(() => {
      themeUntil = performance.now() + 450;
      followTheme();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const layoutObserver = new ResizeObserver(schedule);
    layoutObserver.observe(document.body);

    Promise.all(["300 10px Geist", "400 10px Geist", "500 10px Geist"].map((f) => document.fonts.load(f))).then(
      schedule,
      () => {},
    );

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      themeObserver.disconnect();
      layoutObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
    };
  }, [originRef]);

  const active = pinned || alt;

  return (
    <>
      <canvas ref={topRef} aria-hidden className="ruler-in-x pointer-events-none fixed left-5 top-0 z-40" />
      <canvas ref={leftRef} aria-hidden className="ruler-in-y pointer-events-none fixed left-0 top-5 z-40" />
      <button
        type="button"
        data-measure-ignore
        onClick={() => measure.set({ pinned: !measure.get().pinned })}
        aria-pressed={pinned}
        aria-label="Toggle measure mode (M)"
        className={`group fixed left-0 top-0 z-50 grid size-5 place-items-center border-b border-r border-line bg-[var(--ruler-bg)] transition-colors duration-150 ${
          active ? "text-accent" : "text-fg-3 hover:text-fg"
        }`}
      >
        <Icon name="ruler" size={12} strokeWidth={1.25} />
        <span className="pointer-events-none absolute left-full top-full ml-1.5 mt-1.5 flex translate-y-[-2px] items-center gap-1.5 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-[12px] leading-none text-bg opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-300">
          Measure <span className="opacity-60">M / hold Alt</span>
        </span>
      </button>
    </>
  );
}
