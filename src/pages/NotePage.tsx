import { Icon } from "../components/icons";
import { BackToTop, TopBar } from "../components/PageChrome";
import { Prose } from "../components/Prose";
import { paths } from "../lib/router";
import { formatDate, getNote, neighbours, readingMinutes, type Note } from "../notes";

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
  const { newer, older } = neighbours(note.slug);

  return (
    <>
      <TopBar backTo={paths.notes} backLabel="Notes" />

      <div className="md:grid md:grid-cols-[128px_minmax(0,1fr)] md:gap-x-8">
        <div className="hidden md:block" />

        <article className="min-w-0">
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
