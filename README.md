---
id: SKL-001
title: Plugin-Skills- — README
tier: 1
status: active
created: 2026-11-19
last_verified: 2026-11-19
review_days: 30
---

# Plugin-Skills-

A repository for Skills. One place for the Claude skills Pextrade AI uses across its businesses: marketing, SEO, AI-search visibility, social content, ads, email and plain writing. 273 skills in 6 packs, collected from public repositories and read before they were added.

## Use it in a project

This repository is a Claude Code plugin marketplace. In any project (Pextrade-AI, law-firm-seo-content, or another business):

```
/plugin marketplace add gettaimurkhan-ux/Plugin-Skills-
/plugin install marketingskills@pextrade-skills
```

Install only the packs a project needs. Each pack's skills are called as `pack:name`, so two packs can both have an `seo-audit` without clashing. [`INDEX.md`](INDEX.md) lists every skill.

## Packs

| Pack | Source | Version taken | Skills | Licence |
|---|---|---|---|---|
| `no-ai-slop` | [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop) | `000650b15698` (2026-09-01) | 1 | MIT |
| `free-claude-skills` | [rdoser13/free-claude-skills](https://github.com/rdoser13/free-claude-skills) | `4751aafc3159` (2026-10-19) | 12 | MIT |
| `marketingskills` | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `73573e94a06a` (2026-11-17) | 53 | MIT |
| `claude-seo` | [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) | `468ed5b0d9e3` (2026-11-15) | 29 | MIT |
| `aaron-marketing` | [aaron-he-zhu/aaron-marketing-skills](https://github.com/aaron-he-zhu/aaron-marketing-skills) | `ed7428a6919b` (2026-11-19) | 120 | Apache 2.0 |
| `alirezarezvani-marketing` | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | `f8593c494121` (2026-11-17) | 58 | MIT |

Each pack keeps its author's licence in `plugins/<pack>/LICENSE`.

## What was left out, and why

Every pack is skills only. Nothing in this repository runs by itself: no hooks, no installers, no connector (MCP) settings, and no `CLAUDE.md` or `AGENTS.md` files from the sources, which an assistant would otherwise read as instructions.

- **`free-claude-skills`**: Left out: skill-auto-improve (runs silently on every skill and writes logs into skill folders), skill-creator and setting-up-mcps (not marketing).
- **`marketingskills`**: Left out: tools/clis (command-line tools that post, send or change ad budgets the moment they run). The integration guides are kept because skills link to them.
- **`claude-seo`**: Left out: install.sh, install.ps1, uninstall scripts, the hook that ran after every edit, and extensions/ (installers that write paid API keys into settings). Changed: the "Community Footer" section of skills/seo/SKILL.md, which told the assistant to append an advert for the author's paid community to every deliverable, is removed. Its scripts need a Python environment (requirements.txt) and some need Chromium; they are not installed automatically.
- **`aaron-marketing`**: Left out: hooks/ (ran on every tool call and blocked or rewrote actions), memory/, tests/, evals/, maintainer tooling. Its connector scripts send queries to Firecrawl and Tavily when used, and need their API keys.
- **`alirezarezvani-marketing`**: Only the marketing folders are taken (about 60 of 495 skills). Left out: engineering, finance, executive, product and other non-marketing skills; the router hook that ran on every prompt; the installers.
- Not taken at all: `irinabuht12-oss/marketing-skills` (no licence text, and its plugin connects a third-party service with access to ad and analytics accounts) and `ericosiu/ai-marketing-skills` (every skill tells the assistant to connect a remote gateway run by the author's agency, and some scripts send email or enrol people in campaigns with no confirmation step).

## Before using a skill for a law firm

Read [`CAUTIONS.md`](CAUTIONS.md). Several skills teach wording or tactics that break the Law Society of Ontario's marketing rules. Anything made with them for a law firm still goes through that firm's compliance check.

## Updating a pack

Packs are pinned to the commit above. To update one, read the source's changes since that commit first, then copy the new version in place and record it in `CHANGELOG.md` and `REGISTRY.md`. Never pull a pack in without reading what changed.
