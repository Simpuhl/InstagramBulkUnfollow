// Builds index.html (the drag-to-bookmarks page) from the bookmarklet scripts. Run: node build.js
const fs = require("fs");

function bookmarklet(file) {
  const code = fs.readFileSync(__dirname + "/" + file, "utf8").trim();
  new Function(code); // throws on a syntax error before we publish a broken bookmarklet
  return ("javascript:" + encodeURIComponent(code)).replace(/"/g, "%22");
}

const tools = [
  {
    name: "Instagram Unfollower",
    file: "instagram.js",
    steps: ["Open <b>www.instagram.com</b> and log in.", "Click the bookmark, then <b>Run Scan</b>."],
  },
  {
    name: "TikTok Unfollower",
    file: "tiktok.js",
    steps: [
      "Open <b>www.tiktok.com</b>, log in, and go to your profile.",
      "Click your <b>Following</b> count so the list opens.",
      "Click the bookmark, then <b>Scan</b>.",
    ],
  },
];

const cards = tools
  .map(
    (t) => `<section>
  <h2>${t.name}</h2>
  <p><a class="bm" href="${bookmarklet(t.file)}" onclick="alert('Drag me to your bookmarks bar first.');return false">${t.name}</a></p>
  <ol>${t.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
</section>`
  )
  .join("\n");

fs.writeFileSync(__dirname + "/index.html", `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Social Unfollower</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #f7f1e8; max-width: 44rem; margin: 4rem auto; padding: 0 16px; line-height: 1.6; }
  section { border: 1px solid rgba(247,241,232,.14); border-radius: 10px; padding: 1rem 1.5rem; margin: 1.5rem 0; background: rgba(255,255,255,.03); }
  h2 { margin-top: .5rem; }
  a.bm { display: inline-block; padding: .9rem 1.4rem; background: #e0a33a; color: #16130d; font-weight: 800; border-radius: 8px; text-decoration: none; cursor: grab; }
  a { color: #62d6d0; }
  li { margin: .3rem 0; }
  .muted { color: #ada79d; font-size: .9rem; }
</style>
</head>
<body>
<h1>Social Unfollower</h1>
<p>Find the accounts you follow that don't follow you back, and unfollow them in bulk. Show your bookmarks bar (Ctrl+Shift+B, or Cmd+Shift+B on Mac), then drag a button onto it.</p>
${cards}
<p class="muted">Everything runs in your own browser; nothing is sent anywhere else. Use at your own risk: unfollowing a lot at once can get your account temporarily blocked. Instagram tool based on <a href="https://github.com/davidarroyo1234/InstagramUnfollowers">InstagramUnfollowers</a> by David Arroyo (MIT).</p>
</body>
</html>
`);
console.log("index.html written");
