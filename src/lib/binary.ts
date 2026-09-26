/**
 * Hover effect for the avatar: every pixel-art cell flips to a 0 or a 1 (ink → 1, everything
 * light → 0), rippling outward from the pointer, and flips back when it leaves.
 * At rest each cell is drawn as a plain block on a shared pixel lattice, which reproduces the
 * art exactly, so there is no swap or pop between the resting and hovered states.
 */

// The SVG is rasterised with its ink swapped for this sentinel so the live theme colour
// can be painted in later (and blend along with the page).
const INK_SENTINEL = "rgb(1 2 3)";
// The art's other two colours (see src/assets/avatar.svg): the white face and the light skin tone.
const WHITE = "rgb(255 255 255)";
const SKIN = "rgb(235 235 233)";

export type Cells = {
  n: number;
  cols: number;
  rows: number;
  ci: Uint16Array;
  cj: Uint16Array;
  color: string[]; // per cell, original colour (ink cells hold the sentinel)
  isInk: Uint8Array;
};

export async function buildCells(svgText: string, cols: number, rows: number): Promise<Cells> {
  const S = 8; // raster oversample per cell
  const sized = svgText
    .replaceAll("currentColor", "#010203")
    .replace(/^<svg\s+width="[^"]*"\s+height="[^"]*"/, `<svg width="${cols * S}" height="${rows * S}" preserveAspectRatio="none"`);
  const url = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = cols * S;
    c.height = rows * S;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;

    const ci: number[] = [];
    const cj: number[] = [];
    const color: string[] = [];
    const isInk: number[] = [];

    // Different browsers rasterise the SVG a touch differently, so one sample per pixel can come
    // back slightly off (a near-black that isn't quite the ink marker). Instead: read five points,
    // let them vote, and snap the winner to one of the art's three colours.
    const points: [number, number][] = [
      [0.5, 0.5],
      [0.25, 0.25],
      [0.75, 0.25],
      [0.25, 0.75],
      [0.75, 0.75],
    ];
    const classify = (r: number, g: number, b: number): 0 | 1 | 2 => {
      if (Math.max(r, g, b) < 100) return 0; // ink (dark)
      return Math.min(r, g, b) >= 245 ? 2 : 1; // white : skin
    };
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const votes = [0, 0, 0];
        let solid = 0;
        for (const [fx, fy] of points) {
          const o = ((Math.floor((j + fy) * S) * c.width) + Math.floor((i + fx) * S)) * 4;
          if (px[o + 3] < 128) continue;
          solid++;
          votes[classify(px[o], px[o + 1], px[o + 2])]++;
        }
        if (solid < 3) continue; // mostly empty: not part of the art
        const kind = votes.indexOf(Math.max(...votes));
        ci.push(i);
        cj.push(j);
        color.push(kind === 0 ? INK_SENTINEL : kind === 2 ? WHITE : SKIN);
        isInk.push(kind === 0 ? 1 : 0);
      }
    return { n: ci.length, cols, rows, ci: Uint16Array.from(ci), cj: Uint16Array.from(cj), color, isInk: Uint8Array.from(isInk) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type Palette = { ink: string; one: string; zero: string };

const RADIUS = 20; // CSS px the cursor reaches
const EDGE = 8; // soft falloff at the rim, so the spot has no hard border
const RATE_IN = 20; // ease-in speed (1/s)
const RATE_OUT = 11; // ease-out speed, a touch slower so it trails the cursor
const smooth = (t: number) => t * t * (3 - 2 * t);

export class BinarySim {
  private t: Float32Array;
  private cursor: { x: number; y: number } | null = null;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private edgeX: number[] = [];
  private edgeY: number[] = [];
  private cellW: number;
  private cellH: number;
  private raf = 0;
  private last = 0;
  private time = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private d: Cells,
    W: number,
    H: number,
    private palette: Palette,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.t = new Float32Array(d.n);
    this.cellW = W / d.cols;
    this.cellH = H / d.rows;
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * this.dpr);
    canvas.height = Math.round(H * this.dpr);
    this.edgeX = Array.from({ length: d.cols + 1 }, (_, i) => Math.round(i * this.cellW * this.dpr));
    this.edgeY = Array.from({ length: d.rows + 1 }, (_, j) => Math.round(j * this.cellH * this.dpr));
    this.draw();
  }

  setPalette(p: Palette) {
    this.palette = p;
    if (!this.raf) this.draw();
  }

  /** Re-render once the mono face has arrived. */
  refresh() {
    if (!this.raf) this.draw();
  }

  /** Pointer position in CSS px, relative to the avatar. */
  enter(x: number, y: number) {
    this.cursor = { x, y };
    this.wake();
  }
  move(x: number, y: number) {
    this.cursor = { x, y };
    this.wake();
  }
  leave() {
    this.cursor = null;
    this.wake();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private wake() {
    if (!this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.step);
    }
  }

  private step = (now: number) => {
    this.raf = 0;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.time += dt;
    const c = this.cursor;
    const { ci, cj, n } = this.d;
    let busy = c !== null;
    for (let i = 0; i < n; i++) {
      // target: 1 inside the spot, easing to 0 across a soft edge, 0 everywhere else
      let target = 0;
      if (c) {
        const d = Math.hypot((ci[i] + 0.5) * this.cellW - c.x, (cj[i] + 0.5) * this.cellH - c.y);
        target = Math.min(1, Math.max(0, (RADIUS - d) / EDGE));
      }
      const t = this.t[i];
      if (t === target) continue;
      // quick to turn on, a little slower to let go
      const rate = target > t ? RATE_IN : RATE_OUT;
      let next = t + (target - t) * (1 - Math.exp(-dt * rate));
      if (Math.abs(target - next) < 0.004) next = target;
      this.t[i] = next;
      busy = true;
    }
    this.draw();
    if (busy) this.raf = requestAnimationFrame(this.step);
  };

  private draw() {
    const { ctx, d, dpr, palette } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const fontPx = this.cellH * dpr * 1.1;
    ctx.font = `500 ${fontPx}px "Geist Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const frame = Math.floor(this.time * 18);

    for (let i = 0; i < d.n; i++) {
      const t = this.t[i];
      const ci = d.ci[i];
      const cj = d.cj[i];
      const x0 = this.edgeX[ci];
      const y0 = this.edgeY[cj];
      const w = this.edgeX[ci + 1] - x0;
      const h = this.edgeY[cj + 1] - y0;

      if (t < 1) {
        ctx.globalAlpha = 1 - smooth(t);
        ctx.fillStyle = d.isInk[i] ? palette.ink : d.color[i];
        ctx.fillRect(x0, y0, w, h);
      }
      if (t > 0) {
        // while a cell is mid-flip it scrambles, then lands on its true value
        const real = d.isInk[i];
        const digit = t >= 1 ? real : (((i * 2654435761 + frame * 40503) >>> 0) >> 7) & 1;
        ctx.globalAlpha = smooth(t);
        ctx.fillStyle = digit ? palette.one : palette.zero;
        ctx.fillText(String(digit), x0 + w / 2, y0 + h / 2 + fontPx * 0.35);
      }
    }
    ctx.globalAlpha = 1;
  }
}
