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

  socialUnfollower({
    id: "tbu",
    name: "TikTok Unfollower",
    startKey: "ttStart",
    filters: false,
    defaults: { delay: 4, restEvery: 10, restSeconds: 60, dailyLimit: 0 }, // no cap by default; set one in Settings if TikTok starts blocking
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
      // TikTok may re-render the list (or this is a cached scan), so find the button again if ours is gone
      let b = user.button && user.button.isConnected ? user.button : null;
      if (!b) {
        const fresh = followButtons(findDialog() || document).map(rowInfo).find((x) => x && x.username === user.username);
        b = fresh && fresh.button;
      }
      if (!b || !ONE_WAY.includes(label(b))) return { outcome: "failed", detail: "not in the open Following list" };
      b.scrollIntoView({ block: "center" });
      b.click();
      await new Promise((r) => setTimeout(r, 1500));
      return ONE_WAY.includes(label(b)) ? { outcome: "failed", detail: "button didn't change after clicking" } : { outcome: "unfollowed" };
    },
  });
})();
