---
name: format-rotation
description: Decide which Instagram carousel format a post gets. Pextrade Advisory's three formats (The Advisory Brief, The Cutout Cover, the plain cover) take turns, one per post. Use before writing or rendering any post in the newsletter service, when asked which cover is next, or when setting the rotation up for another client.
---

# Format rotation

The orchestrating rule of the newsletter service (Taimur, 19 Nov 2026): three cover formats take turns, one per post, whatever the post is about.

| Turn | Format | `layout` on slide 1 | Skill |
|---|---|---|---|
| 1 | The Advisory Brief | `advisory_brief` | `advisory-brief-cover` |
| 2 | The Cutout Cover | `cutout_card` | `cutout-cover` |
| 3 | The plain cover | `standard` | `plain-cover` |

Then round again. For Pextrade Law the turns are fixed by date: 19 Nov 2026 The Advisory Brief, 21 Nov The Cutout Cover, 23 Nov the plain cover, 25 Nov The Advisory Brief, and so on, one post every 2 days.

## Rules

1. Never choose the format yourself, and never work it out from the topic. Take it from the plan.
2. In the Law Firm SEO & Content repository the plan is printed by `node writer/check.js --plan <date> --client <client>`; the `cover` of the slot is the format. The order lives in that client's `writer.json`, `cadence.covers`.
3. Slide 1 always names the format in `layout`, exactly as the plan prints it. The check stops a post with the wrong format for its day.
4. Where there is no such plan (another business, a one-off), count the posts already published in the series: the format is turn `(count mod 3) + 1`, and say which rule you used.
5. Only slide 1 changes between formats. Slides 2 to 7 keep the brand's ordinary look.
6. To change the order, or add a fourth format, change `cadence.covers` in one place. Do not special-case a post.
