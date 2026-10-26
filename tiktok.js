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
      while (idleRounds < 6 && !ctx.stopped()) {
        const before = seen.size;
        for (const b of followButtons(dialog)) {
          const u = rowInfo(b);
          if (u && !seen.has(u.username)) seen.set(u.username, u);
        }
        ctx.status(ctx.t("ttLoading", seen.size));
        // nudge every way TikTok might watch for "reached the bottom" so it loads the next batch
        const buttons = followButtons(dialog);
        if (buttons.length) buttons[buttons.length - 1].scrollIntoView({ block: "end" });
        box.scrollTop = box.scrollHeight;
        box.dispatchEvent(new Event("scroll"));
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800)); // real time even in demo mode: the list loads lazily
        idleRounds = seen.size === before ? idleRounds + 1 : 0;
      }
      return { users: [...seen.values()].filter((u) => ONE_WAY.includes(label(u.button))), partial: false };
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
