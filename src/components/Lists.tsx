import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EASE_OUT, useFinePointer, useMediaQuery } from "../lib/hooks";
import { isMeasuring, useMeasure } from "../lib/measure";
import { paths } from "../lib/router";
import { formatDate, type Note } from "../notes";
import { Icon } from "./icons";

/** The shared hover plate that glides from row to row. */
function Highlight({ show, id }: { show: boolean; id: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          layoutId={id}
          className="absolute inset-0 rounded-lg bg-fg/[0.045] dark:bg-fg/[0.065]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.8, opacity: { duration: 0.15 } }}
        />
      )}
    </AnimatePresence>
  );
}

type Work = { title: string; description: string; year: string; href: string; tone: string };

const PREVIEW_W = 252;
const PREVIEW_H = 168;

const slide = {
  enter: (dir: number) => ({ y: dir * 28, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir * -28, opacity: 0 }),
};

export function WorkList({ items, columnRef }: { items: Work[]; columnRef: React.RefObject<HTMLElement | null> }) {
  const fine = useFinePointer();
  const roomy = useMediaQuery("(min-width: 1280px)");
  const [active, setActive] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const [left, setLeft] = useState(0);
  const id = useId();
  const rows = useRef<(HTMLAnchorElement | null)[]>([]);
  const centerY = useSpring(0, { stiffness: 420, damping: 40, mass: 0.7 });
  const top = useTransform(centerY, (v) => v - PREVIEW_H / 2);

  const enter = (i: number) => {
    const row = rows.current[i];
    const col = columnRef.current;
    if (row && col) {
      const r = row.getBoundingClientRect();
      const y = r.top + window.scrollY + r.height / 2;
      if (active === null) centerY.jump(y);
      else centerY.set(y);
      setLeft(col.getBoundingClientRect().right + window.scrollX + 48);
    }
    setDir(active === null || i > active ? 1 : -1);
    setActive(i);
  };

  const measuring = isMeasuring(useMeasure());
  const current = active === null || measuring ? null : items[active];

  return (
    <div
      className="-mx-3"
      onPointerLeave={() => setActive(null)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setActive(null)}
    >
      {items.map((it, i) => (
        <a
          key={it.title}
          ref={(el) => {
            rows.current[i] = el;
          }}
          href={it.href}
          onPointerEnter={() => enter(i)}
          onFocus={() => enter(i)}
          data-measure
          className="relative flex items-baseline gap-4 rounded-lg px-3 py-2 outline-offset-0"
        >
          <Highlight show={active === i} id={id} />
          <span className="relative min-w-0">
            <span className="text-fg">{it.title}</span> <span className="text-fg-2">{it.description}</span>
          </span>
          <span className="relative ml-auto shrink-0 text-[13px] leading-4 tabular-nums text-fg-3">{it.year}</span>
        </a>
      ))}

      {fine &&
        roomy &&
        createPortal(
          <AnimatePresence>
            {current && (
              <motion.div
                key="preview"
                aria-hidden
                className="pointer-events-none absolute top-0 z-30 overflow-hidden rounded-xl border border-line bg-bg-2 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.18)]"
                style={{ left, y: top, width: PREVIEW_W, height: PREVIEW_H }}
                initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
              >
                <AnimatePresence initial={false} custom={dir}>
                  <motion.div
                    key={current.title}
                    custom={dir}
                    variants={slide}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease: EASE_OUT }}
                    className="absolute inset-0"
                  >
                    <Thumb tone={current.tone} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

/** Placeholder thumbnail: a tinted dot grid with a mock window. Swap for real images/video. */
function Thumb({ tone }: { tone: string }) {
  return (
    <div className="absolute inset-0" style={{ background: `color-mix(in srgb, ${tone} 9%, var(--bg-2))` }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(color-mix(in srgb, ${tone} 30%, transparent) 1px, transparent 1px)`,
          backgroundSize: "8px 8px",
        }}
      />
      <div className="absolute inset-x-5 bottom-0 top-5 rounded-t-lg border border-b-0 border-line bg-bg shadow-sm">
        <div className="flex gap-1 px-2.5 py-2">
          <span className="size-1.5 rounded-full bg-fg/15" />
          <span className="size-1.5 rounded-full bg-fg/15" />
          <span className="size-1.5 rounded-full bg-fg/15" />
        </div>
        <div className="space-y-1.5 px-3">
          <div className="h-1.5 w-1/2 rounded-full bg-fg/10" />
          <div className="h-1.5 w-1/3 rounded-full bg-fg/10" />
        </div>
        <div className="mx-3 mt-3 h-12 rounded-md" style={{ background: tone }} />
      </div>
    </div>
  );
}

export function NotesList({ items, showCategory = false }: { items: Note[]; showCategory?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const id = useId();
  return (
    <div className="-mx-3" onPointerLeave={() => setActive(null)}>
      {items.map((it) => (
        <a
          key={it.slug}
          href={paths.note(it.slug)}
          onPointerEnter={() => setActive(it.slug)}
          onFocus={() => setActive(it.slug)}
          onBlur={() => setActive(null)}
          data-measure
          className="group relative flex items-baseline gap-4 rounded-lg px-3 py-2"
        >
          <Highlight show={active === it.slug} id={id} />
          <span className="relative min-w-0">
            <span className="text-fg">{it.title}</span>
            {showCategory && <span className="text-fg-2"> {it.category}</span>}
          </span>
          <span className="relative ml-auto shrink-0 text-[13px] leading-4 tabular-nums text-fg-3">
            {formatDate(it.date, "short")}
          </span>
        </a>
      ))}
    </div>
  );
}

export function ExperienceList({ items }: { items: { period: string; company: string; role: string }[] }) {
  return (
    <ul>
      {items.map((it) => (
        <li key={it.period + it.company} data-measure className="flex items-baseline gap-4 py-2 first:pt-0 last:pb-0">
          <span className="w-[88px] shrink-0 text-[13px] leading-4 tabular-nums text-fg-3">{it.period}</span>
          <span className="text-fg">{it.company}</span>
          <span className="text-fg-2">{it.role}</span>
        </li>
      ))}
    </ul>
  );
}

export function LinkRow({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target={l.href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          data-measure="text"
          className="group inline-flex items-center gap-1 text-fg-2 transition-colors duration-150 hover:text-fg"
        >
          {l.label}
          <Icon
            name="arrow"
            size={12}
            className="-translate-x-0.5 translate-y-0.5 opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
          />
        </a>
      ))}
    </div>
  );
}
