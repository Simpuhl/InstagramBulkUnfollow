# Social Unfollower

Bookmarklets that find the accounts you follow that don't follow you back, and let you unfollow them in bulk. Works on **Instagram** and **TikTok**. A small panel opens in the corner of the site; everything runs in your own browser and nothing is sent anywhere else.

## Install

1. Open https://simpuhl.github.io/InstagramBulkUnfollow/.
2. Drag the **Instagram Unfollower** and/or **TikTok Unfollower** button to your bookmarks bar.

## Instagram

1. Go to www.instagram.com, log in, and click the bookmark.
2. Click **Scan** and wait for it to finish.
3. Tick people, or use **Select all non-followers** or the **+ Verified / + Private / + No pic** quick-selects.
4. Click **Unfollow**, then **Yes, unfollow** to confirm.

If a scan is interrupted, Unfollow stays off so you don't act on a partial list.

## TikTok

1. Go to www.tiktok.com, log in, and open your profile.
2. Click your **Following** count so the list opens.
3. Click the bookmark, then **Scan**. It scrolls the list and collects everyone whose button says "Following" (not "Friends").
4. Tick people or click **Select all non-followers**, then **Unfollow** and **Yes, unfollow**.

It reads the button labels, so it works when TikTok is set to English or Spanish. If the scan stops at 30 accounts, TikTok isn't loading more of the list in that browser: unfollow that batch, close and reopen your Following list, and scan again.

## Both tools

- **Whitelist:** click ★ next to someone, or tick people and click **Add to whitelist**. Whitelisted accounts are never selected or unfollowed. In ⚙ Settings you can export, import, paste usernames into, or clear the whitelist.
- **Search** the list, and **Copy list**, **JSON** or **CSV** to export who doesn't follow you back.
- **Load last scan** reopens your previous results without rescanning.
- **⚙ Settings:** time between unfollows, rest breaks, an optional daily cap (off by default), and English/Spanish.

Default pacing, to avoid temporary blocks from the platforms:
- Instagram: about 4 seconds between unfollows and a 5-minute rest after every 5.
- TikTok: about 4 seconds between unfollows and a 1-minute rest after every 10.

If the platform blocks an action, the tool stops and tells you.

## Develop

`panel.js` is the shared panel; `instagram.js` and `tiktok.js` are the platform parts. After editing, rebuild the install page:

```bash
node build.js
```

On `localhost`, the Instagram tool runs in demo mode with fake accounts.

## Credits

`instagram.js` is based on [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) by David Arroyo, MIT licensed; its copyright notice is kept in [LICENSE](LICENSE). The panel and the TikTok tool are original to this project.
