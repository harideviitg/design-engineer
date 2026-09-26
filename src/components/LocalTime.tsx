import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { EASE_OUT, useNow } from "../lib/hooks";

/** Minutes east of UTC for `timeZone` at `date`. */
function tzOffset(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUTC - date.getTime()) / 60000);
}

function relative(mins: number) {
  if (mins === 0) return "Same time as you";
  const a = Math.abs(mins);
  const span = [Math.floor(a / 60) && `${Math.floor(a / 60)}h`, a % 60 && `${a % 60}m`].filter(Boolean).join(" ");
  return `${span} ${mins > 0 ? "ahead of" : "behind"} you`;
}

export function LocalTime({ timeZone, tz, label }: { timeZone: string; tz: string; label: string }) {
  const now = useNow();
  const [open, setOpen] = useState(false);
  const format = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }),
    [timeZone],
  );
  const diff = tzOffset(timeZone, now) + now.getTimezoneOffset();

  return (
    <span
      className="relative inline-flex cursor-default outline-none"
      tabIndex={0}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      data-measure
    >
      <span>
        {label} · <time className="tabular-nums">{format.format(now)}</time> {tz}
      </span>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="absolute left-0 top-full z-10 mt-2 whitespace-nowrap rounded-[4px] bg-fg px-1.5 py-[3px] leading-none text-bg shadow-lg"
          >
            {relative(diff)}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
