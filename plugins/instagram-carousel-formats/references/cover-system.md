---
id: LFSC-028
title: Cover system, The Advisory Brief and The Cutout Cover (the two covers that alternate from post to post)
tier: 2
status: active
created: 2026-11-19
last_verified: 2026-11-19
review_days: 30
---

*Written on 19 Nov 2026 from Taimur's master template of the same day (decision L11). It applies to the cover (slide 1) of every news post. The renderer draws it from the post package (section 5, "In the pipeline"). The hand-made build it was ported from is kept as reference: [`renderer/covers/advisory-brief.reference.html`](../../renderer/covers/advisory-brief.reference.html).*

# Cover system: The Advisory Brief

> Three cover formats take turns from post to post (decisions L13 and L17, 19 Nov 2026): The Advisory Brief, The Cutout Cover and the original plain cover. Part A, sections 1 to 7 below, is The Advisory Brief. [Part B](#part-b-the-cutout-cover-decision-l13), at the end, is The Cutout Cover and the rule for which post gets which.

## 1. What it is

A flat, front-facing broadsheet front page, 1080 × 1350 (4:5). Cream newsprint, oxblood masthead, brass accents, charcoal ink, exactly as Taimur's master prompt says (decision L16, 19 Nov 2026). A white, newspaper-serif restyle (decision L12, the same day) was withdrawn: Taimur instructed that the master prompt be followed as written. One framed artwork panel on the right. Every post gets its own headline, highlight, artwork and three facts, so no two covers are the same.

## 2. Colours

| Role | Hex |
|---|---|
| Paper (background) | `#FAF7F2` |
| Oxblood (masthead, artwork box, big figures, deck) | `#3A0C0E` |
| Antique brass (tags, motto, inner border, highlight, seal) | `#B8926A` |
| Charcoal ink (headline, rules, body) | `#1E1918` |

These are close to, but not the same as, the colours in [`brand-scheme.md`](brand-scheme.md) (`#FAF9F6`, `#3b060a`, `#C4956D`, `#231A1A`). Slides 2 to 7 keep the colours of `brand-scheme.md` (settled 19 Nov 2026, section 6).

## 3. Parts, top to bottom

| Part | Look | Changes per post? |
|---|---|---|
| Top bar | Thin rule. Left: firm and category in tracked capitals. Right: the date | Category and date change |
| Masthead | `The Advisory Brief`, large high-contrast Roman serif (Playfair Display), oxblood | Fixed |
| Sub-masthead band | Double rules above and below one line of tracked capitals | Fixed for a client: `PEXTRADE ADVISORY · PLAIN-LANGUAGE LEGAL NEWS FOR ONTARIO` |
| Motto | One line of small tracked capitals in brass | Fixed for a client. Not drawn until its wording is confirmed (see section 6) |
| Topic tag | Small capitals in brass, topic and region, for example `REAL ESTATE · ONTARIO` | Changes |
| Headline | Ultra-bold serif (Playfair Display), charcoal, 4 to 6 lines | Changes |
| Brush highlight | Rough dry-brush stroke in brass behind the 1 to 3 most important words of the headline | Changes |
| Deck | One or two short sentences in italic oxblood serif | Changes |
| Artwork box | Oxblood rectangle with a thin brass inner border. Inside: one sober engraved subject fitted to the topic (a building, a document, a statue), cream and charcoal with small brass highlights. No words. Since L12: no phones or app icons, no tick marks or shields, no white sticker outlines, no circuit lines | Changes |
| Monogram seal | Small brass ring with a classical pillar, on the corner of the artwork box | Fixed |
| Three-column strip | Rule above, hairline dividers. Each column: label in brass capitals, one big figure or word in oxblood serif, one line of detail | Changes |
| Footer | Rule above. Left: `GENERAL LEGAL INFORMATION. NOT LEGAL ADVICE.` Right: `SWIPE` and a hand-drawn outline arrow | Fixed |

## 4. Word budgets

| Slot | Limit |
|---|---|
| Headline | 13 words |
| Deck | 12 words |
| Strip label | 3 words |
| Strip figure | 1 to 2 words or a short date |
| Strip detail | 8 words |
| Topic tag | 2 parts, 4 words in all |

The limits are in `theme.json` (`covers.advisory_brief.max_words`). `writer/check.js` reports a text over its limit as `COV-2` and the renderer refuses it as `word_limit`. A word is anything with a letter or a digit in it; the middle dot is not counted.

## 5. How a cover is made

1. **Words.** Every word on the cover is part of the post and goes through the Law Society screen, the script check and the independent verification with the rest of it. The three strip facts must be statements the verifier supports.
2. **Artwork.** Only the artwork panel is drawn by an image model (prompt in section 7). It carries no words, so nothing in it can be misspelled or contradict the post.
3. **Type.** The pipeline sets all the type itself, in the brand fonts, so the cover always matches the checked text.

Why the image model does not draw the whole cover: image models still misspell words and invent small print. On a legal post a wrong date or a garbled disclaimer is not acceptable.

Artwork sources allowed: an image generated for the post; Taimur's own images; public-domain images. Not allowed: other people's photographs or illustrations, including anything saved from Pinterest or carrying a stock watermark. Pinterest and the Drive inspiration folder are used for layout and art direction only.

### In the pipeline

**Where each part comes from.**

| Part | Comes from |
|---|---|
| Colours, masthead, band, firm name, motto, footer disclaimer, `SWIPE`, word limits, which categories get the cover | `clients/pextrade-law/theme.json`, `covers.advisory_brief` |
| Category and date in the top bar | The package's `category` and `date` (drawn as `NOVEMBER 19, 2026`) |
| Topic tag, headline, highlight, deck, strip, artwork | The cover slide (slide 1) of the post package, fields below |
| The cover's serif and how its marks are drawn (highlight, arrow, grain, artwork tone, weights) | `clients/pextrade-law/theme.json`, `covers.advisory_brief.fonts` and `.style` |
| Layout and positions | `renderer/render.js` (layout `advisory_brief`) |

**The cover slide in the package** (`writer/package.schema.json`):

| Field | What it is |
|---|---|
| `layout` | `advisory_brief`. May be left out: a post in a category listed in the theme's `use_for` (Law and Legal Tech) gets this cover anyway |
| `topic_tag` | Topic and region, for example `REAL ESTATE · ONTARIO` |
| `headline` | The headline |
| `highlight` | The 1 to 3 words of the headline that get the brush stroke, copied letter for letter. They must occur in the headline exactly once. Optional |
| `subline` | The deck |
| `strip` | Exactly three entries, each `label`, `figure` and `detail` |
| `art` | Optional. `file` (a PNG or JPG, path relative to the package file or absolute), `alt`, `source` (`generated`, `owner` or `public_domain`) and an optional `credit` |

Example:

```json
{
  "type": "cover",
  "layout": "advisory_brief",
  "topic_tag": "REAL ESTATE · ONTARIO",
  "headline": "Ontario's Legal Regulator Is Consulting on Digital Identity Checks in Real Estate",
  "highlight": "Digital Identity Checks",
  "subline": "A committee proposal. Not yet a rule.",
  "strip": [
    { "label": "THE NOTICE", "figure": "Nov 17", "detail": "Law Society of Ontario notice published" },
    { "label": "THE DEADLINE", "figure": "Dec 31", "detail": "Feedback requested by this date" },
    { "label": "THE STATUS", "figure": "Proposal", "detail": "Nothing has been adopted" }
  ],
  "art": { "file": "art/pextrade-law-2026-11-19-1100.png", "alt": "Halftone collage: a statue of Justice in front of a courthouse", "source": "generated" }
}
```

A full package is in [`renderer/examples/pextrade-law-advisory-brief.json`](../../renderer/examples/pextrade-law-advisory-brief.json).

**What the renderer does.** It sets the type in the brand fonts (Playfair Display and DM Sans) and fits it: the headline starts at 65 px and steps down until it has at most 6 lines and the headline and deck end above the strip; the three strip figures stay on one line each and shrink together when one is too wide. The brush stroke is drawn behind the highlighted words, one stroke for each line they sit on. Nothing may overlap or come nearer than 36 px to the edge of the canvas; if something does, the run fails. The artwork is fitted to the box and carried inside the PNG and the PDF.

**No artwork.** When the cover slide has no `art`, or the file cannot be read, the box is drawn in oxblood with the thin brass inner border and the pillar seal large in the centre. The run does not fail, and it does not hide it: `render.json` says `"artwork": "no artwork"` with the reason, and the console prints a warning.

**Motto.** The motto line is drawn under the band (L16). If `motto` in the theme is ever emptied, no motto line is drawn and everything between the band and the strip moves up 34 px to close the gap.

**What the check does.** Every word the reader sees on the cover is read by `writer/check.js` with the rest of the post: the topic tag, headline, deck and strip are part of the content hash and of every phrase, dash and spelling check, and the theme's fixed words (firm, masthead, band, motto, footer) are read the same way the closing slide's fixed words are. The cover's own findings are `COV-1` to `COV-5` (`writer/README.md`). The artwork file is not text and is not part of the hash, so an image can be added after the screen.

**The artwork.** The writing routine fills in the artwork-only prompt of section 7 and puts it in its report and on the post's Carousel Library page. It does not make the image (section 6, image model). Until an image is supplied the post is drawn with the seal.

## 6. Open points (Taimur)

- **Motto.** Settled (L16): `DEDICATED TO YOUR SUCCESS. · COMMITTED TO JUSTICE.` is drawn on every cover as the master prompt has it. Noted once: "success" in a law firm's marketing can read as a promise of results (`rules/compliance-engine.md` R2). The owner has decided.
- **Headline length.** Settled (L16): 13 words, the length of the master cover of 19 Nov 2026.
- **Fonts.** Settled (L16): Playfair Display, as on the master cover (masthead 700, headline and strip figures 900, deck 700 italic). The Newsreader restyle of L12 is withdrawn.
- **Artwork tone.** The artwork is drawn in its own colours. `style.artwork_tone: "mono"` in `theme.json` draws it in grey instead. Not chosen.
- **Slides 2 to 7.** Settled (Taimur, 19 Nov 2026): they stay as they are, burgundy and cream with Playfair Display. Only the cover is meant to be different from post to post.
- **Co-brand.** The template shows an example co-brand line (`FORTIS LEGAL · PEXTRADE ADVISORY`). Until told otherwise the band reads `PEXTRADE ADVISORY · PLAIN-LANGUAGE LEGAL NEWS FOR ONTARIO`.
- **Other categories.** The template is for news covers. Whether Estates and Family Law topic posts use it too is not decided. For now `use_for` in `theme.json` lists Law and Legal Tech only.
- **Image model.** The Gemini keys available to the pipeline are refused for images (no paid billing, 19 Nov). Until one works, Taimur makes the artwork in the Gemini app and puts it in Drive › Pextrade AI › Clients › PextradeLaw › Admin › News Letter.

## 7. The master template (Taimur, 19 Nov 2026)

> Decision L16 (19 Nov 2026): this template is followed as written. The note that follows describes the withdrawn restyle of decision L12 and is kept only as a record. Decision L12 (19 Nov 2026) had changed four things this template says: the paper is white, not cream newsprint; the type is a newspaper serif at ordinary weights, not ultra-bold; the highlight is italic, not a dry-brush stroke; the arrow is a thin straight arrow, not hand-drawn. The template is kept below as Taimur wrote it. Where it and sections 1 to 5 differ, sections 1 to 5 are what is built.

```text
Flat, front-facing, full-bleed 2D editorial broadsheet infographic (4:5 portrait, 1080×1350) on warm cream (#FAF7F2) textured newsprint paper, using deep oxblood (#3A0C0E), warm antique brass (#B8926A), and dark charcoal (#1E1918) ink.

HEADER:
- Top thin rule: Left "[FIRM/BRAND] · [CATEGORY]" in tracked uppercase sans-serif; Right "[DATE]" in tracked uppercase.
- Masthead: "[PUBLICATION TITLE]" in massive, high-contrast, chiseled Roman serif with hairline serifs (#3A0C0E).
- Sub-Masthead: Double rules enclosing centered uppercase "[CO-BRAND · PUBLISHER · MISSION STATEMENT]" in tracked sans-serif.

MOTTO/SUB-TAGLINE:
- Small spaced uppercase tagline "[MOTTO 1 · MOTTO 2]" in antique brass (#B8926A).

BODY (TWO ASYMMETRICAL COLUMNS):
- Left Column (Text Hook):
  * Topic tag: "[TOPIC · REGION]" in small caps antique brass (#B8926A).
  * Main Headline: "[4-6 LINE HEADLINE]" in ultra-bold, high-contrast chiseled serif (#1E1918).
  * Highlight: Dry-brush painted textured stroke in warm antique brass (#B8926A) behind the top 1-2 lines.
  * Subhead deck: "[1-2 LINE SUMMARY]" in italic deep oxblood (#3A0C0E) editorial serif.
- Right Column (Artwork Box):
  * Deep oxblood (#3A0C0E) rectangle with thin inner antique brass (#B8926A) border.
  * Inside: Monochrome cream-and-charcoal halftone editorial collage / documentary photo tailored to topic: "[INSERT SWAPPABLE TOPIC ILLUSTRATION / PHOTO COLLAGE]", with subtle #B8926A highlights and an embossed classical pillar monogram icon.

LOWER DATA STRIP (3 COLUMNS):
- Horizontal dividing rule. Three equal columns with hairline vertical separators:
  * Col 1: Small caps "[LABEL 1]", large bold serif "[STAT/METRIC 1]", description "[DETAIL 1]".
  * Col 2: Small caps "[LABEL 2]", large bold serif "[STAT/METRIC 2]", description "[DETAIL 2]".
  * Col 3: Small caps "[LABEL 3]", large bold serif "[STAT/METRIC 3]", description "[DETAIL 3]".

FOOTER:
- Bottom rule: Left "[LEGAL DISCLAIMER]" in small spaced uppercase; Right "[CALL TO ACTION] [HAND-DRAWN OUTLINE ARROW ICON]".

Flat 2D print aesthetic, razor-sharp typography, zero 3D mockups or drop shadows.
```

### Artwork-only prompt (what the pipeline sends)

```text
Flat, front-facing, full-bleed 2D vertical artwork (4:5 portrait). No text of any kind: no letters, numbers, logos or watermarks. Solid deep oxblood (#3A0C0E) background filling the canvas edge to edge, with a thin inner antique brass (#B8926A) border. Inside: one monochrome cream-and-charcoal fine-line engraving, in the manner of a nineteenth-century newspaper plate, of a single subject tailored to the topic: [ONE SUBJECT: A BUILDING, A DOCUMENT OR A STATUE]. Fine engraving line work and cross-hatching, a few subtle #B8926A highlights. Sober and documentary. No smartphones, screens, app icons, tick marks, shields, circuit lines, cartoon outlines or white sticker borders. Only cream, charcoal, antique brass and oxblood. Flat 2D print aesthetic, zero 3D mockups or drop shadows. The hex codes are colour values only; do not render them as text.
```

# Part B. The Cutout Cover (decision L13)

*Added 19 Nov 2026 from Taimur's lock-and-swap template of the same day. Sections 1 to 7 above are The Advisory Brief (part A). This part is the second cover. The two alternate from post to post.*

## B1. What it is

A flat 1080 × 1350 cover with a frame that never changes and three slots that do. About 85% of the slide is the fixed frame. The centre artwork and the text are swapped for each post.

## B2. When each cover is used

Three cover formats take turns, one per post (decision L17, 19 Nov 2026): The Advisory Brief, The Cutout Cover, then the original plain cover (the burgundy cover of `brand-scheme.md`, layout `standard`), and round again. The order is in `clients/pextrade-law/writer.json`, `cadence.covers`. The cover does not follow the kind of post: a news post or a topic post can get any of the three.

| Post | Cover |
|---|---|
| 19 Nov 2026 (news, Law) | The Advisory Brief |
| 21 Nov 2026 (topic, Estates) | The Cutout Cover |
| 23 Nov 2026 (news, Legal Tech) | The plain cover |
| 25 Nov 2026 (topic, Family Law) | The Advisory Brief |
| 27 Nov 2026 (news, Law) | The Cutout Cover |

`node writer/check.js --plan <date> --client pextrade-law` prints the cover for a day. Slide 1 always names it in `layout` (`advisory_brief`, `cutout_card` or `standard`). A post with the wrong cover for its day is stopped by the check (`COV-6`).

## B3. The frame (never changes)

| Part | Look |
|---|---|
| Canvas split | The top 58% holds an oxblood card (`#3A0C0E`) inset 36 px with 20 px rounded corners. The bottom 42% is warm cream paper (`#FAF7F2`) with a faint grid |
| Monogram | The classical pillar monogram in cream, in the top-left corner of the card |
| Artwork position | One cutout, centred, standing on the bottom edge of the card, in front of two tilted documents |
| Lead-in | One short italic serif line (Newsreader italic), charcoal `#1E1918` |
| Headline | Heavy geometric sans (DM Sans 800), charcoal, 1 or 2 lines |
| Summary | 3 or 4 lines of plain sans (DM Sans 400), `#2C2C2C` |
| Action row | `Swipe to learn more` in bold antique brass (`#B8926A`) on the left. An oxblood circle with a cream arrow on the right |
| Disclaimer | `GENERAL LEGAL INFORMATION. NOT LEGAL ADVICE.` in small muted grey capitals at the bottom-left |

## B4. The slots (change per post)

| Slot | In the package (slide 1) | Budget |
|---|---|---|
| Lead-in | `lead_in` | 2 to 4 words, one line |
| Headline | `headline` | 4 to 7 words, at most 2 lines |
| Summary | `subline` | 25 to 32 words, at most 4 lines |
| Artwork | `art` (`file`, `alt`, `source`, `credit`) | One image: the cutout and the two documents on oxblood |

This cover has no topic tag, no highlight and no strip. The budgets are in `theme.json` (`covers.cutout_card.max_words`, `min_words`); the check and the renderer both hold to them.

```json
{
  "type": "cover",
  "layout": "cutout_card",
  "lead_in": "Estate Planning in Ontario",
  "headline": "Digital Assets and Your Ontario Will",
  "subline": "A 25 to 32 word plain-language summary of the post goes here.",
  "art": { "file": "art/pextrade-law-2026-11-21-1700.png", "alt": "A stack of estate law books with a sealed scroll, in front of two will pages", "source": "generated" }
}
```

## B5. Which cutout each kind of post gets

Taimur's lookup table. It is in `theme.json` (`covers.cutout_card.cutouts`), keyed by the post's category, so the routine can fill the artwork prompt.

| Kind of post | Foreground cutout (stands on the card's bottom edge, monochrome) | Background (two tilted sheets) |
|---|---|---|
| Wills and Estates (`Estates`) | Stack of bound estate law volumes topped with a wax-sealed scroll and a brass key | Handwritten Last Will and Testament pages with calligraphy and witness signature lines |
| Family Law (`Family Law`) | Classical residential home facade, or balanced antique scales of justice | Signed domestic or cohabitation contract pages and Ontario family court form excerpts |
| Legal news and regulation (`Law`) | Neoclassical courthouse dome and columns, or a Lady Justice statue | Legislative bill pages, Ontario Gazette notices and vintage broadsheet clippings |
| AI and legal tech (`Legal Tech`) | Suit-clad legal professionals ascending courthouse steps, or holding circuit briefcases | Clean cream prompt-interface cards and subtle antique brass circuit schematics |
| Brand pitch or cover letter (`Brand Pitch`) | The target brand's headquarters architecture, flagship product or industry landmark | Annotated strategy memo, KPI audit sheet and signed proposal pages |

Since L17 a news post can get this cover too, so the `Law` and `Legal Tech` rows are in use. `Brand Pitch` is not a Pextrade Law post category.

## B6. How it is made

**Who draws what.** As with The Advisory Brief (decision L11), the image model draws only the artwork. The pipeline draws the card, the monogram, every word, the action row and the disclaimer, so no word on the cover can be misspelt by the image model and every word is read by the check.

**What the renderer does.** `renderer/render.js` (template `cutout_card`) fits the artwork to the card, anchored to the bottom edge, and rounds the corners. The headline starts at 78 px and steps down until it has at most 2 lines and the summary ends above the action row. A lead-in that does not fit on one line, a summary over 4 lines, or anything that overlaps or comes nearer than 36 px to the edge of the canvas fails the run.

**No artwork.** When the cover slide has no `art`, or the file cannot be read, the card is drawn with a stand-in: a line drawing of a classical facade standing on the bottom edge, in front of two blank ruled sheets. The run does not fail and does not hide it: `render.json` says `"artwork": "no artwork"` and the console prints a warning. The stand-in is the same every time, so a post drawn with it is not unique.

**What the check does.** `lead_in`, the headline and the summary are part of the content hash and of every phrase, dash and spelling check. The cover's fixed words (`Swipe to learn more`, the disclaimer) are read from the theme. Findings `COV-1` to `COV-6` are listed in `writer/README.md`.

### Artwork-only prompt (what the routine fills in)

The two bracketed parts come from the table in B5.

```text
Flat 2D landscape artwork (4:3). No readable text of any kind: no words, numbers, logos or watermarks. Solid deep oxblood (#3A0C0E) background filling the canvas edge to edge, no border and no frame. Back layer: two tilted archival documents, angled symmetrically toward the upper-left and upper-right corners, depicting [BACKGROUND DOCUMENTS]; any writing on them is illegible script lines, never readable words. Foreground: horizontally centred and standing flush on the bottom edge of the canvas, overlapping both documents, a high-contrast monochrome cream-and-charcoal cutout of [FOREGROUND SUBJECT], in fine engraving line work with subtle #B8926A antique brass highlights. Keep the top-left corner empty. Sober and documentary. No cartoon outlines or white sticker borders. Flat print aesthetic, zero 3D mockups, no outer shadows. The hex codes are colour values only; do not render them as text.
```

## B7. Open points (Taimur)

- **The reference image.** The template names `image_ea7e9f.jpg` (the layout) and `image_96e9cc.jpg` (the monogram). Neither file reached the repository or the session, so the cover was built from the written description. If the render differs from the reference, send the image and the positions are adjusted in `renderer/render.js` (`CC`) and `theme.json` (`covers.cutout_card.card`).
- **Paper colour.** This cover uses warm cream `#FAF7F2`, as the template says. The Advisory Brief was changed to white the same day (L12). To make this one white too, change `covers.cutout_card.colours.paper`.
- **Disclaimer grey.** Drawn in `#6F6A64` at 12.5 px so that it can still be read on cream. A paler grey would be closer to "tiny muted grey" but hard to read.
- **Image model.** Still no working key (part A, section 6). Until there is one, Taimur makes the artwork in the Gemini app from the prompt above, or the post is drawn with the stand-in.

## B8. The lock-and-swap template (Taimur, 19 Nov 2026)

Kept as Taimur gave it. Where it and B1 to B6 differ, B1 to B6 are what is built: the pipeline sets the words, and the image model is asked for the artwork only.

**Copy budget.** Italic lead-in 2 to 4 words (one line). Bold sans headline 4 to 7 words (1 or 2 lines). Body summary 25 to 32 words (3 or 4 lines), so a clear space stays above `Swipe to learn more`.

```text
Flat 2D 4:5 editorial cover infographic (1080×1350) replicating the exact spatial layout, rounded card proportions, typography hierarchy, and element placement of image_ea7e9f.jpg.

1. LOCKED BRAND SYSTEM (DO NOT ALTER):
- Background: Warm cream (#FAF7F2) cotton paper with a faint architectural grid texture in the lower 42%.
- Top Hero Card (Top 58%, inset margins, 20px rounded corners): Solid deep oxblood (#3A0C0E) fill with a crisp #FAF7F2 classical pillar monogram in the top-left corner.
- Bottom Action Row: Bold sans-serif 'Swipe to learn more' in antique brass (#B8926A) on the bottom-left; solid #3A0C0E circle with a centered #FAF7F2 right arrow (→) on the bottom-right.
- Footer Micro-Note (bottom-left edge): Tiny muted grey uppercase 'GENERAL LEGAL INFORMATION. NOT LEGAL ADVICE.'

2. SWAPPABLE COLLAGE CUTOUTS (CENTER OF TOP CARD):
- Back Layer: Two tilted archival documents angled symmetrically toward the upper-left and upper-right corners depicting [INSERT BACKGROUND DOCUMENTS, e.g., handwritten Last Will pages / legislative bill text / AI prompt UI cards].
- Foreground Cutout: Horizontally centered and anchored flush to the bottom edge of the rounded oxblood card, render a high-contrast monochrome cream-and-charcoal cutout of [INSERT FOREGROUND SUBJECT, e.g., a stack of bound estate books with a wax seal / Ontario courthouse facade / Lady Justice] with subtle #B8926A antique brass highlights.

3. SWAPPABLE EDITORIAL COPY (LOWER 42%, LEFT-ALIGNED):
- Line 1 (Italic Serif Lead-In, #1E1918): '[INSERT 2–4 WORD LEAD-IN, e.g., Estate Planning in Ontario]'
- Line 2 (Heavy Bold Geometric Sans-Serif Headline, #1E1918): '[INSERT 4–7 WORD HEADLINE, e.g., Digital Assets & Your Ontario Will]'
- Body Summary (3-line clean sans-serif, #2C2C2C): '[INSERT 25–30 WORD PLAIN-LANGUAGE SUMMARY]'

4. GUARDRAILS:
- Ultra-sharp 4K flat print aesthetic; zero 3D mockups or outer shadows.
- The hex codes are color values only—do not render them as text.
- Render only the exact text specified above.
```
