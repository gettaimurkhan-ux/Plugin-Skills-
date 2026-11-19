---
id: SKL-003
title: Master plan
tier: 1
status: active
created: 2026-11-19
last_verified: 2026-11-19
review_days: 30
---

# MASTER PLAN

## 1. Intent
- **Objective:** one reviewed, pinned library of skills that every Pextrade business can use.
- **Active focus:** the first 6 packs, 273 skills.

## 2. Pipeline
- [x] `SKL-010` to `SKL-015`: first packs added and read (2026-11-19)
- [ ] Add the marketplace to the business repos that need it (Pextrade-AI, law-firm-seo-content)
- [ ] Decide whether Pextrade AI's own skills (`branding`, `seo`, `ads-offers`, `ai-marketing`, `content-creation`, `personal-brand`, `competitor-study` in Pextrade-AI) move here
- [ ] Pextrade AI's rule SE9 says public skill sets are borrowed from, not installed. Taimur chose to install them on 2026-11-19; SE9 to be updated in Pextrade-AI with his approval

## 3. Decisions
| # | Decision | Date |
|---|---|---|
| K1 | A separate repository holds all skills, for use across Taimur's businesses (Taimur, 2026-11-19) | 2026-11-19 |
| K2 | All marketing skills from the five usable sources are taken (Taimur, 2026-11-19). Two sources are not taken (README) | 2026-11-19 |
| K3 | Skills only: hooks, installers, connector settings and the sources' CLAUDE.md and AGENTS.md files are never carried over | 2026-11-19 |

## 4. Structural index
- `README.md`, `PROJECT_PROFILE.md`, `MASTER_PLAN.md`: ground truth
- `REGISTRY.md`, `CHANGELOG.md`: what is here and every change
- `INDEX.md`: every skill; `CAUTIONS.md`: what not to follow
- `plugins/<pack>/`: one pack per source, with `SOURCE.md` and `LICENSE`
