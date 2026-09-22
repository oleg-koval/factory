# Factory website design system

## Product context

Factory is the open-source verification layer for AI software factories. It is a provider-neutral
agent skill for Claude Code and Codex that turns a ticket, incident, or written request into an
isolated software change with testable acceptance criteria, milestone reviews, proof receipts,
and an explicit terminal state.

The main claim is: "Your agent can write code. Factory makes it earn the word delivered."

The audience is an engineering leader who already believes coding agents can generate code but
does not yet trust them to own delivery without constant supervision. The site must earn trust by
showing the exact artifacts behind each claim.

The strategic outcome is to establish Oleg Koval's authority in reliable agent-driven software
delivery and make the product compelling enough for a live podcast demonstration. Do not optimize
for hype. Optimize for inspection, recall, and a sharp category distinction.

## Product position

- Category: the verification layer for AI software factories.
- Distinction: software factories orchestrate isolate, build, prove, and ship; Factory decides
  whether the evidence permits a run to claim a terminal state.
- Unfair advantage: rules created from observed delivery failures and converted into executable
  gates.
- Demonstration: a false-delivery fixture says `delivered` while five blocking questions are
  unanswered and two acceptance criteria use the invalid status `partly met`. The gate exits 1
  and names the contradictions. A corrected fixture exits 0.
- Self-audit story: an earlier gate accepted `delivered` against a run whose state said `blocked`.
  The committed before/after case study shows the old gate passing and the fixed gate refusing.

Never claim public adoption, time savings, defect reduction, benchmarks, customer logos,
testimonials, or a live install path until those sources exist.

## Information architecture

The eventual site contains these indexable routes:

1. `/` - claim, runnable proof, seven gates, failure stories, comparison, terminal states, essay,
   author, and install preview.
2. `/proof/` - claim-to-artifact manifest, false/honest/mismatched fixtures, and case study.
3. `/how-it-works/` - seven public delivery gates and four terminal states.
4. `/install/` - Claude Code and Codex installation after the public repository exists.
5. `/changelog/` - the failure behind each rule change.
6. `/oleg-koval/` - evidence-bounded author profile and links to Oleg's public work.
7. `/essays/right-to-say-not-delivered/` - the category argument.

The first Superdesign draft is the desktop homepage. It must establish the system that later
pages can inherit.

## Primary homepage journey

1. Sticky navigation: Factory, How it works, Proof, Essay, Install, Built by Oleg Koval.
2. Hero: eyebrow, main claim, short explanation, "Watch a run" primary action, "Inspect the
   skill" secondary action, and a compact proof strip.
3. Runnable proof: a large terminal-like evidence stage showing the false-delivery input, the
   exact `GATE: BLOCKED` result, the corrected `GATE: PASS`, and an explicit reconstruction note.
4. Seven gates: Intake, Isolate, Diagnose, Plan, Build, Prove, Stop. Make the sequence scannable
   without reducing it to seven generic feature cards.
5. Failure stories: unanswered questions, a test without teeth, self-approved in-place fallback,
   and the terminal-state mismatch caught while preparing public proof.
6. Comparison: ordinary coding agent versus Factory, with completion and handoff as the visual
   focal rows.
7. Terminal states: delivered, delivered-with-gaps, blocked, intentionally-unchanged.
8. Essay: "Your software factory needs the right to say not delivered."
9. Author: Oleg Koval is a lead engineer and fractional CTO with more than ten years of experience
   across fintech, e-commerce, mobility, automation, AI, and open source. Keep this third-person;
   no unapproved first-person workload claim.
10. Install preview and closing line: "Your agent does not need a longer prompt. It needs a
    delivery contract." Mark install commands as not live until publication.

## Primary style source

Adapt Superdesign library prompt `high-contrast-landing-page` as the single visual source.

Use a restrained technical-editorial, typography-first system:

- Off-white canvas `#F2F2F0` and near-black text `#111111`.
- Gray depth scale: `#B6B5B2`, `#C8C7C3`, `#D9D8D4`, `#E7E6E2`.
- White surfaces `#FCFCFA` only where proof needs separation from the canvas.
- Semantic evidence red `#C9342F` for blocked/failing output and evidence green `#197A4A` for
  passing output. These are status colors, not decorative brand gradients.
- One-pixel rules, square or 4px corners, crisp geometry, and deliberate whitespace.
- No glassmorphism, neon glow, purple-blue gradients, fake 3D objects, robot imagery, abstract AI
  brains, stock portraits, or dashboard mockups.

## Typography

- Use one curated family: IBM Plex Sans for display, body, navigation, and interface text. Load
  weights 400, 500, 600, and 700 only. The family should feel engineered and editorial, not like
  a fashion grotesk or an AI-template headline.
- Evidence and commands use IBM Plex Mono or `ui-monospace`. Preserve exact punctuation and line
  wrapping where gate output is shown.
- Hero weight is 600, never 800 or 900. Desktop hero size is 72-88px with line height `0.98` and
  tracking between `-0.035em` and `-0.02em`. It must fit the 1240px content width without clipped
  letters, collisions, or text extending beyond the viewport.
- Use this deliberate three-line rhythm: `Your agent can write code.` / `Factory makes it earn` /
  `the word delivered.` Keep the period and use sentence case.
