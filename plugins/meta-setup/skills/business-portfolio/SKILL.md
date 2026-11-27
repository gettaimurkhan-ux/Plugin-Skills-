---
name: business-portfolio
description: Set up or tidy a Meta business portfolio (Business Manager) for automated Facebook Page and Instagram posting. Covers creating the portfolio, adding Pages and Instagram accounts, adding people with the right roles and asset access, connecting the developer app, making a System User with a never-expiring token, where tokens go, and read-only checks before the first post. Use when someone asks how to add people to their Meta business, give a person or an agency access to a Page or Instagram account, make a System User token, or connect an Instagram account with its Facebook Page for posting.
---

# Meta business portfolio (Pages + Instagram, System User)

The route when the accounts have Facebook Pages and should sit in one business, with people and automation given only the access they need. Screen names are as of November 2026; if a screen differs, ask for a screenshot and match by meaning.

For Instagram accounts with **no** Facebook Page, use the other skill in this pack, `instagram-login-api`.

## Pieces

| Piece | What it is |
|---|---|
| Business portfolio | The container (business.facebook.com). Owned by a real person's Facebook login; add a second admin so one lost login does not lock everything |
| Assets | Pages, Instagram accounts, ad accounts, apps. Each asset belongs to one portfolio |
| People | Real people, invited by email, each with a role and access to specific assets only |
| System User | A non-person user for automation. Its token can be set to never expire and is cut off the moment the System User is removed |
| Developer app | Made at developers.facebook.com and connected to the portfolio; the System User's token is issued for it |

## Steps

1. **Portfolio**: business.facebook.com → create a business portfolio (business name, the owner's name, a business email). One per business; do not mix unrelated businesses.
2. **Add the Page**: Settings → Accounts → **Pages** → Add → claim a Page you own (or request access to one you manage).
3. **Add the Instagram account**: Settings → Accounts → **Instagram accounts** → Add → log in as the account. It must be professional; link it to its Page there or in the Page's settings (Linked accounts → Instagram).
4. **Add people**: Settings → Users → **People** → Invite → email address → role:
   - **Full control** (admin): everything, including people and money. Keep to the owner and one backup.
   - **Basic / partial access** (employee): only the assets ticked in the next step.
   Then tick the assets and the level for each (for a Page: content, messages, insights; for Instagram: content, insights). The person accepts the email invite.
   - An agency or freelancer with its own portfolio: add it as a **Partner** (Settings → Users → Partners) and share assets with it, rather than adding its staff one by one.
5. **Connect the app**: Settings → Accounts → **Apps** → Add → the app id (or from the app: App settings → Basic → business portfolio).
6. **System User**: Settings → Users → **System users** → Add → name (e.g. `<brand>-poster`) → role Employee (Admin only if it must manage other assets). Then **Assign assets**: the Page (content / posting) and the Instagram account (content).
7. **Token**: on the System User → **Generate new token** → the app → expiry **Never** → permissions for posting: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish` (plus `business_management` if it must read the portfolio). Copy it once into the environment settings of wherever the poster runs, e.g. `<BRAND>_META_ACCESS_TOKEN`. Never in chat, a repository or a document.
8. **Checks** (read only, through the IP the poster will use):
   - `GET https://graph.facebook.com/v21.0/me/accounts` → the Page is listed.
   - `GET /<page_id>?fields=instagram_business_account` → the Instagram account id.
   - `GET /<ig_id>?fields=username` → the right account.
   - `GET /<ig_id>/content_publishing_limit` → the quota.
9. **First post only with the owner's yes**, on each account.

## Removing access

Settings → Users → People (or System users, or Partners) → the name → Remove, or untick single assets. Removing a System User kills its token at once. Removing anyone is the owner's decision: confirm the exact person and assets first.

## Residential (ISP) IP

Same rule as in `instagram-login-api`: a fixed residential / ISP proxy for every request to `graph.facebook.com` and the upload hosts, failing closed, several accounts of one brand may share it. Logins to the portfolio itself stay on the owner's normal devices.

## Rules

- Official API only. No browser bots or screen automation.
- Least access: give people and System Users only the assets and levels they need.
- Two admins on every portfolio, both real people.
- One business per portfolio. Never reuse one business's token for another.
- Tokens only in environment settings; one pasted anywhere else counts as leaked and is replaced.
