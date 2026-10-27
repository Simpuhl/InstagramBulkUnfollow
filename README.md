# Social Unfollower

Bookmarklets that find the accounts you follow that don't follow you back, and let you unfollow them in bulk. Works on **Instagram** and **TikTok**. A small panel opens in the corner of the site; everything runs in your own browser and nothing is sent anywhere else.

## Install

1. Open https://simpuhl.github.io/Social-Unfollower/.
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

It reads the button labels, so it works when TikTok is set to English or Spanish.

An unfollow only counts once TikTok's server confirms it, because TikTok flips the button to "Follow" before the server answers. If TikTok's server ignores the unfollows (it sends back empty replies), the tool stops and tells you, instead of reporting unfollows that didn't happen. That usually means an ad blocker (like uBlock Origin), a DNS filter (like Pi-hole or Technitium) or tracking protection is blocking TikTok's scripts; turn it off for tiktok.com and reload.

## Both tools

- **Whitelist:** click ★ next to someone, or tick people and click **Add to whitelist**. Whitelisted accounts are never selected or unfollowed. In ⚙ Settings you can export, import, paste usernames into, or clear the whitelist.
- **Search** the list, and **Copy list**, **JSON** or **CSV** to export who doesn't follow you back.
- **Load last scan** reopens your previous results without rescanning.
- **⚙ Settings:** time between unfollows, optional rest breaks, an optional daily cap (off by default), how long to pause when the site pushes back, and English/Spanish.

## Pacing

Neither Instagram nor TikTok publishes its unfollow limits, so the tools don't guess. They unfollow about every 2–3 seconds and slow down only when the site pushes back:

- **Pushback** means Instagram replies "action blocked" or "rate limited", TikTok's server replies "too frequently", or three unfollows in a row fail.
- Then the tool pauses (the first time 15 minutes on Instagram, 30 seconds on TikTok; doubling each time, up to 4 hours), doubles the gap between unfollows (up to 60 seconds), and retries where it stopped. After 25 good unfollows in a row it eases back toward full speed.

Going fast makes temporary blocks more likely. They usually last hours to a couple of days, and repeated blocks can last longer. For a gentler pace, raise the time between unfollows or add rest breaks in ⚙ Settings.

## Develop

`panel.js` is the shared panel; `instagram.js` and `tiktok.js` are the platform parts. After editing, rebuild the install page:

```bash
node build.js
```

On `localhost`, the Instagram tool runs in demo mode with fake accounts.

## Credits

`instagram.js` is based on [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) by David Arroyo, MIT licensed; its copyright notice is kept in [LICENSE](LICENSE). The panel and the TikTok tool are original to this project.
