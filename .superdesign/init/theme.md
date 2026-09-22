# Theme context

## Compact token summary

- Canvas `#F2F2F0`; surface `#FCFCFA`; ink `#111111`; muted `#62625F`.
- Rules `#CECECA` and `#DFDFDB`; proof surface `#151515`; proof-muted `#A6A69F`.
- Semantic failure red `#C9342F`; pass green `#197A4A`; focus blue `#1B5FCC`.
- Fonts: IBM Plex Sans 400/500/600 for display and text; IBM Plex Mono 400/500/600 for commands and metadata.
- Page padding: `clamp(1.25rem, 4vw, 4.5rem)`; square geometry; one-pixel rules; no shadows or gradients.
- Hero: `clamp(3.35rem, 7vw, 7.4rem)`, weight 500, line-height .91, tracking -.064em.
- Breakpoints: 980px and 680px. Mobile collapses to one column and retains horizontally scrollable proof output.
- Motion: 160ms color transitions and smooth scroll, disabled with `prefers-reduced-motion`.

## Raw source

The complete authoritative stylesheet is `site/app/globals.css` (1761 lines). It contains every selector, component state, responsive rule, and reduced-motion rule. Because it exceeds Superdesign's 900-line payload threshold, generation must pass the token block and only the homepage selector ranges actually used, never the whole file.

The root token source is:

```css
@import "tailwindcss";
:root {
  --canvas: #f2f2f0;
  --surface: #fcfcfa;
  --ink: #111111;
  --muted: #62625f;
  --rule: #cececa;
  --soft-rule: #dfdfdb;
  --red: #c9342f;
  --green: #197a4a;
  --focus: #1b5fcc;
  --proof: #151515;
  --proof-muted: #a6a69f;
  --page-pad: clamp(1.25rem, 4vw, 4.5rem);
}
@theme inline {
  --color-background: var(--canvas);
  --color-foreground: var(--ink);
  --font-sans: var(--font-plex-sans);
  --font-mono: var(--font-plex-mono);
}
```
