// Everything you'd want to edit lives here. All of it is placeholder copy.

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

  // The hero paragraph. The links in the second line are placeholders until you send real URLs.
  intro: "Designing and developing intricate interfaces from a room in IIT Guwahati. I will help your product feel smooth and neat.",
  building: { label: "shelf", href: "#" },
  linkedin: "https://www.linkedin.com/",

  work: [
    { title: "Northwind", description: "Design system & component library", year: "2026", href: "#", tone: "#0d99ff" },
    { title: "Parcel", description: "Motion language for a logistics app", year: "2025", href: "#", tone: "#f24822" },
    { title: "Orbit", description: "Onboarding redesign, +18% activation", year: "2025", href: "#", tone: "#14ae5c" },
    { title: "Lintel", description: "Design QA plugin for Figma", year: "2024", href: "#", tone: "#9747ff" },
  ],

  experience: [
    { period: "2025 — Now", company: "Acme", role: "Design Engineer" },
    { period: "2023 — 25", company: "Studio", role: "Product Designer" },
    { period: "2022", company: "Agency", role: "UI Design Intern" },
  ],

  links: [
    { label: "X", href: "https://x.com/" },
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "Résumé", href: "#" },
  ],
};
