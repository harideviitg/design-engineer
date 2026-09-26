import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { site } from "./content";
import { Inspector } from "./components/Inspector";
import { Kbd } from "./components/Kbd";
import { Rulers } from "./components/Rulers";
import { intro, useTools } from "./lib/hooks";
import { useMeasureTracking } from "./lib/measure";
import { routeKey, useRoute, useScrollMemory } from "./lib/router";
import { getNote } from "./notes";
import { Home } from "./pages/Home";
import { NotePage } from "./pages/NotePage";
import { NotesIndex } from "./pages/NotesIndex";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export default function App() {
  const columnRef = useRef<HTMLDivElement>(null);
  const tools = useTools();
  const route = useRoute();
  const key = routeKey(route);
  useMeasureTracking(tools);
  useScrollMemory(key);

  useEffect(() => {
    intro.played = true;
  }, []);

  useEffect(() => {
    const base = `${site.name} — ${site.role}`;
    if (route.name === "notes") document.title = `Notes — ${site.name}`;
    else if (route.name === "note") document.title = `${getNote(route.slug)?.title ?? "Note"} — ${site.name}`;
    else document.title = base;
  }, [route]);

  return (
    <>
      {tools && <Rulers originRef={columnRef} />}
      {tools && <Inspector columnRef={columnRef} />}

      <main className="px-5 pb-16 pt-16 md:px-10 md:pb-24 md:pt-32">
        <div ref={columnRef} className="relative mx-auto w-full max-w-[640px]">
          <motion.div
            key={key}
            initial={intro.played ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {route.name === "home" && <Home columnRef={columnRef} />}
            {route.name === "notes" && <NotesIndex />}
            {route.name === "note" && <NotePage slug={route.slug} />}
          </motion.div>

          <footer className="mt-24 flex flex-col gap-2 border-t border-line pt-5 text-[13px] leading-5 text-fg-3 md:flex-row md:items-center md:justify-between">
            <span>
              © {new Date().getFullYear()} {site.name} · Updated {site.updated}
            </span>
            {tools && (
              <span className="flex items-center gap-1.5">
                Hold <Kbd>{isMac ? "⌥" : "Alt"}</Kbd> or press <Kbd>M</Kbd> to measure
              </span>
            )}
          </footer>
        </div>
      </main>
    </>
  );
}
