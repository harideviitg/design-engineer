import { BackToTop, TopBar } from "../components/PageChrome";
import { Prose } from "../components/Prose";
import { paths } from "../lib/router";
import { formatDate, getNote, readingMinutes, type Note } from "../notes";

export function NotePage({ slug }: { slug: string }) {
  const note = getNote(slug);
  if (!note) return <Missing />;
  return <Article note={note} />;
}

function Missing() {
  return (
    <>
      <TopBar backTo={paths.home} backLabel="Home" />
      <p className="text-fg-2">
        That note doesn't exist. <a href={paths.home} className="link text-fg">Go home</a>.
      </p>
    </>
  );
}

function Article({ note }: { note: Note }) {
  return (
    <>
      <TopBar backTo={paths.home} backLabel="Home" />

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
      </article>

      <BackToTop />
    </>
  );
}
