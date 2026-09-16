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

### 2.2 Brand assets are placeholders

The current logotype and isotype (`apps/frontend/public/images/glitch-logotype.png`,
`glitch-isotype.png`) are **placeholders pending a real brand mark**. Nothing in the
design system should be derived from them — not their proportions, not their colour
treatment, not the way the isotype sits next to the wordmark. The wordmark is currently
set live in Bricolage Grotesque next to the isotype; when a real mark arrives it replaces
those assets and nothing else should have to change.

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
