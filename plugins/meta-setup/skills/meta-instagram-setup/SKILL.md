---
name: "meta-instagram-setup"
description: "Set up or check a Meta developer app so Instagram accounts can post through the Instagram API: testers, portfolio, permissions, tokens, env vars. Covers newer apps on Unified login (EAA tokens, graph.facebook.com, account ID instead of me). Use for any new brand, or when a token check fails."
---

# Meta Instagram API setup

Walk the user through connecting Instagram accounts to a Meta developer app so they can post through the official Instagram API. Work in the user's own Chrome tab. The user does every login; Claude navigates, reads and reports.

## Ground rules

- **Never type passwords, never solve "I'm not a robot" checks.** Open the page, say what to click, wait for the user to say they are in.
- **Never read, copy or screenshot a token.** The user clicks Generate token and pastes it straight into Claude's environment settings. When reading a page that may show a token, redact any 40+ character string before it reaches the chat.
- **Ask before any change** to the app, a portfolio or an account: accepting invites, adding or removing permissions, creating a portfolio, switching account type. A plain "go" on a named step counts as approval for that step only.
- **Never delete** an app, portfolio, permission or account link without the user confirming exactly what goes.
- **Keep brands separate.** One app and one portfolio per brand. Never attach a brand's app to another brand's portfolio. Ask the user which brands they run and keep each one's app, portfolio and tokens apart.
- **No Zapier** for this workflow. Postiz is the approved alternative for scheduling.
- After each step, verify from the page and say plainly what is confirmed and what is not.

## Before starting

1. Ask which brand and which Instagram handles.
2. Check `developers.facebook.com/apps` (no trailing slash; the slash version returns Page Not Found) for an existing app for that brand. Do not create a second one.
3. Confirm which Facebook login owns the app. Chrome often gets logged out of Facebook while the user switches Instagram accounts; expect to ask them to log back in.

## Step 1: Professional accounts

Each Instagram account must be Business or Creator, or the token step fails.

- Check: logged in as the account, open instagram.com settings. A professional account shows a **Your insights and tools** section with **Professional account** / **Creator tools and controls**. A personal account does not.
- To switch: Settings → Account type and tools → Switch to professional account. This is an account setting change, so ask first or let the user do it.

## Step 2: Create the app

developers.facebook.com → My Apps → Create app. Name it `<Brand> Poster`, use case **Manage messaging & content on Instagram**.

If developer registration loops on phone verification or says the device is not usually used, have the user finish registration on their phone where Facebook already trusts the device, then return to the computer.

## Step 3: Add testers and accept invites

1. In the app: App roles → Roles → Add people → **Instagram Tester**, add each handle.
2. For each account, the user logs in at instagram.com, then open `https://www.instagram.com/accounts/manage_access/` and the **Tester Invites** tab. The phone app often does not show invites; use the web page.
3. Confirm which account is logged in before clicking anything (the profile link in the left nav shows the handle).
4. Accepting agrees to Meta's Platform Terms for that account, so get the user's go-ahead, then click **Accept**.
5. Success looks like: "`<App name>` - Authorized by you on `<date>`" with a Remove button. If Instagram logs out right after the click, the result is unconfirmed; have the user log back in and re-check.

Keep a table: account, invite accepted (confirmed / unconfirmed), professional (yes / no).

## Step 4: API setup route

Open the app → Use cases → Customize on the Instagram use case.

- **Newer apps no longer have "API setup with Instagram login".** They show **API setup with Unified login**, which requires a business portfolio. A banner on the page says so.
- **API setup with Facebook login** is legacy and needs a Facebook Page per Instagram account.

Default choice: create a **new portfolio just for this brand** from the portfolio picker (Create a new business portfolio: name, first and last name, business email). Use an email not tied to another brand. Stop before **Create portfolio** for the user to check, or let the user create it. Afterwards remind them to confirm the portfolio email from the inbox (it shows "Pending confirmation" until they do).

**Which route the app is on decides the token kind and the address every call uses. Write the route down before going further; see "Unified login: token kind and address" below.**

## Step 5: Permissions

On **Permissions and features**, add only what posting needs:

- `instagram_business_basic`
- `instagram_business_content_publish`

Add comments, insights or messages only if the user asks. Each should read **Ready for testing** after adding.

