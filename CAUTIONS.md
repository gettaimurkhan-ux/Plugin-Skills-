---
id: SKL-006
title: Cautions — wording and tactics not to use
tier: 2
status: active
created: 2026-11-19
last_verified: 2026-11-19
review_days: 30
---

# Cautions

Found when the sources were read on 2026-11-19. Each skill is kept as its author wrote it; this page says which parts not to follow.

## Never use, for any business

| Where | What |
|---|---|
| `aaron-marketing`: `references/platforms/grokipedia.md` | A "stealth" method to get a page cited by an AI encyclopedia while hiding the brand. Manipulating what an AI says |
| `aaron-marketing`: `seo-geo/implement/page-play-builder/references/parasite.md`; `alirezarezvani-marketing`: `skills/marketing-ideas` (idea 10) | Parasite or barnacle SEO on other people's platforms |
| `alirezarezvani-marketing`: `skills/marketing-ideas` (idea 43) | Engagement pods |
| `alirezarezvani-marketing`: `skills/social-content/references/reverse-engineering.md`; `careful-marketing`: `linkedin-profile-scraper` | Scraping people's profiles and posts |
| `alirezarezvani-marketing`: `skills/cold-email` | "re:" subject lines that pretend to be a reply |
| `seo-toolkit`: `scripts/content_humanize.py` and the "remove watermarks" step of `seo-content` | Stripping AI-content markers |
| `alirezarezvani-marketing`: `landing` | "Invent compelling content" when input is thin. Never invent facts, figures or testimonials |
| `aaron-marketing`: `scripts/connectors/suggest.py` | Uses an unofficial Google endpoint; its own notes say this may break Google's terms |

## Not for law firms (Law Society of Ontario rules)

| Pattern | Seen in |
|---|---|
| "Best", "#1", "Expert", "Award-winning", "Proven", "Guaranteed" in titles and meta | `aaron-marketing` title and meta formulas; `alirezarezvani-marketing` headline scorer; keyword skills with "best ..." modifiers |
| Hooks that promise a result ("[result] in [time]", before and after, client wins) | social and short-video skills in several packs |
| Review targets, review requests after a "successful" matter, star-rating markup | local SEO and schema skills in `alirezarezvani-marketing`, `seo-toolkit`, `marketingskills` |
| Urgency and scarcity: countdowns, "last call", limited spots | CRO, popup, email and landing skills |
| Referral rewards | `referral-program`, `referrals` |
| Templated city pages at scale | programmatic SEO skills (doorway-page risk) |

## Before anything is sent or published

No skill here is allowed to post, send email, submit URLs to search engines or spend money without the owner's yes for that exact action. Cold email to Canadians follows Canada's anti-spam law (CASL): consent first, sender identified, an unsubscribe in every message. Several skills describe only the US rules.

## Google's Indexing API

It is only for job postings and livestream pages. Ordinary pages are submitted through a sitemap or URL Inspection in Search Console.
