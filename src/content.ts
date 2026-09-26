// Everything you'd want to edit lives here. Most of it is still placeholder copy.

// One source for the hero link and the Contact row.
const linkedin = "https://www.linkedin.com/in/haaridev";

export const site = {
  name: "Haridev",
  role: "Design Engineer",
  location: { label: "India", timeZone: "Asia/Kolkata", tz: "IST" },
  email: "r.haridev@iitg.ac.in",
  updated: "Sep 2026",

  // The art itself is src/assets/avatar.svg (exported from Figma, background removed).
  // Sizes are the only thing to tune: the art scales uniformly, never stretches.
  // The art is 15 pixels wide, so multiples of 15 keep every pixel a whole number (75 = 5px each).
  avatar: { width: 96, mobileWidth: 75, alt: "Pixel-art portrait of Haridev" },

  // The hero paragraph. The "shelf" link is a placeholder until you send its URL.
  intro: "Designing and developing intricate interfaces from a room in IIT Guwahati. I will help you build clean scalable products from scratch.",
  building: { label: "shelf", href: "#" },
  linkedin,

  work: [
    { title: "Shelf", description: "Shipped product and iOS native design system", year: "2026", href: "#", tone: "#0d99ff" },
    { title: "Nomnom", description: "User research and systems thinking", year: "2026", href: "#", tone: "#f24822" },
    { title: "Mindmap", description: "How my brain stores information", year: "2026", href: "#", tone: "#14ae5c" },
    { title: "Abacor", description: "Product illustrations for AI SaaS", year: "2026", href: "#", tone: "#9747ff" },
  ],

  experience: [
    { period: "2025 — Now", company: "Acme", role: "Design Engineer" },
    { period: "2023 — 25", company: "Studio", role: "Product Designer" },
    { period: "2022", company: "Agency", role: "UI Design Intern" },
  ],

  links: [
    { label: "X", href: "https://x.com/" },
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: linkedin },
    { label: "Résumé", href: "#" },
  ],
};
