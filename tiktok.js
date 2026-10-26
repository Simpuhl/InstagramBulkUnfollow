// TikTok non-follower finder. Run it on tiktok.com with your own "Following" list open.
// It reads the list TikTok already shows: "Friends" = you follow each other, "Following" = they don't follow back.
(() => {
  const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (!/(^|\.)tiktok\.com$/.test(location.hostname) && !isDev) {
    alert("Open tiktok.com first, then click this bookmark.");
    return;
  }
  if (document.getElementById("tbu-panel")) return;

  const WHITELIST_KEY = "tbu_whitelist";
  const DAILY_KEY = "tbu_daily";
  const DAILY_LIMIT = 150; // TikTok temp-blocks somewhere around a few hundred unfollows a day
  const MUTUAL = ["friends", "amigos"];
  const ONE_WAY = ["following", "siguiendo"];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  let whitelist = new Set(load(WHITELIST_KEY, []));
  let users = []; // { username, name, avatar, button, result }
  let selected = new Set();
  let busy = false;
  let stopRequested = false;
  let message = 'Open your profile, click your "Following" count, then press Scan.';

  const label = (button) => button.textContent.trim().toLowerCase();
  const findDialog = () => document.querySelector('[role="dialog"]');
  const followButtons = (root) =>
    [...root.querySelectorAll("button")].filter((b) => !b.closest("#tbu-panel") && [...MUTUAL, ...ONE_WAY].includes(label(b)));

  function rowInfo(button) {
    let row = button;
    while (row && !row.querySelector('a[href*="/@"]')) row = row.parentElement;
    if (!row) return null;
    const href = row.querySelector('a[href*="/@"]').getAttribute("href");
    const username = decodeURIComponent(href.split("/@")[1].split(/[/?#]/)[0]);
    const img = row.querySelector("img");
    const name = [...row.querySelectorAll("p, span, h3, h4")]
      .map((t) => t.textContent.trim())
      .find((t) => t && t !== username && !t.startsWith("@") && t.toLowerCase() !== label(button));
    return { username, name: name || "", avatar: img ? img.src : "", button };
  }

  function scrollBox(dialog) {
    return (
      [...dialog.querySelectorAll("*")].find(
        (el) => el.scrollHeight > el.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)
      ) || dialog
    );
  }

  function todayCount() {
    const d = load(DAILY_KEY, {});
    return d.date === new Date().toDateString() ? d.count : 0;
  }
  function bumpToday() {
    save(DAILY_KEY, { date: new Date().toDateString(), count: todayCount() + 1 });
  }

  async function scan() {
    const dialog = findDialog();
    if (!dialog) {
      alert('Open your TikTok profile and click your "Following" count first, then press Scan.');
      return;
    }
    busy = true;
    stopRequested = false;
    const box = scrollBox(dialog);
    const seen = new Map();
    let idleRounds = 0;
    while (idleRounds < 6 && !stopRequested) {
      const before = seen.size;
      for (const b of followButtons(dialog)) {
        const u = rowInfo(b);
        if (u && !seen.has(u.username)) seen.set(u.username, u);
      }
      message = `Loading your Following list… ${seen.size} accounts so far`;
      render();
      // nudge every way TikTok might watch for "reached the bottom" so it loads the next batch
      const buttons = followButtons(dialog);
      if (buttons.length) buttons[buttons.length - 1].scrollIntoView({ block: "end" });
      box.scrollTop = box.scrollHeight;
      box.dispatchEvent(new Event("scroll"));
      await sleep(1200 + Math.random() * 800);
      idleRounds = seen.size === before ? idleRounds + 1 : 0;
    }
    users = [...seen.values()].filter((u) => ONE_WAY.includes(label(u.button)));
    selected = new Set();
    busy = false;
    message = `${seen.size} accounts checked. ${users.length} don't follow you back.`;
    render();
  }

  async function unfollow() {
    const queue = users.filter((u) => selected.has(u.username) && !whitelist.has(u.username) && u.result !== "done");
    if (!queue.length) return alert("Tick at least one account first.");
    if (!confirm(`Unfollow ${queue.length} accounts? This goes slowly to avoid TikTok blocks.`)) return;
    busy = true;
    stopRequested = false;
    let done = 0;
    for (const u of queue) {
      if (stopRequested) break;
      if (todayCount() >= DAILY_LIMIT) {
        message = `Stopped: reached ${DAILY_LIMIT} unfollows today. Continue tomorrow to avoid a TikTok block.`;
        break;
      }
      // TikTok may re-render the list, so find the button again if ours was replaced
      let b = u.button;
      if (!b.isConnected) {
        const fresh = followButtons(findDialog() || document).map(rowInfo).find((x) => x && x.username === u.username);
        b = fresh && fresh.button;
      }
      if (!b || !ONE_WAY.includes(label(b))) {
        u.result = "failed";
        render();
        continue;
      }
      b.scrollIntoView({ block: "center" });
      b.click();
      await sleep(1500);
      u.result = ONE_WAY.includes(label(b)) ? "failed" : "done";
      if (u.result === "done") {
        bumpToday();
        done++;
        selected.delete(u.username);
      }
      message = `Unfollowing… ${done}/${queue.length}`;
      render();
      await sleep(4000 + Math.random() * 4000);
      if (done > 0 && done % 10 === 0) {
        message = `Unfollowed ${done}. Resting 60 seconds so TikTok doesn't block you…`;
        render();
        await sleep(60000);
      }
    }
    busy = false;
    if (!message.startsWith("Stopped")) message = `Done. Unfollowed ${done} of ${queue.length}.`;
    render();
  }

  function toggleWhitelist(names, on) {
    names.forEach((n) => (on ? whitelist.add(n) : whitelist.delete(n)));
    names.forEach((n) => selected.delete(n));
    save(WHITELIST_KEY, [...whitelist]);
    render();
  }

  const panel = document.createElement("div");
  panel.id = "tbu-panel";
  panel.innerHTML = `<style>
    #tbu-panel{position:fixed;top:16px;right:16px;width:min(380px,calc(100vw - 32px));max-height:calc(100vh - 32px);display:flex;flex-direction:column;z-index:2147483647;background:#1a1916;color:#f7f1e8;border:1px solid rgba(247,241,232,.14);border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.5);font:14px/1.4 system-ui,sans-serif}
    #tbu-panel *{box-sizing:border-box}
    #tbu-panel header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(247,241,232,.12);font-weight:800}
    #tbu-panel .tbu-msg{padding:10px 14px;color:#ada79d;font-size:13px}
    #tbu-panel .tbu-actions{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}
    #tbu-panel button{font:inherit;font-size:12px;font-weight:700;padding:7px 10px;border-radius:7px;border:1px solid rgba(247,241,232,.14);background:rgba(255,255,255,.06);color:#f7f1e8;cursor:pointer}
    #tbu-panel button:hover:not(:disabled){border-color:rgba(224,163,58,.5)}
    #tbu-panel button:disabled{opacity:.4;cursor:not-allowed}
    #tbu-panel button.tbu-primary{background:#e0a33a;color:#16130d;border-color:#e0a33a}
    #tbu-panel button.tbu-danger{background:#ef6a62;color:#1c0d0b;border-color:#ef6a62}
    #tbu-panel ul{list-style:none;margin:0;padding:0 8px 8px;overflow-y:auto}
    #tbu-panel li{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:7px}
    #tbu-panel li:hover{background:rgba(255,255,255,.05)}
    #tbu-panel li img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#333}
    #tbu-panel li .tbu-who{flex:1;min-width:0}
    #tbu-panel li a{color:#f7f1e8;font-weight:700;text-decoration:none}
    #tbu-panel li small{display:block;color:#ada79d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #tbu-panel li.tbu-wl a{color:#e0a33a}
    #tbu-panel .tbu-star{background:none;border:none;font-size:18px;padding:2px 4px;color:#555}
    #tbu-panel .tbu-wl .tbu-star{color:#e0a33a}
    #tbu-panel .tbu-done{color:#8ccf7e;font-size:12px}
    #tbu-panel .tbu-failed{color:#ef6a62;font-size:12px}
    #tbu-panel input[type=checkbox]{width:18px;height:18px;accent-color:#e0a33a}
  </style><div class="tbu-body" style="display:contents"></div>`;
  document.body.appendChild(panel);
  const body = panel.querySelector(".tbu-body");

  function render() {
    const active = users.filter((u) => !whitelist.has(u.username));
    const wl = users.filter((u) => whitelist.has(u.username));
    const row = (u) => {
      const isWl = whitelist.has(u.username);
      const result = u.result ? `<span class="tbu-${u.result}">${u.result === "done" ? "Unfollowed" : "Failed"}</span>` : "";
      return `<li class="${isWl ? "tbu-wl" : ""}">
        <input type="checkbox" data-user="${esc(u.username)}" ${selected.has(u.username) ? "checked" : ""} ${busy || u.result === "done" ? "disabled" : ""}>
        <img src="${esc(u.avatar)}" alt="">
        <div class="tbu-who"><a href="/@${esc(u.username)}" target="_blank" rel="noreferrer">@${esc(u.username)}</a><small>${esc(u.name)}</small></div>
        ${result}
        <button class="tbu-star" data-action="star" data-user="${esc(u.username)}" title="${isWl ? "Remove from whitelist" : "Add to whitelist"}">★</button>
      </li>`;
    };
    body.innerHTML = `
      <header><span>TikTok Unfollowers · ${active.length} not following back</span><button data-action="close" title="Close">✕</button></header>
      <div class="tbu-msg">${esc(message)} <span style="opacity:.7">(${todayCount()}/${DAILY_LIMIT} unfollows today)</span></div>
      <div class="tbu-actions">
        <button class="tbu-primary" data-action="scan" ${busy ? "disabled" : ""}>Scan</button>
        <button data-action="all" ${busy || !active.length ? "disabled" : ""}>Select all non-followers</button>
        <button data-action="none" ${busy || !selected.size ? "disabled" : ""}>Clear</button>
        <button data-action="wl-add" ${busy || !selected.size ? "disabled" : ""}>Add to whitelist (${selected.size})</button>
        <button class="tbu-danger" data-action="unfollow" ${busy || !selected.size ? "disabled" : ""}>Unfollow (${selected.size})</button>
        ${busy ? '<button data-action="stop">Stop</button>' : ""}
      </div>
      <ul>${active.map(row).join("")}${wl.length ? `<li style="color:#ada79d;font-size:12px;font-weight:800">WHITELISTED (${wl.length})</li>` + wl.map(row).join("") : ""}</ul>`;
  }

  panel.addEventListener("change", (e) => {
    const name = e.target.dataset.user;
    if (!name) return;
    e.target.checked ? selected.add(name) : selected.delete(name);
    render();
  });
  panel.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    const name = e.target.closest("[data-user]")?.dataset.user;
    if (action === "close") { stopRequested = true; panel.remove(); }
    if (action === "stop") { stopRequested = true; message = "Stopping…"; render(); }
    if (action === "scan") scan();
    if (action === "unfollow") unfollow();
    if (action === "all") { users.forEach((u) => !whitelist.has(u.username) && u.result !== "done" && selected.add(u.username)); render(); }
    if (action === "none") { selected = new Set(); render(); }
    if (action === "wl-add") toggleWhitelist([...selected], true);
    if (action === "star") toggleWhitelist([name], !whitelist.has(name));
  });

  render();
})();