**Warning:** clicking **Create new configuration** under "1. Configure your app" applies Meta's General template and adds `ads_management`, `ads_read`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments` and `instagram_manage_messages` to the app. If it has already been created, report the added permissions and ask whether to remove them or leave them.

**On a Unified login app, do not remove `instagram_basic` or `instagram_content_publish`.** Its tokens are the Facebook kind, and those are the two permission names that kind uses for reading the account and publishing. Reported from one Unified login app's dashboard on 27 Nov 2026 (both "Ready for testing"); reading the account with them is proven, publishing is not yet proven by a real post. `ads_management` and `ads_read` are not needed for posting; removing permissions may mean the tokens have to be generated again.

## Step 6: Tokens (user does this)

Under **2. Generate access tokens**, each tester account appears with a **Generate token** link and its **Instagram account ID** (a 17-digit number starting `1784`).

1. User clicks Generate token for each account, logs in as it if asked, clicks Allow.
2. User pastes each token into Claude's environment settings (environment menu → Edit), never into chat. Naming: `<BRAND>_IG_TOKEN_<HANDLE>` in capitals, for example `ACME_IG_TOKEN_ACMEHANDLE`. Proxy goes in `<BRAND>_IG_PROXY_URL`.
3. Note each account's **Instagram account ID** from the page. It is not a secret; record it in the brand's setup document. On a Unified login app every call needs it.
4. Expiry: do not assume 60 days. Note the expiry date the page shows for each token; if it shows none, say the expiry is unknown.
5. Tokens must be generated **after** the permissions in Step 5 were added. Older tokens will not carry the posting permission and must be regenerated.

Signs the step was done: green check on step 2, Webhook Subscription toggles turned on. Meta does not show whether a token was saved, so say so.

## Unified login: token kind and address

Proven on a Unified login app on 27 Nov 2026, with read-only calls through a proxy for three accounts.

| | Instagram login (older apps) | Unified login (newer apps) |
|---|---|---|
| Token starts with | `IGAA` | `EAA` |
| Address | `graph.instagram.com` | `graph.facebook.com` |
| Who "me" is | the Instagram account | a system user, not the Instagram account |
| How to name the account | `/me` | `/<Instagram account ID>` |

Rules for a Unified login app:

- **`EAA` tokens are the right kind. Never tell the user to regenerate them as `IGAA`**; the app cannot issue those.
- **Call `graph.facebook.com`, never `graph.instagram.com`.** On Instagram's own address an `EAA` token fails with `Invalid OAuth access token - Cannot parse access token` (code 190). That error means wrong address, not a bad token.
- **Ask for the account by its ID, never `me`.** `GET https://graph.facebook.com/me?fields=id,name` returns 200 with an empty body `{}`, which looks like a failure but only means "me" is a system user.
- The read-only check that works: `GET https://graph.facebook.com/v27.0/<Instagram account ID>?fields=id,username` with the header `Authorization: Bearer <token>`. It returns the ID and the username. The field is `id`; `user_id` belongs to Instagram's own address.
- Publishing uses the same address and ID (`/<Instagram account ID>/media`, then `/<Instagram account ID>/media_publish`). Not yet proven with these tokens; treat the first post as a test and only with the user's yes.

## Step 7: Verify in a new session

Environment settings only load into new sessions. Check with a names-only listing (never print values):

```bash
env | cut -d= -f1 | grep -i '<BRAND>'
```

If nothing shows, tell the user to start a new session and say "keys added". In that session: confirm all variables exist, check only the first two or three characters of each token to learn its kind (`IGAA` or `EAA`), then run a read-only call for each account through the proxy using the address and form for that kind (table above): profile id and username only. Then a dry run. Nothing posts until the read-only checks pass and the user approves.

If a read-only check fails, check the address and the account ID against the table before saying anything about the token.

## Things that are normal and can be left alone

- Webhooks (step 3 on the page) and App Review (step 4) are not needed while only the user's own tester accounts use the app.
- Logging into Business Suite as an Instagram account can auto-create a portfolio named after that account. It does not affect the app. Report it; do not delete it without the user asking.
- App mode stays "In development".

## Finish

End with a short status: what is confirmed, what is unconfirmed, and the steps only the user can do (new session, email confirmation, token renewal date).
