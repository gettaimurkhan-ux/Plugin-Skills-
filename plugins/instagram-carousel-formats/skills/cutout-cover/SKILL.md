---
name: cutout-cover
description: Make "The Cutout Cover", Pextrade Advisory's lock-and-swap cover for slide 1 of an Instagram carousel (rounded oxblood card over the top 58% with a cutout standing on its bottom edge, then an italic lead-in, a heavy sans headline and a short summary). Use when a post's format is cutout_card, when asked for the cutout or card cover, or to apply this layout to another brand.
---

# The Cutout Cover

Taimur's lock-and-swap template. About 85% of the slide is a frame that never changes; only the artwork and three pieces of text are swapped per post. Follow it as written.

Reference image: `references/cutout-cover.png`. Full spec and the template word for word: `references/cover-system.md`, part B.

## The locked frame

| Part | What it is |
|---|---|
| Canvas | 1080 × 1350 (4:5), flat |
| Split | Top 58%: an oxblood card (`#3A0C0E`), inset, 20 px rounded corners. Bottom 42%: warm cream paper (`#FAF7F2`) with a faint grid |
| Monogram | Cream classical pillar monogram, top-left inside the card |
| Artwork position | One cutout, centred, standing flush on the card's bottom edge, in front of two tilted documents |
| Action row | `Swipe to learn more` in bold antique brass (`#B8926A`) bottom-left; an oxblood circle with a cream arrow bottom-right |
| Disclaimer | `GENERAL LEGAL INFORMATION. NOT LEGAL ADVICE.` in small muted grey capitals, bottom-left |

## The slots (slide 1 of the package)

| Field | What it is | Budget |
|---|---|---|
| `layout` | `"cutout_card"` | |
| `lead_in` | Short italic serif line above the headline: `Estate Planning in Ontario` | 2 to 4 words, one line |
| `headline` | Heavy sans headline | 4 to 7 words, at most 2 lines |
| `subline` | The summary, plain language | 25 to 32 words, at most 4 lines |
| `art` | One image for the card: the cutout and the two documents on oxblood | Same fields as the other cover |

No topic tag, highlight or strip on this cover. Example package: `examples/cutout-cover.json`.

## Which cutout for which post

| Kind of post | Foreground cutout | Two tilted sheets behind it |
|---|---|---|
| Wills and estates | Stack of bound estate law volumes topped with a wax-sealed scroll and a brass key | Handwritten Last Will and Testament pages with witness signature lines |
| Family law | Classical residential home facade, or balanced antique scales | Signed domestic contract pages and Ontario family court form excerpts |
| Legal news and regulation | Neoclassical courthouse dome and columns, or a Lady Justice statue | Legislative bill pages, Ontario Gazette notices, vintage broadsheet clippings |
| AI and legal tech | Suit-clad legal professionals ascending courthouse steps | Cream prompt-interface cards and brass circuit schematics |
| Brand pitch or cover letter | The brand's headquarters, flagship product or industry landmark | Annotated strategy memo, KPI audit sheet, signed proposal pages |

The artwork prompt with its two slots is in `references/cover-system.md`, section B6. With no artwork the card is drawn with a stand-in (a line-drawn classical facade and two blank sheets), the same every time, and `render.json` says `"artwork": "no artwork"`.

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
