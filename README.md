# design-engineer

my portfolio. one narrow column, no clutter, and a few small interactions that i spent way too long on.

it's still full of placeholder copy for now (fake projects, fake writing, fake jobs). the layout, the interactions and the avatar are the real part. i'll swap in real content later.

## what's in it

- rulers on the top and left edge, like in a design tool. they follow your cursor and show exactly where an element starts and ends when you hover it. i got the idea from imdaryl.com and then obsessed over it
- hold Alt (or press M) to go into measure mode. you get sizes, font specs, red distance lines to the nearby elements and the layout grid underneath. yes it's overkill, that's the point
- my avatar is my own pixel art. hover it and a small spot around the cursor turns into 0s and 1s depending on the colour of each pixel (dark is 1, light is 0). move away and it goes back exactly to the original
- light and dark mode. it follows your device by default, and the toggle blends the colours instead of snapping
- the Work list has a hover highlight that glides between rows, and a preview card on wide screens
- a Lab section with a few small components (hold to confirm, copy button, stretch toggle, tick slider) that i'll keep adding to
- click to copy email, a live clock with the time difference from you on hover

## stack

- Vite 6
- React 19 with TypeScript
- Tailwind CSS v4
- Motion (motion/react) for the animations
- canvas for the rulers and the avatar hover, no library
- Geist for text, Geist Mono for the small uppercase labels, both from Google Fonts

the theme blend uses typed CSS custom properties (@property), from this write up by Jon Shamir: https://jonshamir.com/writing/color-mode/

the avatar is exported straight from Figma as an SVG. i removed the background and made the ink follow the theme, but the art itself is untouched.

## run it

```bash
npm install
npm run dev
```

it opens on http://localhost:5173. to make a production build:

```bash
npm run build
```

that gives you a static site in `dist/`.

vite is pinned to 6 because the node on my machine is old (21) and newer vite needs 20.19+ or 22.12+. if you're on a newer node you can upgrade it.

## where things are

```
src/content.ts        all the text (name, intro, work, writing, experience, links)
src/assets/avatar.svg the avatar
src/components/       rulers, inspector, avatar, lists, lab, etc
src/lib/binary.ts     the 0/1 hover effect
src/lib/measure.ts    what the rulers and measure mode listen to
src/lib/theme.ts      theme handling
```

to change the avatar size, edit `avatar.width` in `src/content.ts`. it only ever scales evenly, it never stretches.

## made with

i designed it and told Claude Code (Anthropic) what i wanted, then went back and forth on the details until it felt right. most of the code was written that way.
