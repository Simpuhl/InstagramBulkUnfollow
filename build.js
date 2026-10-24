// Builds index.html (the drag-to-bookmarks page) from unfollowers.js. Run: node build.js
const fs = require("fs");

const code = fs.readFileSync(__dirname + "/unfollowers.js", "utf8").trim();
new Function(code); // throws on a syntax error before we publish a broken bookmarklet
const href = ("javascript:" + encodeURIComponent(code)).replace(/"/g, "%22");

fs.writeFileSync(__dirname + "/index.html", `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Instagram Bulk Unfollow</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #f7f1e8; max-width: 40rem; margin: 4rem auto; padding: 0 16px; line-height: 1.6; }
  a.bm { display: inline-block; padding: 1rem 1.5rem; background: #e0a33a; color: #16130d; font-weight: 800; border-radius: 8px; text-decoration: none; font-size: 1.1rem; cursor: grab; }
  a { color: #62d6d0; }
  li { margin: .4rem 0; }
</style>
</head>
<body>
<h1>Instagram Bulk Unfollow</h1>
<p>Drag this button to your bookmarks bar:</p>
<p><a class="bm" href="${href}" onclick="alert('Drag me to your bookmarks bar, then click it while on instagram.com');return false">Unfollowers</a></p>
<ol>
  <li>Show your bookmarks bar (Ctrl+Shift+B, or Cmd+Shift+B on Mac).</li>
  <li>Drag the button above onto it.</li>
  <li>Open <b>www.instagram.com</b> and log in.</li>
  <li>Click the bookmark.</li>
</ol>
<p>Based on <a href="https://github.com/davidarroyo1234/InstagramUnfollowers">InstagramUnfollowers</a> by David Arroyo (MIT). Use at your own risk: mass unfollowing can get your account temporarily blocked.</p>
</body>
</html>
`);
console.log("index.html written");
