---
name: instagram-login-api
description: Set up automated Instagram posting through Meta's official "Instagram API with Instagram Login", with no Facebook Page on the Instagram accounts. Covers the professional-account switch, the one developer app, Instagram testers and accepting their invites, tokens, where the tokens go, 60-day renewal, read-only checks before the first post, and routing through a fixed residential (ISP) IP. Use when someone wants to post to their own Instagram accounts by API without linking Facebook Pages, asks how to add Instagram accounts to an app, or a token has expired.
---

# Instagram API with Instagram Login (no Facebook Page)

Meta's route for posting to **your own** Instagram professional accounts without any Facebook Page on them. Steps and screen names are as of November 2026; Meta renames screens often, so if a screen differs, ask the person for a screenshot and match by meaning.

**Newer apps (seen 27 Nov 2026) no longer offer "API setup with Instagram login".** They show **API setup with Unified login**, whose tokens start `EAA`, are called on `graph.facebook.com` and name the account by its Instagram account ID. If the app page shows Unified login, or a token starts `EAA`, use `meta-instagram-setup` in this pack; the addresses and the renewal call below do not apply to those tokens.

Use `business-portfolio` instead when the accounts already sit in a Meta business portfolio with Facebook Pages, or when other people need managed access.

## What it needs

| Thing | How many | Notes |
|---|---|---|
| Instagram **professional** account (Creator or Business) | one per account | Personal accounts cannot be reached by the API |
| Facebook login of a **real person** | one, once | Only to create the developer app. It is not linked to the Instagram accounts and is not shown on them. Use an established personal account: Meta disables new or fake-named accounts, and the app and every token go with it |
| Developer app | one for all the accounts | Owned by that Facebook login |
| Token | one per Instagram account | Lasts 60 days; renewable |

## Steps

1. **Professional switch** (Instagram app, each account): Profile → ☰ → Settings → **Account type and tools** → **Switch to professional account** → Creator (or Business) → any category. If it offers "Switch to personal account", it is already professional.
2. **Developer app** (browser, logged into the real person's Facebook): developers.facebook.com → **Get started** (first time only) → **My Apps** → **Create app** → a plain name (e.g. `<Brand> Poster`) → use case **Manage messaging & content on Instagram** → app type **Business** if asked → Create.
3. **Testers**: in the app, **App roles → Roles → Add people → Instagram Tester** → each Instagram username. While the app is in development mode it can only reach accounts that are testers, which is exactly "your own accounts" and needs no Meta app review.
4. **Accept each invite**, logged in as that Instagram account: instagram.com → Settings → **Apps and websites** → **Tester invites** → Accept. (In the mobile app the same list sits under Settings → Website permissions.)
5. **Tokens**: in the app, **Instagram → API setup with Instagram login → Generate access tokens → Add account** → log in as the account → allow. Permissions needed for posting: `instagram_business_basic`, `instagram_business_content_publish`.
6. **Store each token** in the environment settings of wherever the poster runs (the cloud environment's variables, the server's variables). One variable per account, for example `<BRAND>_IG_TOKEN_<HANDLE>`. Never in chat, never in a repository, never in a document.
7. **Checks before anything posts** (read only, through the same IP the poster will use):
   - `GET https://graph.instagram.com/v21.0/me?fields=user_id,username,account_type` with the token: the username must be the account it was made for, and `account_type` professional.
   - `GET https://graph.instagram.com/v21.0/<user_id>/content_publishing_limit?fields=quota_usage,config`: shows the posting quota (100 API posts per 24 hours).
8. **First post only with the owner's yes** for that exact post, on each account.

## Renewal

A token lasts 60 days. Renew it while it is still valid and at least 24 hours old:
`GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<token>` returns a new 60-day token. A poster should renew on its own about every 50 days and keep the new token where it reads tokens from; an expired token cannot be renewed, only made again at step 5.

## Posting a Reel (what the poster does)

1. `POST https://graph.instagram.com/v21.0/<user_id>/media` with `media_type=REELS`, the caption, and either a public `video_url` or `upload_type=resumable` (then send the bytes to the upload URL it returns).
2. Poll `GET /<container_id>?fields=status_code` until `FINISHED` (or stop on `ERROR`).
3. `POST /<user_id>/media_publish` with `creation_id=<container_id>`.
4. Record the media id and permalink. Instagram's music library cannot be added through the API: the video posts with the sound already in the file.

## Residential (ISP) IP

To have Instagram see a home connection instead of a datacenter, send every request to `graph.instagram.com` and the upload host through a **static** residential / ISP proxy (written `http://user:password@host:port`, stored as an environment variable like the tokens).

- Use a fixed (sticky) IP, never a rotating pool. Several accounts of one brand may share one IP, like one household; spread their posts apart in time.
- Pick the IP in the country where the accounts are normally used.
- Fail closed: if the proxy is down, the post fails and is reported. It never falls back to the server's own address.
- Uploads go through the proxy too, so count the data against the proxy plan.

## Rules

- Official API only. No browser bots, screen automation, password logins or anti-detect browsers.
- One controlling Facebook login, a real person's. Keep unrelated businesses in separate apps.
- Start new or quiet accounts slowly (1–2 posts a day) and ramp up.
- The same video on several accounts: different days, different captions, and a small re-encode difference per account, or Instagram treats it as unoriginal.
- Tokens and proxy logins live only in environment settings. If one is ever pasted into chat or a file, treat it as leaked: make a new one.
