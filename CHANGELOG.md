---
id: SKL-007
title: Change log
tier: 2
status: active
created: 2026-11-19
last_verified: 2026-11-27
review_days: 30
---

# STATE CHANGE LOG

One line per change, newest first: **date · ID · what changed · by · approved**.

- 2026-11-27 · SKL-017 · New pack `meta-setup`, Pextrade AI's own: `instagram-login-api` (Instagram posting with no Facebook Page: professional switch, one developer app, Instagram testers and invites, tokens in environment settings, 60-day renewal, read-only checks, a fixed residential / ISP IP that fails closed) and `business-portfolio` (portfolio, Pages and Instagram, adding people and partners with least access, System User never-expiring tokens, checks, removing access). General steps only, as the repository is public; marketplace, INDEX and README updated · Claude · Taimur (27 Nov: "Do we already have skills for adding people and the whole facebook business portfolio routine"; "Lets do it in a seperate repo - pextrade AI and our skills repo")
- 2026-11-19 · SKL-016 · New pack `instagram-carousel-formats`: Pextrade AI's three carousel formats (The Advisory Brief, The Cutout Cover, the plain cover) and their rotation rule as four skills, with the renderer, theme, examples and reference images copied from law-firm-seo-content at `06e2e59`. One internal Notion link removed from an example, because this repository is public · Claude · Taimur (19 Nov: "turn both these creations and the code instructions used for each into skills"; "save them under Instagram Carousel Formats"; "keep these 3 formats")
- 2026-11-19 · SKL-001 to SKL-015 · The starter README GitHub made (title and one line, "A repository for Skills") kept inside the new README. Repository filled with 6 packs, 273 skills, from petergyang/no-ai-slop, rdoser13/free-claude-skills, coreyhaines31/marketingskills, AgriciDaniel/claude-seo, aaron-he-zhu/aaron-marketing-skills, alirezarezvani/claude-skills. Each source was read before it was added (prompt injection, scripts, network calls, credentials, actions without confirmation, licence). Hooks, installers, connector settings and the sources' CLAUDE.md and AGENTS.md files left out; one advert footer removed from seo-toolkit (claude-seo); three non-marketing or self-modifying skills left out of careful-marketing (free-claude-skills). Two sources not taken (README) · Claude · Taimur (19 Nov: "Can't we create a separate repo for these skills. I want to have all skills there and utilize them on my multiple businesses"; chose all marketing skills)
