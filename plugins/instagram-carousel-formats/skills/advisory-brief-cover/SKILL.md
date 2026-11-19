---
name: advisory-brief-cover
description: Make "The Advisory Brief" cover, Pextrade Advisory's editorial newsletter cover for slide 1 of an Instagram carousel (cream broadsheet front page, oxblood masthead, brass brush highlight, artwork box, three-fact strip). Use when a post's format is advisory_brief, when asked for the newsletter or editorial cover, or to apply this layout to another brand.
---

# The Advisory Brief cover

Taimur's master prompt for every newsletter cover. Follow it as written. Do not restyle it, drop a part, or shorten a line on your own judgment. If a part cannot be done, say so before anything is published.

Reference image: `references/advisory-brief.png`. Full spec and the master prompt word for word: `references/cover-system.md`, part A (sections 1 to 7).

## The fixed frame

| Part | What it is |
|---|---|
| Canvas | 1080 × 1350 (4:5), flat, front-facing, full-bleed. No 3D mock-ups |
| Colours | Paper `#FAF7F2`, oxblood `#3A0C0E`, antique brass `#B8926A`, charcoal ink `#1E1918`. Hex codes are never drawn as text |
| Top bar | `PEXTRADE ADVISORY · <CATEGORY>` on the left, the date on the right, a rule under it |
| Masthead | `The Advisory Brief`, large bold serif (Playfair Display), oxblood |
| Band | Double rules above and below `PEXTRADE ADVISORY · PLAIN-LANGUAGE LEGAL NEWS FOR ONTARIO` |
| Motto | `DEDICATED TO YOUR SUCCESS. · COMMITTED TO JUSTICE.` in brass capitals |
| Seal | Brass ring with a classical pillar, on the corner of the artwork box |
| Footer | Rule, then `GENERAL LEGAL INFORMATION. NOT LEGAL ADVICE.` on the left and `SWIPE` with a hand-drawn outline arrow on the right |

## What changes per post (slide 1 of the package)

| Field | What it is | Budget |
|---|---|---|
| `layout` | `"advisory_brief"` | |
| `topic_tag` | Topic and region in capitals, joined by a middle dot: `REAL ESTATE · ONTARIO` | 2 parts, 4 words |
| `headline` | The headline. A statement, never a question | 13 words, 4 to 6 lines |
| `highlight` | The 1 to 3 words of the headline that get the brass brush stroke, copied letter for letter | 3 words |
| `subline` | The deck: one or two short sentences in italic oxblood | 12 words |
| `strip` | Exactly three facts, each `label` (brass capitals), `figure` (big oxblood word or number), `detail` (one line) | 3, 2 and 8 words |
| `art` | The artwork for the box: `file`, `alt`, `source` (`generated`, `owner` or `public_domain`), `credit` | One image |

Example package: `examples/advisory-brief.json`.

## The artwork

The image model draws the artwork box only: an oxblood rectangle with a thin brass inner border and, inside, a monochrome cream-and-charcoal halftone collage fitted to the topic, with small brass highlights. No words in the image. The prompt is in `references/cover-system.md` ("Artwork-only prompt"). Only generated images, the owner's own images or public-domain images are used; never someone else's photograph or watermarked stock. With no artwork the box is drawn with the seal, and `render.json` says `"artwork": "no artwork"`.

## How to render it

The renderer is in this pack: `scripts/render.js` (Node, needs Playwright with Chromium). It takes a 7-slide post package and a brand theme and writes 7 PNGs at 1080 × 1350, one PDF and `render.json`.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/render.js" <package.json> --theme "${CLAUDE_PLUGIN_ROOT}/themes/pextrade-advisory.theme.json" --out <folder>
```

- Exit code 0 means every rule passed. Exit code 1 means a rule is broken (a word budget, text that does not fit, a colour outside the palette, missing fonts): read the message, fix the text and run it again. Never publish from a run that failed.
- The pipeline sets every word. An image model is asked for the artwork only, so no word on the slide can be misspelt and every word can be checked.
- For another business, copy `themes/pextrade-advisory.theme.json`, change the colours, fonts and fixed words, and pass the copy with `--theme`. The renderer holds no brand values of its own.

## Law firms

Anything made for a law firm goes through that firm's compliance check before it is published (Law Society of Ontario marketing rules: no promise of results, no "expert" or "specialist", no superlatives, no invented facts). The cover's words are part of the post and are checked with it.
