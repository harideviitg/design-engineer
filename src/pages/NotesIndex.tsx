import { motion } from "motion/react";
import { useId, useState } from "react";
import { NotesList } from "../components/Lists";
import { TopBar } from "../components/PageChrome";
import { EASE_OUT } from "../lib/hooks";
import { paths } from "../lib/router";
import { categories, sortedNotes } from "../notes";

export function NotesIndex() {
  const [category, setCategory] = useState("All");
  const pillId = useId();
  const shown = category === "All" ? sortedNotes : sortedNotes.filter((n) => n.category === category);

  return (
    <>
      <TopBar backTo={paths.home} backLabel="Home" />

      <div className="md:grid md:grid-cols-[128px_minmax(0,1fr)] md:gap-x-8">
        <div className="hidden md:block" />
        <div className="min-w-0">
          <h1 data-measure="text" className="w-fit text-[28px] font-medium leading-9 tracking-[-0.02em] text-fg">
            Notes
          </h1>
          <p data-measure="text" className="mt-3 text-fg-2">
            Things I've worked out about interfaces, motion and the small details.
          </p>

          <div role="tablist" aria-label="Filter notes by category" className="-mx-3 mt-8 flex flex-wrap gap-1">
            {categories.map((c) => {
              const on = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  data-measure
                  onClick={() => setCategory(c)}
                  className={`relative h-8 rounded-full px-3 text-[13px] transition-colors duration-150 ease-out active:scale-[0.97] ${
                    on ? "text-bg" : "text-fg-2 hover:text-fg"
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId={pillId}
                      className="absolute inset-0 rounded-full bg-fg"
                      transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
                    />
                  )}
                  <span className="relative">{c}</span>
                </button>
              );
            })}
          </div>

          <motion.div
            key={category}
            className="mt-4"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <NotesList items={shown} showCategory />
          </motion.div>
        </div>
      </div>
    </>
  );
}
