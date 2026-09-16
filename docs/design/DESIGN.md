# Glitch — Design

**Status:** current direction · **Applies to:** `apps/frontend`
**Engineering reference:** `docs/design/DESIGN-SYSTEM.md` · **Findings that drove this:** `DESIGN-AUDIT.md`

This document is the contract for the brand and the design direction: what Glitch looks
and sounds like, and why. It does not restate token values — those live in
`apps/frontend/src/styles/global.css` and are documented in the design-system reference.

---

## 1. What Glitch is

A social network for gamers — Letterboxd for video games. People track what they play,
write long-form reviews, and follow players whose taste they trust.

Who writes the opinions matters to the product. Glitch is **player-authored**, not a
review aggregator: ratings and reviews come from the community, and the score that appears
on a game is the average of what players gave it. There is no publisher score, no editorial
verdict handed down from above, no algorithm deciding what you should like. The marketing
copy on the home page states it plainly: "Find your next favourite game. Then argue about
it."

Product tone follows from that: opinionated but not shouty, direct, a little wry, aimed at
people who already know the medium. It is a place to argue with other players, not a store.

---

## 2. Design direction

Glitch is a **dark-first product surface**. The default experience is dark because that is
how the audience plays and browses, and because it lets the brand colour carry the page.
Light is a full alternative theme, not a fallback.

The surface is a **green-cast near-black** (`#0e1009`, with surfaces stepping up through
`#161a11` and `#1d2317`) — deliberately not literal black, and deliberately not the cool
blue-charcoal that every dark SaaS product ships. Slight green in the base makes the
surfaces feel related to the primary hue instead of neutral grey behind an accent.

Glitch is a **single-hue brand**: one green against a neutral ramp. There is no second brand
colour.

- **Radioactive acid green** (`#a6f53a` in dark) is the whole identity. It is the primary
  action colour (filled buttons, active navigation, selected controls, ratings) *and* the
  accent (links, hover states of outlined controls, the focus ring).

Hierarchy comes from weight, contrast and space rather than from a second hue. Red, amber
and green survive only as semantic state colours — error, warning, success — which is a
different job from brand, and they are never used decoratively.

### 2.1 Rebrand rationale

The previous palette was `#7f5af0` purple with a `#2cb67d` green accent and Inter as the
body font. That combination was the generic AI-startup default: a saturated purple
primary, a mint-green success colour, Inter, cool blue-grey backgrounds. It had been
flagged as exactly that, and it was indistinct — it described nothing about games, and it
would have looked identical on a fintech dashboard.

The new direction makes two decisions on purpose:

**Green is the primary, not purple.** Purple-and-charcoal is the expected move for a
developer tool, so it is the one that reads as a template. Radioactive green as the action
colour is the thing that makes Glitch not look like everything else, and it suits the
subject: screens, arcades, CRT phosphor, a score lighting up. It is a signature, not a
"success" colour that escaped its box.

**One hue, not two.** This went through two revisions before landing, and the history is
worth keeping. Violet was tried first, on the reasoning that it is the true complement of
acid green — but a complement fights, and a second brand colour means the palette is
always balancing two arguments. Cyan was tried second, as a split-complement: calmer, but
it was effectively decorative, appearing only on a handful of links. Both were cut. A
single green is stronger and simpler, and it makes the brand unmistakable — when everything
interactive is the same acid green, the green *is* the product's signature. Extra hues now
have to earn their place as semantics (error, warning, success), never as decoration.

**Type moved off the recycled rotation.** Inter was replaced as the body face by
**Instrument Sans**, and display type is set in **Bricolage Grotesque**. Bricolage is what
gives headings a voice: it is a grotesque with enough personality to carry a page title and
enough discipline to stay readable at hero size. Instrument Sans is the workhorse for
copy. **DM Mono** is the third face, and it is reserved for real data — ratings, counts,
years, eyebrow labels — so numerals read as data instead of prose. Inter was the safe
default; none of these three are.

### 2.2 The mark

