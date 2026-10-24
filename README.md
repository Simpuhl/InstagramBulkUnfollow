# InstagramBulkUnfollow

A bookmarklet that finds the Instagram accounts you follow that don't follow you back, and lets you unfollow them in bulk. It runs entirely in your browser on instagram.com; nothing is sent anywhere else.

## Install

1. Open https://simpuhl.github.io/InstagramBulkUnfollow/.
2. Drag the **Unfollowers** button to your bookmarks bar.
3. Go to www.instagram.com, log in, and click the bookmark.

## Use

1. Click **Run Scan** and wait for it to finish.
2. Tick people one by one, or click **Select all non-followers** in the sidebar.
3. Click **Unfollow**.

Accounts on your whitelist are never selected. To add someone, click their avatar in the list.

## Limits

- Instagram may cut a scan short or block unfollows if you do too much at once. The script slows itself down: it waits 4 seconds between unfollows and 5 minutes after every 5. You can change these timings in Settings, at your own risk.
- If a scan is interrupted, the Unfollow button stays disabled so you don't act on a partial list.

## Develop

Edit `unfollowers.js`, then rebuild the install page:

```bash
node build.js
```

## Credits

Based on [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers) by David Arroyo, MIT licensed. See [LICENSE](LICENSE).
