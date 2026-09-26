import type { Block } from "../notes";
import { slugify } from "../notes";

/** Inline `code` and [links](url). */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={i} className="rounded-[5px] bg-bg-2 px-1.5 py-[1px] font-mono text-[13px] text-fg">
              {part.slice(1, -1)}
            </code>
          );
        }
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? (
          <a key={i} href={m[2]} className="link text-fg">
            {m[1]}
          </a>
        ) : (
          part
        );
      })}
    </>
  );
}

/** The body of a note. Headings get ids so the contents list can jump to them. */
export function Prose({ blocks }: { blocks: Block[] }) {
  return (
    <div className="[&>*+*]:mt-5 [&>h2+*]:mt-3">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={slugify(b.text)}
                data-measure="text"
                className="!mt-12 w-fit scroll-mt-24 font-medium text-fg first:!mt-0"
              >
                {b.text}
              </h2>
            );
          case "p":
            return (
              <p key={i} data-measure="text" className="leading-7 text-fg-2">
                <Inline text={b.text} />
              </p>
            );
          case "ul":
            return (
              <ul key={i} data-measure className="list-disc space-y-2 pl-5 leading-7 text-fg-2 marker:text-fg-3">
                {b.items.map((it) => (
                  <li key={it}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote key={i} data-measure="text" className="border-l border-line-2 pl-4 leading-7 text-fg">
                {b.text}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={i}
                data-measure
                className="overflow-x-auto rounded-xl border border-line bg-bg-2 px-4 py-3 font-mono text-[13px] leading-6 text-fg-2"
              >
                <code>{b.code}</code>
              </pre>
            );
        }
      })}
    </div>
  );
}
