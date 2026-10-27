# Social Unfollower

Two bookmarklets that find the accounts you follow that don't follow you back and bulk-unfollow them. A small panel opens in the corner of Instagram or TikTok; everything runs in the user's own browser.

- Repo: https://github.com/Simpuhl/Social-Unfollower (branch `main`)
- Install page: https://simpuhl.github.io/Social-Unfollower/ (GitHub Pages, served from `index.html`)
- `instagram.js` is based on [davidarroyo1234/InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) (MIT). Keep his copyright line in `LICENSE`. The panel and the TikTok tool are original.

## Files

| File | What it does |
|---|---|
| `panel.js` | Shared corner panel: list, search, selection, whitelist, export, settings, English/Spanish, unfollow loop with adaptive pacing |
| `instagram.js` | Instagram adapter: scans followers/following through Instagram's API, unfollows via its GraphQL mutation, verifies each unfollow |
| `tiktok.js` | TikTok adapter: reads the open Following list from the page, unfollows by clicking each row's button, confirms with TikTok's server reply |
| `build.js` | Bundles `panel.js` with each adapter, syntax-checks it, and writes `index.html` |
| `index.html` | Generated install page. Don't edit by hand |

After any change to the scripts, run `node build.js` and commit `index.html` with the change.

The adapter contract (what `socialUnfollower(platform)` expects) is documented at the top of `panel.js`. Unfollow outcomes are `unfollowed`, `failed`, `blocked` (triggers back-off) and `fatal` (stops the run); `noStreak: true` keeps a failure out of the three-in-a-row check.

## Pacing

Neither site publishes unfollow limits, so the tools don't guess:

- About 2–3 seconds between unfollows, no caps by default.
- Pushback = Instagram replies "action blocked" or "rate limited", TikTok replies "too frequently" or "try again", or three real failures in a row.
- On pushback: pause (Instagram 15 minutes, TikTok 30 seconds; doubling each time, up to 4 hours), double the gap (up to 60 seconds), retry the same account. After 25 good unfollows in a row it eases back toward full speed.
- Settings are stored under `<id>_pacing` in localStorage (`igu` = Instagram, `tbu` = TikTok).

## TikTok lessons

- The web Following list stalls at 30 accounts because TikTok's scroll trigger never fires. The scan calls TikTok's own load-more callback, found in the list component's React hooks (`tiktokLoadMore`), and reads `hasMore`/`total` from its props (`tiktokListState`).
- TikTok flips the button to "Follow" before its server answers, and it can flip back. Count an unfollow only when the reply to `/api/commit/follow/user/?action_type=0` has `"status_code":0`. `watchCommits` records replies through fetch/XHR hooks, with a PerformanceObserver fallback. TikTok adds signature parameters after the fetch hook sees the URL, so prefer the record with a body.
- Empty server replies mean an ad blocker (uBlock Origin), a DNS filter (Technitium, Pi-hole) or tracking protection is blocking TikTok's scripts. After three empty replies in a row the run stops with a message saying so.
- After "Load last scan" the rows aren't on the page, so `unfollow` pages through TikTok's list until the account's row appears.
- Button labels are matched in English and Spanish ("Following"/"Siguiendo" = one-way, "Friends"/"Amigos" = mutual).

## Instagram lessons

- Profile picture links expire, so a saved scan shows letter avatars. A fresh Scan gets working pictures.
- If a scan stops early, Unfollow stays disabled so the user never acts on a partial list.

## Testing

- On `localhost`, the Instagram adapter runs in demo mode with fake accounts, and panel waits run 100× faster.
- TikTok has been tested on mock Following-list pages with a fake commit endpoint (confirmed, empty-reply, too-frequent, and saved-scan cases).
- Instagram's and TikTok's security settings block loading scripts from other sites, so live testing means using the bookmarklet or pasting the bundle into the page.
- Whitelists live in browser storage and can be wiped (embedded browsers lose them on restart). Check the "★ N" count before unfollowing.
