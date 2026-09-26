import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/icons";
import { BackToTop, TopBar } from "../components/PageChrome";
import { Prose } from "../components/Prose";
import { useReducedMotion } from "../lib/hooks";
import { paths } from "../lib/router";
import { formatDate, getNote, neighbours, readingMinutes, slugify, type Note } from "../notes";

export function NotePage({ slug }: { slug: string }) {
  const note = getNote(slug);
  if (!note) return <Missing />;
  return <Article note={note} />;
}

function Missing() {
  return (
    <>
      <TopBar backTo={paths.notes} backLabel="Notes" />
      <p className="text-fg-2">
        That note doesn't exist. <a href={paths.notes} className="link text-fg">See all notes</a>.
      </p>
    </>
  );
}

function Article({ note }: { note: Note }) {
  const reduced = useReducedMotion();
  const articleRef = useRef<HTMLElement>(null);
  const toc = useMemo(
    () => note.body.flatMap((b) => (b.type === "h2" ? [{ id: slugify(b.text), text: b.text }] : [])),
    [note],
  );
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null);
  const progress = useMotionValue(0);
  const fill = useSpring(progress, { stiffness: 260, damping: 34, mass: 0.6 });

  // Which section is under the top of the screen, and how far through the note you are.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = articleRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      progress.set(Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight * 0.6))));
      let current = toc[0]?.id ?? null;
      for (const { id } of toc) {
        const h = document.getElementById(id);
        if (h && h.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [toc, progress]);

  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  const { newer, older } = neighbours(note.slug);

  return (
    <>
      <TopBar backTo={paths.notes} backLabel="Notes" />

      <div className="md:grid md:grid-cols-[128px_minmax(0,1fr)] md:gap-x-8">
        {/* contents, pinned in the gutter */}
        <aside className="hidden md:block">
          {toc.length > 0 && (
            <nav aria-label="On this page" className="sticky top-24">
              <p className="mb-3 font-mono text-[12px] uppercase leading-4 text-fg-3">Contents</p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 w-px bg-line" />
                <motion.span className="absolute inset-y-0 left-0 w-px origin-top bg-fg" style={{ scaleY: fill }} />
                <ul className="space-y-2.5 pl-3.5">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        data-measure="text"
                        aria-current={active === t.id}
                        onClick={() => jump(t.id)}
                        className={`text-left text-[13px] leading-5 transition-colors duration-150 ease-out ${
                          active === t.id ? "text-fg" : "text-fg-3 hover:text-fg-2"
                        }`}
                      >
                        {t.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          )}
        </aside>

        <article ref={articleRef} className="min-w-0">
          <header>
            <p className="font-mono text-[12px] uppercase leading-4 text-fg-3">
              {formatDate(note.date)} · {note.category} · {readingMinutes(note)} min
            </p>
            <h1 data-measure="text" className="mt-3 text-[28px] font-medium leading-9 tracking-[-0.02em] text-fg">
              {note.title}
            </h1>
            <p data-measure="text" className="mt-3 text-fg-2">
              {note.dek}
            </p>
          </header>

          <hr className="my-8 border-line" />

          <Prose blocks={note.body} />

          <nav aria-label="More notes" className="mt-20 grid gap-3 sm:grid-cols-2">
            {newer ? <Neighbour note={newer} label="Newer" /> : <span className="hidden sm:block" />}
            {older && <Neighbour note={older} label="Older" />}
          </nav>
          <a
            href={paths.notes}
            data-measure="text"
            className="group mt-5 inline-flex items-center gap-1.5 text-[13px] text-fg-3 transition-colors duration-150 hover:text-fg"
          >
            <Icon name="arrowLeft" size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            All notes
          </a>
        </article>
      </div>

      <BackToTop />
    </>
  );
}

function Neighbour({ note, label }: { note: Note; label: string }) {
  return (
    <a
      href={paths.note(note.slug)}
      data-measure
      className="group rounded-xl border border-line p-4 transition-[background-color,transform] duration-150 ease-out hover:bg-bg-2 active:scale-[0.99]"
    >
      <span className="font-mono text-[12px] uppercase leading-4 text-fg-3">{label}</span>
      <span className="mt-1.5 block text-fg">{note.title}</span>
      <span className="mt-0.5 block text-[13px] text-fg-3">{formatDate(note.date)}</span>
    </a>
  );
}
