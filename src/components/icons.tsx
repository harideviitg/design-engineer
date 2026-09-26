import type { SVGProps } from "react";

const glyphs = {
  sun: (
    <>
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.58 3.58l1.06 1.06M11.36 11.36l1.06 1.06M3.58 12.42l1.06-1.06M11.36 4.64l1.06-1.06" />
    </>
  ),
  moon: <path d="M13.25 9.6A5.5 5.5 0 1 1 6.4 2.75a4.4 4.4 0 0 0 6.85 6.85Z" />,
  copy: (
    <>
      <rect x="5.75" y="5.75" width="7.5" height="7.5" rx="1.75" />
      <path d="M10.25 5.75V4.5a1.75 1.75 0 0 0-1.75-1.75h-4A1.75 1.75 0 0 0 2.75 4.5v4c0 .97.78 1.75 1.75 1.75h1.25" />
    </>
  ),
  check: <path d="M3.5 8.25 6.5 11.25 12.5 4.75" />,
  arrow: <path d="M5.25 10.75 10.75 5.25M6 5.25h4.75V10" />,
  arrowLeft: <path d="M13 8H3.5M7.5 3.75 3.25 8l4.25 4.25" />,
  arrowUp: <path d="M8 13V3.5M3.75 7.5 8 3.25l4.25 4.25" />,
  ruler: <path d="M3 2.5v11h10.5M3 5.5h2M3 8h1.25M3 10.5h2M5.5 13.5v-2M8 13.5v-1.25M10.5 13.5v-2" />,
};

export type IconName = keyof typeof glyphs;

/** LinkedIn's "in" mark (filled, brand shape). */
export function LinkedInIcon({ size = 14, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function Icon({ name, size = 14, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {glyphs[name]}
    </svg>
  );
}