The brand mark is `apps/frontend/public/images/glitch-mark.svg`: a heavy geometric
capital G in `--brand-primary`, on transparent, 3.8K. Its faults are deliberate and
thin — a dropped scanline at y 18-21 and a slipped slice at y 30-34, displaced 6 units
in a 64-unit box. About 96% of the letter stays in register, because the silhouette is
the logo and a sheared silhouette reads as a broken render rather than a mark. The
slipped slice is placed across the crossbar on purpose: shearing the G's defining
feature is legible damage, shearing the bowl's curve is not.

It is a single flat colour, so it inherits the theme by design intent rather than by
mechanism — the SVG carries `#a6f53a` literally, which is the dark-theme primary. If the
mark is ever needed on a light surface at scale, it needs a second file or a
`currentColor` variant; today the navbar, footer and auth header all sit on
`--surface-base`, so the dark value is correct everywhere it is used.

The glyph is authored once inside `<defs>` and referenced by every band with `<use>`.
This matters if it is ever retuned: change the glyph, not the four bands.

For sizes at or below about 24px the faults stop resolving and the mark softens into a
blob. That is a known ceiling of the design, accepted deliberately after rendering it at
256/128/64/48/32/24/16px. Thickening the faults until they survive the shrink would stop
them reading as faults, so the choice is to accept softness at favicon size rather than
to ship a second, different mark.

The favicons and PWA icons in `apps/frontend/public/favicon/` are rendered from this SVG
(16, 32, 48, 180, 192, 512, plus a multi-size `favicon.ico`). They are build artefacts:
re-render them rather than editing them by hand. The 16/32/ico are transparent; the
180/192/512 are opaque on `--surface-base` because iOS does not composite transparency
in a home-screen icon and PWA maskable icons want a full bleed.

---

## 3. Design principles

1. **Content is visible by default.** An entrance animation is an accent, never a gate.
   Nothing real is hidden behind motion that has to finish before it can be read.
2. **Depth comes from border and tone, not from shadow.** A shadow means the element
   genuinely floats. Ordinary surfaces get a single hairline border and a surface tone.
3. **Hover changes colour; it does not move things.** No scale, no lift, no translate on
   hover. The element stays where it is and reads as the same object in a new state, so
   hover and keyboard focus give the same feedback.
4. **One focus treatment, everywhere.** The global `:focus-visible` outline is the whole
   language. Components never add their own rings.
5. **Parallel items align on a shared grid.** One page rail governs every gutter and the
   navbar and footer align to it by construction. If two things sit side by side, their
   edges agree.
6. **One concept, one shape.** A pill is always a pill; a card is always the same radius.
   Consistency is what lets a reader stop decoding the interface and read the content.
7. **Dark is the default; light is a full citizen.** Light is not an afterthought bolted
   onto a dark theme — both themes set the same tokens and both are designed. Neither is
   derived from the other. And neither is derived from the operating system: an absent
   preference resolves to dark, not to the OS setting.

---

## 4. Voice and language

- **Sentence case** for UI text. Buttons, headings, labels, empty states.
- **Direct plain verbs.** "Save review", "Clear filters", "Try again" — say what happens.
- **No exclamation marks.** The product is confident, not excited.
- **Ratings are out of ten.** Always express and label them as such ("8.4 out of 10"),
  never as stars, percentages or a five-point scale.
- **Numerals are mono.** Real data — ratings, counts, years, step indices — renders in
  DM Mono so it reads as data. Prose numbers stay in the body face.

---

## 5. Where the rules live

| What | Where |
|---|---|
| Tokens, base element rules, custom utilities | `apps/frontend/src/styles/global.css` |
| Shared primitives | `apps/frontend/src/components/ui/` (Button, Card, Input, Dialog, StarRating, ThemeToggle, Navbar, Footer) |
| Engineering reference — token tables, component contracts, recipes | `docs/design/DESIGN-SYSTEM.md` |
| Historical findings that drove the rewrite | `DESIGN-AUDIT.md` |

`global.css` is authoritative. If a component and this document disagree, the component is
wrong and `global.css` is right.

Note: `docs/architecture/system-design.md` predates the rewrite and still contains the
previous palette (`#7f5af0` / `#2cb67d` / Inter). It is superseded by the files above and
should not be used as a visual reference.
