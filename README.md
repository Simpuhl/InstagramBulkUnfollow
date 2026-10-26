# Social Unfollower

Bookmarklets that find the accounts you follow that don't follow you back, and let you unfollow them in bulk. Works on **Instagram** and **TikTok**. Everything runs in your own browser; nothing is sent anywhere else.

## Install

1. Open https://simpuhl.github.io/InstagramBulkUnfollow/.
2. Drag the **Instagram Unfollower** and/or **TikTok Unfollower** button to your bookmarks bar.

## Instagram

1. Go to www.instagram.com, log in, and click the bookmark.
2. Click **Run Scan** and wait for it to finish.
3. Tick people one by one, or click **Select all non-followers** in the sidebar.
4. Click **Unfollow**.

To protect someone, tick them and click **Add to Whitelist**, or click their avatar. Whitelisted accounts are never selected.

Instagram may cut a scan short or block unfollows if you do too much at once. The script waits 4 seconds between unfollows and 5 minutes after every 5. You can change this in Settings, at your own risk. If a scan is interrupted, Unfollow stays disabled so you don't act on a partial list.

## TikTok

1. Go to www.tiktok.com, log in, and open your profile.
2. Click your **Following** count so the list opens.
3. Click the bookmark, then **Scan**. It scrolls the list and collects everyone whose button says "Following" (not "Friends").
4. Tick people, or click **Select all non-followers**, then **Unfollow**.

Click the ★ next to someone, or tick them and click **Add to whitelist**, to protect them.

TikTok blocks accounts that unfollow too fast, so this tool waits 4–8 seconds between unfollows, rests 60 seconds after every 10, and stops at 150 a day. It reads the button labels, so it works when TikTok is set to English or Spanish.

If the scan stops at 30 accounts, TikTok isn't loading more of the list in that browser. Unfollow that batch, close and reopen your Following list, and scan again to get the next 30.

## Develop

Edit `instagram.js` or `tiktok.js`, then rebuild the install page:

```bash
node build.js
```

## Credits

`instagram.js` is based on [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) by David Arroyo, MIT licensed; its copyright notice is kept in [LICENSE](LICENSE). The TikTok tool is original to this project.
