---
name: plain-cover
description: Make the plain cover, Pextrade Advisory's original cover for slide 1 of an Instagram carousel (deep burgundy background, large serif headline, gold accents, brand mark and slide counter, no artwork). Use when a post's format is standard, or when asked for the original or plain posting format.
---

# The plain cover

The original Pextrade Advisory posting format, kept as the third format in the rotation. It is also the look of slides 2 to 7 of every post, whichever cover slide 1 has.

Reference image: `references/plain-cover.png`.

## What it is

| Part | What it is |
|---|---|
| Canvas | 1080 × 1350 (4:5) |
| Background | Deep burgundy `#3b060a` |
| Headline | Large bold serif (Playfair Display), cream `#FAF9F6` |
| Subline | One line under the headline, light gold |
| Furniture | Brand mark top-left and slide counter top-right in gold `#C4956D`; a swipe prompt at the bottom |
| Artwork | None |

## Slide 1 of the package

| Field | What it is |
|---|---|
| `layout` | `"standard"` |
| `headline` | The headline. A statement, never a question. The theme sets its word limit |
| `subline` | One supporting line |

No lead-in, topic tag, highlight, strip or artwork. Example package: `examples/plain-cover.json`. Colours, fonts, sizes and limits are in `themes/pextrade-advisory.theme.json`.

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
