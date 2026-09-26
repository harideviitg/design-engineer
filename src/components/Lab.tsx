import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE_OUT } from "../lib/hooks";
import { Icon } from "./icons";

/* Each card is a slot. Swap the demo for any component you want to show off. */
export function LabGrid() {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
      <LabCard title="Hold to confirm" tag="clip-path">
        <HoldToConfirm />
      </LabCard>
      <LabCard title="Copy command" tag="motion">
        <CopyCommand />
      </LabCard>
      <LabCard title="Stretch toggle" tag="spring">
        <StretchToggle />
      </LabCard>
      <LabCard title="Tick slider" tag="input">
        <TickSlider />
      </LabCard>
    </div>
  );
}

function LabCard({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <figure data-measure className="m-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-bg-2">{children}</div>
      <figcaption className="mt-2 flex items-baseline justify-between px-0.5">
        <span className="text-[14px] text-fg">{title}</span>
        <span className="text-[13px] text-fg-3">{tag}</span>
      </figcaption>
    </figure>
  );
}

/* ——— 01 · Hold to confirm: the fill is a clip-path that only commits if you hold on ——— */

const HOLD_MS = 1200;

function HoldToConfirm() {
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = () => {
    if (done || holding) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      setDone(true);
      timer.current = window.setTimeout(() => setDone(false), 1600);
    }, HOLD_MS);
  };
  const cancel = () => {
    if (!holding) return;
    window.clearTimeout(timer.current);
    setHolding(false);
  };

  const filled = holding || done;

  return (
    <div className="absolute inset-0 grid place-items-center">
      <button
        type="button"
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={(e) => (e.key === " " || e.key === "Enter") && cancel()}
        className="relative h-9 touch-none select-none overflow-hidden rounded-full border border-line bg-bg px-4 text-[13px] font-medium text-fg-2 transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        <span>Hold to confirm</span>
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center gap-1.5 bg-fg text-bg"
          style={{
            clipPath: filled ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
            transition: holding
              ? `clip-path ${HOLD_MS}ms linear`
              : "clip-path 240ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          {done && <Icon name="check" size={13} />}
          {done ? "Confirmed" : "Hold to confirm"}
        </span>
        <span className="sr-only" aria-live="polite">
          {done ? "Confirmed" : ""}
        </span>
      </button>
    </div>
  );
}

/* ——— 02 · Copy command: icon morph with blur, Emil-style ——— */

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const command = "npx create-portfolio";

  const copy = () => {
    navigator.clipboard?.writeText(command).catch(() => {});
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="absolute inset-0 grid place-items-center">
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-3 rounded-lg border border-line bg-bg py-1.5 pl-3 pr-1.5 font-mono text-[12px] uppercase text-fg-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        <span>
          <span className="text-fg-3">$</span> {command}
        </span>
        <span className="relative grid size-6 place-items-center rounded-md bg-bg-2 text-fg">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={copied ? "check" : "copy"}
              className="grid"
              initial={{ opacity: 0, scale: 0.4, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.4, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Icon name={copied ? "check" : "copy"} size={13} />
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
    </div>
  );
}

/* ——— 03 · Stretch toggle: the thumb stretches while pressed, then springs across ——— */

function StretchToggle() {
  const [on, setOn] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Stretch toggle"
        onClick={() => setOn((v) => !v)}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        className={`flex h-7 w-12 items-center rounded-full p-[3px] transition-colors duration-200 ease-out ${
          on ? "justify-end bg-accent" : "justify-start bg-line-2"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 38 }}
          className="block h-[22px] bg-white shadow-[0_1px_3px_rgb(0_0_0/0.2)]"
          style={{ width: pressed ? 28 : 22, borderRadius: 11 }}
        />
      </button>
    </div>
  );
}

/* ——— 04 · Tick slider: ticks swell around the value like a loupe ——— */

function TickSlider() {
  const MAX = 40;
  const [pos, setPos] = useState(24);
  const track = useRef<HTMLDivElement>(null);

  // No grabbing: the value simply follows the cursor while it's over the slider.
  const follow = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    setPos(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * MAX);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-7">
      <div className="text-[22px] font-medium leading-none tracking-tight tabular-nums text-fg">
        {Math.round(pos)}
        <span className="text-fg-3">px</span>
      </div>
      {/* the hover area is taller than the ticks, so the value doesn't drop out at the edges */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Spacing"
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={Math.round(pos)}
        onPointerEnter={follow}
        onPointerMove={follow}
        onPointerDown={follow}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 1;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") setPos((v) => Math.min(MAX, Math.round(v) + step));
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPos((v) => Math.max(0, Math.round(v) - step));
          else return;
          e.preventDefault();
        }}
        className="-my-5 w-full touch-none rounded-sm py-5"
      >
      <div ref={track} className="relative flex h-9 w-full items-end justify-between">
        {Array.from({ length: MAX + 1 }, (_, i) => {
          const d = i - pos;
          const swell = Math.exp(-(d * d) / 5);
          const current = Math.round(pos) === i;
          return (
            <span
              key={i}
              className={`w-px rounded-full ${current ? "bg-accent" : i % 10 === 0 ? "bg-fg-2" : "bg-fg-3/60"}`}
              style={{
                height: 6 + 18 * swell + (i % 10 === 0 ? 4 : 0),
                transition: "height 160ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            />
          );
        })}
      </div>
      </div>
    </div>
  );
}
