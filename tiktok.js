// TikTok adapter for the shared panel. Run it on tiktok.com with your own "Following" list open.
// It reads the list TikTok already shows: "Friends" = you follow each other, "Following" = they don't follow back.
(() => {
  const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (!/(^|\.)tiktok\.com$/.test(location.hostname) && !isDev) {
    alert("Open tiktok.com first, then click this bookmark.");
    return;
  }

  const MUTUAL = ["friends", "amigos"];
  const ONE_WAY = ["following", "siguiendo"];

  const label = (button) => button.textContent.trim().toLowerCase();
  const followButtons = (root) =>
    [...root.querySelectorAll("button")].filter((b) => !b.closest("#su-panel") && [...MUTUAL, ...ONE_WAY].includes(label(b)));
  // other popups (like the inbox) are dialogs too, so pick the one that holds the Following list
  const findDialog = () => [...document.querySelectorAll('[role="dialog"]')].find((d) => followButtons(d).length);

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

  // TikTok's own "load next page" callback for this list. Its scroll trigger often never fires (the list
  // stops at 30), so we find the callback on the list's React component and call it ourselves.
  function tiktokLoadMore(box) {
    const fiberKey = Object.keys(box).find((k) => k.startsWith("__reactFiber"));
    for (let f = fiberKey && box[fiberKey], i = 0; f && i < 6; i++, f = f.return) {
      for (let h = f.memoizedState, j = 0; h && j < 100; j++, h = h.next) {
        const v = h.memoizedState;
        if (Array.isArray(v) && typeof v[0] === "function" && /get\w*Following\w*List/.test(String(v[0]))) return v[0];
      }
    }
    return null;
  }
  // { hasMore, total } from the same component, so the scan knows whether TikTok has more to send
  function tiktokListState(box) {
    const fiberKey = Object.keys(box).find((k) => k.startsWith("__reactFiber"));
    for (let f = fiberKey && box[fiberKey], i = 0; f && i < 6; i++, f = f.return) {
      const p = f.memoizedProps;
      if (p && typeof p.hasMore === "boolean") return { hasMore: p.hasMore, total: Number(p.total) || 0 };
    }
    return null;
  }

  // Records TikTok's follow/unfollow requests and their replies in window.__suCommits. Fetch/XHR hooks give the
  // reply body; the PerformanceObserver catches the request even if TikTok's code bypasses the hooks (size only).
  let emptyReplies = 0;
  function watchCommits() {
    if (window.__suCommits) return;
    const commits = (window.__suCommits = []);
    const isCommit = (url) => /\/api\/commit\/follow\/user\//.test(url);
    const record = (url, fields) => {
      const entry = commits.find((c) => c.url === url && c.at > Date.now() - 15000);
      entry ? Object.assign(entry, fields) : commits.push({ url, at: Date.now(), ...fields });
    };
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const res = await origFetch.apply(this, args);
      const url = new URL(String(args[0] && args[0].url ? args[0].url : args[0]), location.href).href;
      if (isCommit(url)) res.clone().text().then((text) => record(url, { text }), () => record(url, { text: "" }));
      return res;
    };
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      if (isCommit(String(url))) this.addEventListener("loadend", () => record(new URL(url, location.href).href, { text: this.responseText || "" }));
      return open.call(this, method, url, ...rest);
    };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (isCommit(e.name)) record(e.name, { size: e.decodedBodySize });
    }).observe({ type: "resource", buffered: false });
  }

  socialUnfollower({
    id: "tbu",
    name: "TikTok Unfollower",
    site: "TikTok",
    startKey: "ttStart",
    filters: false,
    defaults: { delay: 2, restEvery: 0, restSeconds: 60, dailyLimit: 0, backoffSeconds: 30 }, // fast; the panel backs off when TikTok pushes back
    profileUrl: (u) => `/@${u.username}`,

    async scan(ctx) {
      const dialog = findDialog();
      if (!dialog) throw new Error(ctx.t("ttNoList"));
      const box = scrollBox(dialog);
      const seen = new Map();
      let idleRounds = 0;
      let state = null;
      // TikTok can pause a minute or more between pages. While it says there's more, wait up to ~3 minutes
      // of no growth; if we can't read its state (e.g. after a TikTok update), give up after ~25s.
      while (!ctx.stopped() && idleRounds < (state && state.hasMore ? 90 : 12)) {
        const before = seen.size;
        for (const b of followButtons(dialog)) {
          const u = rowInfo(b);
          if (u && !seen.has(u.username)) seen.set(u.username, u);
        }
        state = tiktokListState(box);
        if (state && !state.hasMore) break;
        ctx.status(
          idleRounds > 12 && state
            ? ctx.t("ttWaiting", seen.size, state.total)
            : state ? ctx.t("ttLoadingOf", seen.size, state.total) : ctx.t("ttLoading", seen.size)
        );
        // nudge every way TikTok might watch for "reached the bottom" so it loads the next batch
        const buttons = followButtons(dialog);
        if (buttons.length) buttons[buttons.length - 1].scrollIntoView({ block: "end" });
        box.scrollTop = box.scrollHeight;
        box.dispatchEvent(new Event("scroll"));
        try {
          tiktokLoadMore(box)?.(); // looked up each round: TikTok recreates it as the list grows
        } catch (e) {
          console.warn("TikTok load-more failed:", e);
        }
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800)); // real time even in demo mode: the list loads lazily
        idleRounds = seen.size === before ? idleRounds + 1 : 0;
      }
      const users = [...seen.values()].filter((u) => ONE_WAY.includes(label(u.button)));
      // Everyone found is a confirmed non-follower, so an incomplete list still allows unfollowing; just say so.
      const note = state && state.hasMore && !ctx.stopped() ? ctx.t("ttIncomplete", users.length, seen.size, state.total) : undefined;
      return { users, partial: false, note };
    },

    async unfollow(user, ctx) {
      watchCommits();
      // TikTok may re-render the list (or this is a cached scan), so find the button again if ours is gone
      let b = user.button && user.button.isConnected ? user.button : null;
      if (!b) {
        const fresh = followButtons(findDialog() || document).map(rowInfo).find((x) => x && x.username === user.username);
        b = fresh && fresh.button;
      }
      // after a rejected unfollow TikTok shows "Follow" for a moment before flipping back; wait for that on a retry
      for (let i = 0; i < 20 && b && !ONE_WAY.includes(label(b)); i++) await new Promise((r) => setTimeout(r, 200));
      if (!b || !ONE_WAY.includes(label(b))) return { outcome: "failed", detail: "not in the open Following list" };
      b.scrollIntoView({ block: "center" });
      const since = Date.now();
      b.click();

      // The button flips to "Follow" before TikTok's server answers, so judge by the server's reply instead.
      let reply;
      for (let i = 0; i < 40 && !reply; i++) {
        await new Promise((r) => setTimeout(r, 200));
        reply = window.__suCommits.find((c) => c.at >= since && /[?&]action_type=0\b/.test(c.url) && (c.text !== undefined || c.size !== undefined));
      }
      if (!reply) return { outcome: "failed", detail: "TikTok didn't send an unfollow request after the click" };
      if (reply.text === undefined) await new Promise((r) => setTimeout(r, 500)); // body may arrive just after the timing entry
      const text = reply.text;
      if (text === "" || (text === undefined && reply.size === 0)) {
        // an empty reply means TikTok's server ignored the request (it does this when it treats the browser as a bot)
        emptyReplies++;
        return emptyReplies >= 3 ? { outcome: "fatal", detail: ctx.t("ttRejected") } : { outcome: "failed", detail: "TikTok sent an empty reply" };
      }
      emptyReplies = 0;
      let json = null;
      try { json = JSON.parse(text); } catch {}
      if (json && json.status_code === 0) return { outcome: "unfollowed" };
      if (!json) {
        // only the request's size was visible: trust it if the button stayed flipped
        await new Promise((r) => setTimeout(r, 1500));
        return ONE_WAY.includes(label(b)) ? { outcome: "failed", detail: "button flipped back" } : { outcome: "unfollowed" };
      }
      const msg = `${json.status_code}: ${json.status_msg || ""}`;
      return /limit|frequent|too fast|too many|try again|later|slow/i.test(msg) ? { outcome: "blocked", detail: msg } : { outcome: "failed", detail: msg };
    },
  });
})();
