// Placeholder notes. Swap these for the real ones. A note is just data:
// title, a one-line dek, a category, and a list of blocks.

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; code: string };

export type Note = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  date: string; // YYYY-MM-DD
  body: Block[];
};

export const notes: Note[] = [
  {
    slug: "the-1px-nobody-asked-about",
    title: "The 1px nobody asked about",
    dek: "Why I keep nudging things by a pixel that no one else will ever notice.",
    category: "Craft",
    date: "2026-09-21",
    body: [
      { type: "p", text: "There's a moment in almost every build where the thing works, it matches the design, and something still feels off. I used to ignore that. Now I go looking for it." },
      { type: "h2", text: "Where it usually hides" },
      { type: "p", text: "Usually it's a border that doubles up where two components meet. Sometimes it's an icon that is centered on paper but looks low. Now and then it's text sitting half a pixel off the baseline of its neighbour." },
      { type: "p", text: "None of these show up in a screenshot diff. You only see them when you actually use the thing." },
      { type: "h2", text: "How I check now" },
      {
        type: "ul",
        items: [
          "Zoom to 400% and look at every place two elements touch.",
          "Turn the layout grid on and check that things land on it.",
          "Read the computed sizes, not the ones in the design file.",
        ],
      },
      { type: "p", text: "That last one is why this site has a measure mode. I got tired of opening devtools." },
      { type: "h2", text: "Knowing when to stop" },
      { type: "quote", text: "The goal isn't perfect pixels. The goal is that nobody has to think about the page." },
      { type: "p", text: "There's a point where more nudging stops helping. I try to stop when I catch myself moving something back to where it was." },
    ],
  },
  {
    slug: "easing-is-a-design-decision",
    title: "Easing is a design decision",
    dek: "The default curve is somebody else's opinion about how your interface should feel.",
    category: "Motion",
    date: "2026-07-15",
    body: [
      { type: "p", text: "Most interfaces use whatever easing the framework hands them. That's a decision too, you just didn't make it." },
      { type: "h2", text: "Defaults are opinions" },
      { type: "p", text: "The built-in ease-in-out starts slow. For something that responds to a click, that slow start reads as lag, even when the whole thing takes 200ms." },
      { type: "h2", text: "The curve I reach for" },
      { type: "p", text: "A strong ease-out. It starts fast, so the interface feels like it reacted instantly, then settles gently at the end." },
      { type: "code", code: "transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);" },
      { type: "h2", text: "Duration matters more" },
      { type: "p", text: "A great curve at 600ms still feels slow. For UI that responds to input I stay under 300ms, and for things people trigger all day I go shorter than that." },
      { type: "p", text: "If a `transition` is the first thing you notice on a page, it's probably too long." },
    ],
  },
  {
    slug: "notes-on-optical-alignment",
    title: "Notes on optical alignment",
    dek: "Math says centered. Your eyes disagree.",
    category: "Craft",
    date: "2026-05-21",
    body: [
      { type: "p", text: "A play triangle placed at the exact center of its circle looks like it's falling off to the left. Shapes carry visual weight, and it isn't evenly spread." },
      { type: "h2", text: "Shapes lie" },
      { type: "p", text: "Triangles need a nudge toward their point. Round shapes need to overshoot the line slightly, otherwise they look smaller than the square next to them." },
      { type: "ul", items: ["Play icons sit a little right of center.", "Circles overshoot the baseline by a hair.", "Text in a button looks low if you only measure the box."] },
      { type: "h2", text: "A quick test" },
      { type: "p", text: "Squint, or blur the screenshot. Whatever looks uneven when the details disappear is uneven. Fix that first, then go back to the details." },
    ],
  },
  {
    slug: "designing-with-springs",
    title: "Designing with springs",
    dek: "Springs don't have a duration. That's the whole point.",
    category: "Motion",
    date: "2026-02-12",
    body: [
      { type: "p", text: "A tween knows where it starts and how long it takes. A spring only knows where it wants to end up, which is why it handles interruption so much better." },
      { type: "h2", text: "Why springs" },
      { type: "p", text: "If a user changes their mind halfway through, a spring keeps its velocity and turns around smoothly. A tween has to restart or jump." },
      { type: "h2", text: "Numbers I start with" },
      { type: "code", code: 'transition={{ type: "spring", stiffness: 520, damping: 42 }}' },
      { type: "p", text: "Stiffness controls how eager it is. Damping controls how much it wobbles before settling. For most UI I want almost no wobble." },
      { type: "h2", text: "When not to" },
      { type: "p", text: "Opacity and color changes don't need a spring. Save it for things that move." },
    ],
  },
  {
    slug: "tokens-are-a-user-interface",
    title: "Tokens are a user interface",
    dek: "Naming things is design work too.",
    category: "Systems",
    date: "2025-11-03",
    body: [
      { type: "p", text: "A design token is what a designer or engineer reaches for at the exact moment they're trying to get something done. That makes its name part of the interface." },
      { type: "h2", text: "Names are the interface" },
      { type: "p", text: "If someone has to open the docs to find the right color, the naming failed. `text-muted` beats `gray-500` because it tells you what it's for." },
      { type: "h2", text: "What I'd do differently" },
      { type: "p", text: "I'd start with fewer tokens and let real usage ask for new ones, instead of building the full palette up front and hoping people find their way around it." },
    ],
  },
];

// ——— helpers ———

export const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));
export const categories = ["All", ...Array.from(new Set(sortedNotes.map((n) => n.category)))];

export const getNote = (slug: string) => sortedNotes.find((n) => n.slug === slug);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function readingMinutes(note: Note) {
  const text = note.body
    .map((b) => (b.type === "ul" ? b.items.join(" ") : b.type === "code" ? "" : b.text))
    .join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

export function formatDate(iso: string, style: "short" | "long" = "long") {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    ...(style === "long" ? { day: "numeric" } : {}),
    year: "numeric",
  });
}
