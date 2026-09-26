type Shape = "circle" | "square" | "triangle";

interface Cell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  parent: Cell | null;
  depth: number;
  angle: number;
  shape: Shape;
  scale: number;
  vel: number;
  alpha: number;
}

interface Step {
  at: number;
  parent: number;
  angle: number;
}

const QUARTER = Math.PI / 2;
const PLAN: Step[] = [{ at: 0, parent: -1, angle: 0 }];
for (let i = 0; i < 4; i++) {
  PLAN.push({ at: 500 + i * 110, parent: 0, angle: Math.PI / 4 + i * QUARTER });
}
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 2; j++) {
    PLAN.push({ at: 1200 + (i * 2 + j) * 80, parent: 1 + i, angle: Math.PI / 4 + i * QUARTER + (j ? 0.42 : -0.42) });
  }
}

const RING = [0, 0.2, 0.32];
const SQUARE_HALF = 0.92;
const CORNER = 0.22; // corner radius as a fraction of the shape's size
const TRIANGLE_RADIUS = 1.36;

/**
 * Circle -> 4 squares -> 8 triangles, popped in once, then it just sits there
 * and can be dragged around. The three shapes are optically matched. Fills its host,
 * draws in the host's CSS `color`, and sleeps when nothing is moving.
 */
export function mountBacteriaMap(host: HTMLElement): () => void {
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none";
  host.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const cells: Cell[] = [];
  let w = 0;
  let h = 0;
  let size = 6;
  let ink = "#888";
  let hover: Cell | null = null;
  let drag: Cell | null = null;
  const aim = { x: 0, y: 0 };
  const grab = { x: 0, y: 0 };
  let next = 0;
  let clock = 0;
  let last = 0;
  let raf = 0;
  let blendUntil = 0;
  let visible = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const readColors = () => {
    ink = getComputedStyle(host).color;
  };

  const anchor = (c: Cell): [number, number] => {
    const f = RING[c.depth];
    return [w / 2 + Math.cos(c.angle) * f * w, h / 2 + Math.sin(c.angle) * f * h];
  };

  const spawn = (s: Step) => {
    const parent = s.parent < 0 ? null : cells[s.parent];
    const depth = parent ? parent.depth + 1 : 0;
    cells.push({
      x: (parent ? parent.x : w / 2) + Math.cos(s.angle) * 3,
      y: (parent ? parent.y : h / 2) + Math.sin(s.angle) * 3,
      vx: 0, vy: 0, parent, depth, angle: s.angle,
      shape: depth === 0 ? "circle" : depth === 1 ? "square" : "triangle",
      scale: reduced ? 1 : 0, vel: 0, alpha: 1,
    });
  };

  const step = (k: number): boolean => {
    const pad = Math.max(size * 3, 26);

    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        const a = cells[i];
        const b = cells[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 30;
        const d = Math.sqrt(d2);
        const f = ((size * size * 8) / d2) * k;
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      }
    }

    for (const c of cells) {
      const [ax, ay] = anchor(c);
      const pull = (c.depth === 0 ? 0.03 : 0.012) * k;
      c.vx += (ax - c.x) * pull;
      c.vy += (ay - c.y) * pull;
      const p = c.parent;
      if (p) {
        const [pax, pay] = anchor(p);
        const rest = Math.hypot(ax - pax, ay - pay);
        const dx = c.x - p.x;
        const dy = c.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - rest) * 0.05 * k;
        c.vx -= (dx / d) * f; c.vy -= (dy / d) * f;
        p.vx += (dx / d) * f * 0.5; p.vy += (dy / d) * f * 0.5;
      }
    }

    let busy = next < PLAN.length || drag !== null;
    const damp = Math.pow(0.84, k);
    for (const c of cells) {
      if (c !== drag) {
        c.vx *= damp; c.vy *= damp;
        c.x += c.vx * k; c.y += c.vy * k;
        if (Math.abs(c.vx) + Math.abs(c.vy) > 0.02) busy = true;
      }
      c.vel = (c.vel + (1 - c.scale) * 0.2 * k) * Math.pow(0.68, k);
      c.scale += c.vel * k;
      if (Math.abs(1 - c.scale) > 0.002 || Math.abs(c.vel) > 0.002) busy = true;
      const target = c === hover || c === drag ? 0.25 : 1;
      c.alpha += (target - c.alpha) * Math.min(1, 0.25 * k);
      if (Math.abs(target - c.alpha) > 0.005) busy = true;
    }

    if (drag) {
      const tx = Math.max(pad, Math.min(w - pad, aim.x));
      const ty = Math.max(pad, Math.min(h - pad, aim.y));
      const nx = drag.x + (tx - drag.x) * Math.min(1, 0.4 * k);
      const ny = drag.y + (ty - drag.y) * Math.min(1, 0.4 * k);
      drag.vx = (nx - drag.x) / k;
      drag.vy = (ny - drag.y) / k;
      drag.x = nx;
      drag.y = ny;
    }
    return busy;
  };

  const outline = (c: Cell, r: number) => {
    ctx.beginPath();
    if (c.shape === "circle") {
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    } else if (c.shape === "square") {
      const s = r * SQUARE_HALF;
      ctx.roundRect(c.x - s, c.y - s, s * 2, s * 2, s * CORNER);
    } else {
      const t = r * TRIANGLE_RADIUS;
      const pts: [number, number][] = [0, 1, 2].map((i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
        return [c.x + Math.cos(a) * t, c.y + Math.sin(a) * t];
      });
      // round each corner: start at the midpoint of the last edge, arc through every vertex
      const mid = (p: [number, number], q: [number, number]): [number, number] => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const start = mid(pts[2], pts[0]);
      ctx.moveTo(start[0], start[1]);
      for (let i = 0; i < 3; i++) {
        const v = pts[i];
        const n = pts[(i + 1) % 3];
        ctx.arcTo(v[0], v[1], (v[0] + n[0]) / 2, (v[1] + n[1]) / 2, t * CORNER * 0.75);
      }
      ctx.closePath();
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;

    for (const c of cells) {
      if (!c.parent) continue;
      const g = Math.max(0, Math.min(1, c.scale));
      ctx.globalAlpha = 0.3 * g;
      ctx.beginPath();
      ctx.moveTo(c.parent.x, c.parent.y);
      ctx.lineTo(c.parent.x + (c.x - c.parent.x) * g, c.parent.y + (c.y - c.parent.y) * g);
      ctx.stroke();
    }

    for (const c of cells) {
      const r = size * Math.max(0, c.scale);
      if (r < 0.2) continue;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-out";
      outline(c, r + 4.5);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = c.alpha * 0.8;
      outline(c, r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const frame = (t: number) => {
    raf = 0;
    if (!w || !h) return;
    const dt = Math.max(0, Math.min(t - last, 50));
    last = t;
    clock += dt;
    while (next < PLAN.length && clock >= PLAN[next].at) spawn(PLAN[next++]);
    // the page blends its colours over ~380ms, so keep reading the ink until that settles
    const blending = t < blendUntil;
    if (blending) readColors();
    const busy = step(Math.max(dt, 1) / 16.667);
    draw();
    if (busy || blending) raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (raf || !visible) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const r = host.getBoundingClientRect();
    w = r.width;
    h = r.height;
    size = Math.max(0.8, Math.min(1.8, Math.min(w, h) / 200)) * 5.2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced && w && h && !cells.length) {
      while (next < PLAN.length) spawn(PLAN[next++]);
      for (const c of cells) [c.x, c.y] = anchor(c);
    }
    wake();
  };

  const pick = (x: number, y: number): Cell | null => {
    let best: Cell | null = null;
    let bestDist = size * 1.7;
    for (const c of cells) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  };

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: PointerEvent) => {
    const p = local(e);
    const c = pick(p.x, p.y);
    if (!c) return;
    drag = c;
    grab.x = c.x - p.x;
    grab.y = c.y - p.y;
    aim.x = c.x;
    aim.y = c.y;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    wake();
  };

  const onMove = (e: PointerEvent) => {
    const p = local(e);
    if (drag) {
      aim.x = p.x + grab.x;
      aim.y = p.y + grab.y;
      wake();
      return;
    }
    const c = pick(p.x, p.y);
    if (c !== hover) {
      hover = c;
      canvas.style.cursor = c ? "grab" : "default";
      wake();
    }
  };

  const onUp = (e: PointerEvent) => {
    if (!drag) return;
    drag = null;
    const p = local(e);
    hover = pick(p.x, p.y);
    canvas.style.cursor = hover ? "grab" : "default";
    wake();
  };

  const onLeave = () => {
    if (drag) return;
    hover = null;
    canvas.style.cursor = "default";
    wake();
  };

  const onTheme = () => {
    readColors();
    blendUntil = performance.now() + 500;
    wake();
  };

  readColors();
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(host);
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", onTheme);
  const mo = new MutationObserver(onTheme);
  mo.observe(document.documentElement, { attributes: true });
  mo.observe(document.body, { attributes: true });

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    mo.disconnect();
    scheme.removeEventListener("change", onTheme);
    canvas.remove();
  };
}
