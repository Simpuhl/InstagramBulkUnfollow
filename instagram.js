// Instagram adapter for the shared panel. Run it on www.instagram.com while logged in.
// The scan and unfollow requests are adapted from InstagramUnfollowers by David Arroyo (MIT, see LICENSE).
(() => {
  const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (location.hostname !== "www.instagram.com" && !isDev) {
    alert("Open www.instagram.com first, then click this bookmark.");
    return;
  }

  const APP_ID = "936619743392459";
  const ASBD_ID = "129477";
  const UNFOLLOW_DOC_ID = "27789106940691111";
  const UNFOLLOW_NAME = "usePolarisUnfollowMutation";
  const PAGE_SIZE = 50;
  const PAGE_CAP = 2000; // only guards against an endless loop (~100,000 accounts per list)
  const NO_PIC_IDS = ["44884218_345707102882519_2446069589734326272_n", "464760996_1254146839119862_3605321457742435801_n"];

  const cookie = (name) => {
    const parts = `; ${document.cookie}`.split(`; ${name}=`);
    return parts.length === 2 ? parts.pop().split(";").shift() : null;
  };
  const userId = (u) => String(u.pk ?? u.pk_id ?? u.id);

  class ApiError extends Error {
    constructor(status, msg) {
      super(msg);
      this.status = status;
    }
  }
  const headers = () => ({
    "X-IG-App-ID": APP_ID,
    "X-ASBD-ID": ASBD_ID,
    "X-Requested-With": "XMLHttpRequest",
    "X-CSRFToken": cookie("csrftoken") || "",
    Accept: "*/*",
  });
  async function getJson(url) {
    const res = await fetch(url, { credentials: "same-origin", headers: headers() });
    if (!res.ok) throw new ApiError(res.status, `Instagram returned HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === "fail" || (!data.users && data.message)) throw new ApiError(res.status, data.message || "Instagram returned a failure");
    return data;
  }

  async function getPage(ctx, myId, kind, maxId) {
    const url =
      `https://www.instagram.com/api/v1/friendships/${myId}/${kind}/?count=${PAGE_SIZE}` +
      (maxId ? `&max_id=${encodeURIComponent(maxId)}` : "");
    for (let attempt = 1; ; attempt++) {
      try {
        return await getJson(url);
      } catch (e) {
        const limited = e.status === 429 || /feedback_required|checkpoint|rate limit|please wait/i.test(e.message);
        if (!(limited || e instanceof TypeError) || attempt > 3) throw e;
        for (let s = (limited ? 30 : 5) * attempt; s > 0 && !ctx.stopped(); s--) {
          ctx.status(ctx.t("igSlowDown", s));
          await ctx.sleep(1000);
        }
      }
    }
  }

  // Reads a whole followers/following list. Returns false if it stopped early.
  async function walk(ctx, myId, kind, onUsers) {
    let maxId;
    for (let pages = 1; !ctx.stopped(); pages++) {
      const page = await getPage(ctx, myId, kind, maxId);
      const list = page.users || [];
      onUsers(list);
      if (!page.next_max_id || page.has_more === false || !list.length) return true;
      if (pages >= PAGE_CAP) return false;
      maxId = page.next_max_id;
      await ctx.sleep(1000 + Math.random() * 700);
      if (pages % 15 === 0) {
        ctx.status(ctx.t("igPause"));
        await ctx.sleep(10000 + Math.random() * 5000);
      }
    }
    return false;
  }

  let tokens = null;
  function parseTokens(html) {
    const dtsg = (/"DTSGInitialData",\[\],\{"token":"([^"]+)"/.exec(html) || /"dtsg":\{"token":"([^"]+)"/.exec(html) || [])[1];
    const lsd = (/"LSD",\[\],\{"token":"([^"]+)"/.exec(html) || [])[1];
    return dtsg && lsd ? { fbDtsg: dtsg, lsd, rev: (/"client_revision":(\d+)/.exec(html) || [])[1] } : null;
  }
  async function sessionTokens() {
    if (tokens) return tokens;
    try {
      if (typeof window.require === "function") {
        const dtsg = window.require("DTSGInitialData")?.token;
        const lsd = window.require("LSD")?.token;
        if (dtsg && lsd) return (tokens = { fbDtsg: dtsg, lsd, rev: String(window.require("SiteData")?.client_revision ?? "") || undefined });
      }
    } catch {}
    tokens = parseTokens(document.documentElement.innerHTML);
    if (!tokens) {
      try {
        tokens = parseTokens(await (await fetch("https://www.instagram.com/", { credentials: "same-origin" })).text());
      } catch (e) {
        console.warn("Could not load Instagram session tokens:", e);
      }
    }
    return tokens;
  }
  const jazoest = (s) => "2" + [...s].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  function findFriendship(obj) {
    if (obj === null || typeof obj !== "object") return undefined;
    if (obj.friendship_status && typeof obj.friendship_status === "object") return obj.friendship_status;
    for (const v of Object.values(obj)) {
      const found = findFriendship(v);
      if (found !== undefined) return found;
    }
  }
  // true = still following, false = not, null = couldn't tell
  async function stillFollowing(user) {
    const myId = cookie("ds_user_id");
    if (!myId) return null;
    try {
      const data = await getJson(
        `https://www.instagram.com/api/v1/friendships/${myId}/following/?count=12&query=${encodeURIComponent(user.username)}&search_surface=follow_list_page`
      );
      return (data.users || []).some((u) => userId(u) === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    } catch (e) {
      console.warn(`Could not verify unfollow of ${user.username}:`, e);
      return null;
    }
  }

  const toUser = (u) => ({
    id: userId(u),
    username: u.username,
    name: u.full_name || "",
    avatar: u.profile_pic_url || "",
    verified: Boolean(u.is_verified),
    isPrivate: Boolean(u.is_private),
    noPic: !u.profile_pic_url || NO_PIC_IDS.some((id) => u.profile_pic_url.includes(id)),
  });
  const fakeUsers = () =>
    ["alina.frames", "brassandbone", "dawnledger", "elias.market", "fieldnotes.studio", "harbor.sequence", "inkline.daily", "juniper.signal", "keystone.labs", "lowlight.club"].map(
      (username, i) => ({ id: String(i + 1), username, name: `Demo ${i + 1}`, avatar: "", verified: i % 4 === 0, isPrivate: i % 3 === 0, noPic: i % 5 === 0 })
    );

  socialUnfollower({
    id: "igu",
    name: "Instagram Unfollower",
    site: "Instagram",
    filters: true,
    defaults: { delay: 2, restEvery: 0, restSeconds: 60, dailyLimit: 0, backoffMinutes: 15 }, // fast; the panel backs off when Instagram pushes back
    profileUrl: (u) => `/${u.username}/`,
    // whitelist saved by the previous full-page version (user objects)
    legacyWhitelist() {
      try {
        const old = JSON.parse(localStorage.getItem("iu_whitelisted-results")) || [];
        return old.map((u) => u && u.username && u.username.toLowerCase()).filter(Boolean);
      } catch {
        return [];
      }
    },

    async scan(ctx) {
      if (ctx.isDev) return { users: fakeUsers(), partial: false };
      const myId = cookie("ds_user_id");
      if (!myId) throw new Error(ctx.t("igNotLoggedIn"));
      const ids = new Set();
      const names = new Set();
      let followers = 0;
      const gotFollowers = await walk(ctx, myId, "followers", (list) => {
        for (const u of list) {
          ids.add(userId(u));
          names.add(u.username.toLowerCase());
        }
        followers += list.length;
        ctx.status(ctx.t("igFollowers", followers));
      });
      // without the full followers list we'd wrongly flag people who do follow you
      if (!gotFollowers) throw new Error(ctx.t("igFollowersIncomplete"));
      const users = [];
      let checked = 0;
      const gotFollowing = await walk(ctx, myId, "following", (list) => {
        for (const u of list) {
          checked++;
          if (!ids.has(userId(u)) && !names.has(u.username.toLowerCase())) users.push(toUser(u));
        }
        ctx.status(ctx.t("igChecking", checked, users.length));
      });
      return { users, partial: !gotFollowing };
    },

    async unfollow(user, ctx) {
      if (ctx.isDev) return { outcome: "unfollowed" };
      const t = await sessionTokens();
      if (!t) return { outcome: "failed", detail: "could not find Instagram's session tokens on the page" };
      const body = {
        av: cookie("ds_user_id") || "",
        __d: "www",
        __user: "0",
        __a: "1",
        __comet_req: "7",
        fb_dtsg: t.fbDtsg,
        jazoest: jazoest(t.fbDtsg),
        lsd: t.lsd,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: UNFOLLOW_NAME,
        variables: JSON.stringify({ target_user_id: user.id, container_module: "profile", nav_chain: "PolarisProfilePostsTabRoot:profilePage:1:via_cold_start" }),
        server_timestamps: "true",
        doc_id: UNFOLLOW_DOC_ID,
      };
      if (t.rev) body.__rev = body.__spin_r = t.rev;
      const res = await fetch("https://www.instagram.com/api/graphql", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-csrftoken": cookie("csrftoken") || "",
          "x-fb-friendly-name": UNFOLLOW_NAME,
          "x-fb-lsd": t.lsd,
          "x-ig-app-id": APP_ID,
          "x-asbd-id": ASBD_ID,
        },
        body: new URLSearchParams(body).toString(),
      });
      const text = await res.text().catch(() => "");
      let json = null;
      try { json = JSON.parse(text.replace(/^for \(;;\);/, "")); } catch {}
      const errors = JSON.stringify(json?.errors ?? json?.error ?? "") + ` ${json?.message ?? ""} ${json?.errorSummary ?? ""}`;
      if (res.status === 429 || json?.spam === true || /feedback_required|checkpoint|action_blocked|try again later|rate limit/i.test(errors)) {
        return { outcome: "blocked", detail: `HTTP ${res.status}: ${errors.trim()}` };
      }
      if (!res.ok || !json || json.errors || json.error || json.status === "fail" || !json.data) {
        return { outcome: "failed", detail: `HTTP ${res.status}: ${(json ? JSON.stringify(json) : text).slice(0, 300)}` };
      }
      const friendship = findFriendship(json.data);
      if (friendship && (friendship.following === true || friendship.outgoing_request === true)) {
        return { outcome: "failed", detail: "Instagram still shows you following this account" };
      }
      const still = await stillFollowing(user);
      if (still === true) return { outcome: "failed", detail: "account is still in your following list" };
      if (still === false || (friendship && friendship.following === false)) return { outcome: "unfollowed" };
      return { outcome: "failed", detail: "Instagram answered but the unfollow couldn't be confirmed" };
    },
  });
})();