- Body copy uses 18-21px with generous line height. Use uppercase sparingly for eyebrows, state
  labels, and proof metadata.
- Do not use Clash Display, Satoshi, Arial Black, an echo stack, outlined duplicate text, warped
  letterforms, or extra-black display weights.

The hero contains no `BLOCKED` stamp. `Blocked` is a terminal state, not the product's status or a
brand slogan, and must appear only where the page explains what evidence caused the gate to refuse
delivery.

## Layout

- Desktop design width: 1440px, content max-width 1240px, 32px side gutters.
- Use a 12-column grid. Alternate dense proof bands with generous editorial whitespace.
- Sticky header: 72-80px, off-white at 92% opacity, subtle backdrop blur, bottom hairline.
- Hero: 620-720px high. Keep the complete headline, CTA pair, and first proof cue above the fold on
  a 1440x900 viewport.
- Do not use a repetitive grid of identical cards. The proof stage is wide and dominant; the
  seven-gate sequence reads like a process rail; failure stories use asymmetrical editorial
  blocks; terminal states use a precise four-row ledger.
- On mobile, collapse to one column, preserve the order of claims and evidence, make terminal
  output horizontally scrollable, and keep touch targets at least 44px.

## Components

### Navigation

Compact wordmark `Factory` in bold display type. A small outlined status lozenge reads
`OPEN SOURCE / LOCAL PROOF`. Do not invent a symbol or logo. The rightmost action is a bordered
`Inspect proof` button that inverts on hover.

### Buttons and links

- Primary: near-black fill, off-white text, 2px border, 4px radius, no pill shape.
- Secondary: transparent with a 1px black border.
- Text links: underlined only on hover, always include visible descriptive text.
- Focus states: 3px semantic blue-gray outline with 2px offset; never remove outlines.

### Proof stage

Treat the proof as the product hero, not a decorative code sample.

- Split view: left column summarizes the recorded input; right column shows exact gate output.
- Tabs or segmented control: `REFUSED DELIVERY`, `HONEST DELIVERY`, `GATE BUG`.
- False state headline: `5 unanswered + 2 invalid = not delivered`.
- Use monospace output with line numbers or artifact labels. Preserve `exit=1`, `GATE: BLOCKED`,
  `exit=0`, and `GATE: PASS` exactly.
- Immediately explain the verdict in plain language: `BLOCKED means the evidence is insufficient.
  Factory refuses to call the work delivered and names what is missing.` This explanation belongs
  beside the gate output, never over the hero.
- Include visible links for `state.json`, `ac-matrix.md`, receipts, manifest, and case study.
- Always show: `Redacted reconstruction. Not the original private run or a complete Phase 0-6
  delivery.`

### Seven-gate rail

Use numbered stages connected by a fine rule. Each stage has a verb, one-sentence purpose, and a
small artifact label. The rail may become sticky while the explanation scrolls on desktop, but
must remain usable without animation.

### Failure stories

Use large numbered editorial blocks with the failure first and the executable rule second.
Include one small receipt fragment per story. No generic warning icons.

### Terminal ledger

Use a structured four-row table or ledger. Each state has: state name, when it is permitted, and
what the handoff contains. Red is reserved for `blocked`; green is reserved for `delivered`.
Neutral treatment for `delivered-with-gaps` and `intentionally-unchanged`. The `blocked` row must
say: `Evidence or a required decision is missing. The run stops without claiming delivery.`

### Author block

Use type and evidence, not an invented portrait. Link to `olegkoval.com`, GitHub, LinkedIn, and
writing. If a portrait is added later, it must come from an approved uploaded Brand Asset.

## Motion

- Default duration 180-260ms; use the source prompt's 700ms cubic-bezier reveal only for the hero
  proof entering the viewport.
- Respect `prefers-reduced-motion` and present all content without animation.
- Hover may invert buttons, reveal underlines, or shift an evidence rule by 2px.
- Do not animate terminal output character by character; evidence should be immediately readable.

## Accessibility and search

- Maintain WCAG AA contrast, semantic heading order, labeled controls, keyboard-operable proof
  tabs, visible focus, and descriptive link text.
- Every page has one H1, a unique title and description, canonical URL, crawlable text, and links
  to source evidence.
- The interactive proof must have a server-rendered textual equivalent; no claim may exist only
  inside animation or canvas.
- Structured data must describe only public, verifiable facts. Do not emit ratings, reviews,
  offers, or usage counts.

## Copy constraints

- Prefer short declarative sentences, exact states, and artifact names.
- Lead with the outcome and then show the mechanism.
- Keep evidence limitations next to the claim they limit.
- Do not use "revolutionary," "seamless," "10x," "autonomous," "guaranteed," or "production
  proven."
- Never hide `[TK]` behind polished design. Omit the unsupported claim or show the launch status
  explicitly.

## Required first-draft content

Use the canonical text and evidence boundaries from `docs/site-copy.md`, `docs/product-brief.md`,
`docs/how-it-works.md`, `docs/author-profile.md`, `docs/essay-right-to-say-not-delivered.md`, and
`proof/manifest.json`. The first draft may shorten body copy for layout, but it must not invent
facts, metrics, endorsements, integrations, or public availability.
