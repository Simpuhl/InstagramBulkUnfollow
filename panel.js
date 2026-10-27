// Shared corner panel for the Social Unfollower bookmarklets. build.js bundles it in front of each platform script.
// platform: { id, name, site, startKey, filters, defaults: { delay, restEvery, restSeconds, dailyLimit, backoffMinutes },
//             profileUrl(user), scan(ctx) -> { users, partial, note? }, unfollow(user, ctx) -> { outcome, detail }, legacyWhitelist?() }
function socialUnfollower(platform) {
  if (document.getElementById("su-panel")) return;

  const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);
  const pace = isDev ? 0.01 : 1; // demo mode on localhost runs the waits fast
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms * pace));
  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const key = (name) => `${platform.id}_${name}`;

  const STRINGS = {
    en: {
      notFollowing: "%s not following back",
      scan: "Scan", stop: "Stop", stopping: "Stopping…", loadLast: "Load last scan",
      selectAll: "Select all non-followers", selectShown: "Select all shown", clear: "Clear",
      selVerified: "+ Verified", selPrivate: "+ Private", selNoPic: "+ No pic",
      addWl: "Add to whitelist (%s)", unfollowN: "Unfollow (%s)", yesUnfollow: "Yes, unfollow %s", cancel: "Cancel",
      search: "Search users…", show: "Show:", verified: "Verified", private: "Private", noPic: "No pic",
      whitelisted: "WHITELISTED (%s)", unfollowed: "Unfollowed", failed: "Failed",
      copy: "Copy list", copied: "Copied %s usernames.", copyFailed: "Your browser blocked copying. Use JSON or CSV instead.",
      settings: "Settings", back: "Back", save: "Save", saved: "Settings saved.",
      delay: "Seconds between unfollows", restEvery: "Rest after every N unfollows (0 = never)", restSeconds: "Rest length in seconds",
      dailyLimit: "Max unfollows per day (0 = no limit)", language: "Language",
      backoffMinutes: "First pause when the site pushes back (minutes)",
      riskNote: "Unfollows run at this pace until the site pushes back; then it pauses (longer each time) and continues slower. Going fast makes temporary blocks more likely. Use at your own risk.",
      wlTitle: "Whitelist: %s accounts", wlExport: "Export", wlImport: "Import", wlPaste: "Add pasted usernames",
      wlPastePh: "Paste usernames, separated by spaces, commas or new lines",
      wlClear: "Clear whitelist", wlClearYes: "Yes, clear %s", wlAdded: "Added %s accounts to the whitelist.",
      wlBadFile: "That file isn't a whitelist export.", wlCleared: "Whitelist cleared.",
      today: "%s/%s unfollows today",
      start: "Press Scan to find accounts that don't follow you back.",
      scanDone: "Done. %s accounts don't follow you back.",
      scanPartial: "Scan stopped early: %s found so far. Unfollow is off until a full scan finishes.",
      scanFailed: "Scan failed: %s", scanStopped: "Scan stopped.",
      loadedCache: "Loaded scan from %s: %s accounts. Rescan if it's old.",
      unfollowing: "Unfollowing… %s/%s", resting: "Unfollowed %s. Resting %ss so you don't get blocked…",
      backingOff: "%s pushed back after %s of %s. Pausing %s, then continuing slower (about %ss between unfollows)…",
      dailyHit: "Stopped: reached %s unfollows today. Continue tomorrow.",
      unfollowDone: "Done. Unfollowed %s of %s.", unfollowStopped: "Stopped. Unfollowed %s of %s.",
      igNotLoggedIn: "You don't seem to be logged in. Log in to Instagram, then press Scan.",
      igFollowers: "Reading your followers… %s", igChecking: "Checking who you follow… %s checked, %s don't follow back",
      igSlowDown: "Instagram asked us to slow down. Retrying in %ss…", igPause: "Short pause so Instagram doesn't block you…",
      igFollowersIncomplete: "couldn't read your whole followers list",
      ttStart: 'Open your profile, click your "Following" count, then press Scan.',
      ttNoList: 'couldn\'t find your Following list. Open your profile and click your "Following" count first',
      ttLoading: "Loading your Following list… %s accounts so far",
      ttLoadingOf: "Loading your Following list… %s of %s",
      ttWaiting: "TikTok is pausing before the next batch. Still waiting… (%s of %s loaded)",
      ttIncomplete: "Found %s non-followers in the first %s of %s accounts; TikTok stopped sending more. After unfollowing these, scan again for the rest.",
    },
    es: {
      notFollowing: "%s no te siguen",
      scan: "Escanear", stop: "Detener", stopping: "Deteniendo…", loadLast: "Cargar último escaneo",
      selectAll: "Seleccionar a quienes no te siguen", selectShown: "Seleccionar los mostrados", clear: "Limpiar",
      selVerified: "+ Verificados", selPrivate: "+ Privados", selNoPic: "+ Sin foto",
      addWl: "Añadir a lista blanca (%s)", unfollowN: "Dejar de seguir (%s)", yesUnfollow: "Sí, dejar de seguir %s", cancel: "Cancelar",
      search: "Buscar usuarios…", show: "Mostrar:", verified: "Verificados", private: "Privados", noPic: "Sin foto",
      whitelisted: "LISTA BLANCA (%s)", unfollowed: "Dejado de seguir", failed: "Falló",
      copy: "Copiar lista", copied: "Se copiaron %s usuarios.", copyFailed: "Tu navegador bloqueó la copia. Usa JSON o CSV.",
      settings: "Ajustes", back: "Volver", save: "Guardar", saved: "Ajustes guardados.",
      delay: "Segundos entre cada unfollow", restEvery: "Descansar cada N unfollows (0 = nunca)", restSeconds: "Duración del descanso en segundos",
      dailyLimit: "Máximo de unfollows por día (0 = sin límite)", language: "Idioma",
      backoffMinutes: "Primera pausa cuando el sitio pone un freno (minutos)",
      riskNote: "Los unfollows van a este ritmo hasta que el sitio pone un freno; entonces hace una pausa (cada vez más larga) y sigue más despacio. Ir rápido aumenta el riesgo de bloqueos temporales. Úsalo bajo tu propio riesgo.",
      wlTitle: "Lista blanca: %s cuentas", wlExport: "Exportar", wlImport: "Importar", wlPaste: "Añadir usuarios pegados",
      wlPastePh: "Pega usuarios separados por espacios, comas o saltos de línea",
      wlClear: "Borrar lista blanca", wlClearYes: "Sí, borrar %s", wlAdded: "Se añadieron %s cuentas a la lista blanca.",
      wlBadFile: "Ese archivo no es una lista blanca exportada.", wlCleared: "Lista blanca borrada.",
      today: "%s/%s unfollows hoy",
      start: "Pulsa Escanear para encontrar cuentas que no te siguen.",
      scanDone: "Listo. %s cuentas no te siguen.",
      scanPartial: "El escaneo se detuvo antes de terminar: %s encontradas. Dejar de seguir está desactivado hasta un escaneo completo.",
      scanFailed: "Error en el escaneo: %s", scanStopped: "Escaneo detenido.",
      loadedCache: "Escaneo cargado del %s: %s cuentas. Vuelve a escanear si es antiguo.",
      unfollowing: "Dejando de seguir… %s/%s", resting: "%s dejados de seguir. Descansando %ss para evitar bloqueos…",
      backingOff: "%s puso un freno tras %s de %s. Pausa de %s, luego sigue más despacio (unos %ss entre cada unfollow)…",
      dailyHit: "Detenido: llegaste a %s unfollows hoy. Continúa mañana.",
      unfollowDone: "Listo. Dejaste de seguir a %s de %s.", unfollowStopped: "Detenido. Dejaste de seguir a %s de %s.",
      igNotLoggedIn: "Parece que no has iniciado sesión. Entra en Instagram y pulsa Escanear.",
      igFollowers: "Leyendo tus seguidores… %s", igChecking: "Revisando a quién sigues… %s revisadas, %s no te siguen",
      igSlowDown: "Instagram pidió ir más despacio. Reintentando en %ss…", igPause: "Pausa corta para que Instagram no te bloquee…",
      igFollowersIncomplete: "no se pudo leer toda tu lista de seguidores",
      ttStart: 'Abre tu perfil, haz clic en tu número de "Siguiendo" y pulsa Escanear.',
      ttNoList: 'no se encontró tu lista de Siguiendo. Abre tu perfil y haz clic en tu número de "Siguiendo" primero',
      ttLoading: "Cargando tu lista de Siguiendo… %s cuentas por ahora",
      ttLoadingOf: "Cargando tu lista de Siguiendo… %s de %s",
      ttWaiting: "TikTok está haciendo una pausa antes del siguiente lote. Esperando… (%s de %s cargadas)",
      ttIncomplete: "Se encontraron %s que no te siguen en las primeras %s de %s cuentas; TikTok dejó de enviar más. Después de dejar de seguirlas, vuelve a escanear para el resto.",
    },
  };
  let lang = load("su_lang", null) || ((navigator.language || "").toLowerCase().startsWith("es") ? "es" : "en");
  const t = (k, ...args) => args.reduce((s, v) => s.replace("%s", v), STRINGS[lang][k] ?? STRINGS.en[k] ?? k);

  let settings = { ...platform.defaults, ...load(key("pacing"), {}) };
  let whitelist = new Set(load(key("whitelist"), null) ?? (platform.legacyWhitelist ? platform.legacyWhitelist() : []));
  let users = []; // { username, name, avatar, verified, isPrivate, noPic, result, ...platform fields }
  let selected = new Set(); // usernames
  let filters = { verified: true, isPrivate: true, noPic: true };
  let busy = false;
  let stopRequested = false;
  let confirming = false;
  let partial = false;
  let view = "list";
  let message = t(platform.startKey || "start");

  const isWl = (u) => whitelist.has(u.username.toLowerCase());
  const saveWhitelist = () => save(key("whitelist"), [...whitelist]);
  function todayCount() {
    const d = load(key("daily"), {});
    return d.date === new Date().toDateString() ? d.count : 0;
  }
  const bumpToday = () => save(key("daily"), { date: new Date().toDateString(), count: todayCount() + 1 });

  const ctx = {
    t,
    sleep,
    isDev,
    stopped: () => stopRequested,
    status(text) {
      message = text;
      render();
    },
  };

  // ---- actions ----

  async function scan() {
    busy = true;
    stopRequested = false;
    confirming = false;
    partial = false;
    selected = new Set();
    users = [];
    render();
    try {
      const result = await platform.scan(ctx);
      users = result.users;
      partial = result.partial;
      save(key("last_scan"), { time: Date.now(), partial, users: users.map(({ button, result, ...u }) => u) });
      message = result.note || (partial ? t("scanPartial", users.length) : t("scanDone", users.length));
    } catch (e) {
      console.error(e);
      users = [];
      message = stopRequested ? t("scanStopped") : t("scanFailed", e.message);
    }
    busy = false;
    render();
  }

  function loadLastScan() {
    const cached = load(key("last_scan"), null);
    if (!cached) return;
    users = cached.users;
    partial = cached.partial;
    selected = new Set();
    message = t("loadedCache", new Date(cached.time).toLocaleString(), users.length);
    render();
  }

  // Countdowns update only the message line; a full render every second is heavy with thousands of rows.
  function say(text) {
    message = text;
    const el = top.querySelector(".su-msg");
    if (el) el.textContent = text;
  }
  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Neither site publishes unfollow limits, so go at the configured pace and slow down only when the site
  // pushes back: pause (longer each time), double the gap between unfollows, then retry where it stopped.
  async function unfollow() {
    const queue = users.filter((u) => selected.has(u.username) && !isWl(u) && u.result !== "done");
    if (!queue.length || partial) return;
    busy = true;
    confirming = false;
    stopRequested = false;
    let done = 0;
    let note = null;
    let delay = settings.delay;
    let pushbacks = 0;
    let failStreak = 0;
    for (let i = 0; i < queue.length && !stopRequested; ) {
      const u = queue[i];
      if (settings.dailyLimit > 0 && todayCount() >= settings.dailyLimit) {
        note = t("dailyHit", settings.dailyLimit);
        break;
      }
      let result;
      try {
        result = await platform.unfollow(u, ctx);
      } catch (e) {
        result = { outcome: "failed", detail: String(e) };
      }
      if (result.outcome !== "unfollowed") console.warn(`Unfollow of ${u.username} not confirmed: ${result.detail}`);
      failStreak = result.outcome === "failed" ? failStreak + 1 : 0;

      // three failures in a row usually means a quiet block rather than three bad accounts
      if (result.outcome === "blocked" || failStreak >= 3) {
        if (failStreak >= 3) {
          i -= 2; // retry the whole streak after the pause
          queue.slice(i, i + 3).forEach((q) => delete q.result);
        }
        failStreak = 0;
        pushbacks++;
        delay = Math.min(Math.max(delay, 1) * 2, 60);
        const pause = Math.min(settings.backoffMinutes * 2 ** (pushbacks - 1), 240) * 60;
        render();
        for (let s = pause; s > 0 && !stopRequested; s--) {
          say(t("backingOff", platform.site, done, queue.length, clock(s), delay));
          await sleep(1000);
        }
        continue;
      }

      u.result = result.outcome === "unfollowed" ? "done" : "failed";
      if (u.result === "done") {
        bumpToday();
        done++;
        selected.delete(u.username);
      }
      message = t("unfollowing", done, queue.length);
      render();
      i++;
      if (i === queue.length) break;
      await sleep(delay * 1000 * (1 + Math.random() * 0.5));
      if (settings.restEvery > 0 && u.result === "done" && done % settings.restEvery === 0) {
        for (let s = settings.restSeconds; s > 0 && !stopRequested; s--) {
          say(t("resting", done, s));
          await sleep(1000);
        }
      }
    }
    busy = false;
    message = note || t(stopRequested ? "unfollowStopped" : "unfollowDone", done, queue.length);
    render();
  }

  function setWhitelisted(names, on) {
    names.forEach((n) => {
      on ? whitelist.add(n.toLowerCase()) : whitelist.delete(n.toLowerCase());
      selected.delete(n);
    });
    saveWhitelist();
    render();
  }

  function exportRows() {
    return visible().map((u) => ({
      username: u.username,
      name: u.name,
      verified: Boolean(u.verified),
      private: Boolean(u.isPrivate),
      url: new URL(platform.profileUrl(u), location.origin).href,
    }));
  }
  function download(filename, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function copyList() {
    const text = visible().map((u) => u.username).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return ctx.status(t("copyFailed"));
    }
    ctx.status(t("copied", visible().length));
  }
  const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;

  // ---- panel ----

  const panel = document.createElement("div");
  panel.id = "su-panel";
  panel.innerHTML = `<style>
    #su-panel{position:fixed;top:16px;right:16px;width:min(400px,calc(100vw - 32px));max-height:calc(100vh - 32px);display:flex;flex-direction:column;z-index:2147483647;background:#1a1916;color:#f7f1e8;border:1px solid rgba(247,241,232,.14);border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.5);font:14px/1.4 system-ui,sans-serif;text-align:left}
    #su-panel *{box-sizing:border-box}
    #su-panel [hidden]{display:none!important}
    #su-panel header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(247,241,232,.12);font-weight:800}
    #su-panel .su-msg{padding:10px 14px;color:#ada79d;font-size:13px}
    #su-panel .su-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:0 14px 8px}
    #su-panel button{font:inherit;font-size:12px;font-weight:700;padding:7px 10px;border-radius:7px;border:1px solid rgba(247,241,232,.14);background:rgba(255,255,255,.06);color:#f7f1e8;cursor:pointer}
    #su-panel button:hover:not(:disabled){border-color:rgba(224,163,58,.5)}
    #su-panel button:disabled{opacity:.4;cursor:not-allowed}
    #su-panel button.su-primary{background:#e0a33a;color:#16130d;border-color:#e0a33a}
    #su-panel button.su-danger{background:#ef6a62;color:#1c0d0b;border-color:#ef6a62}
    #su-panel button.su-link{background:none;border:none;padding:4px 6px;color:#62d6d0}
    #su-panel input[type=search],#su-panel input[type=number],#su-panel textarea,#su-panel select{padding:7px 10px;border-radius:7px;border:1px solid rgba(247,241,232,.14);background:rgba(0,0,0,.3);color:#f7f1e8;font:inherit;font-size:13px}
    #su-panel input[type=search]{margin:0 14px 8px}
    #su-panel label.su-chip{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#ada79d;cursor:pointer}
    #su-panel ul{list-style:none;margin:0;padding:0 8px 8px;overflow-y:auto;flex:1}
    #su-panel li{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:7px}
    #su-panel li:hover{background:rgba(255,255,255,.05)}
    #su-panel li img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#333;flex:none}
    #su-panel li .su-ava{width:36px;height:36px;border-radius:50%;background:#333;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;color:#e0a33a}
    #su-panel li .su-who{flex:1;min-width:0}
    #su-panel li a{color:#f7f1e8;font-weight:700;text-decoration:none}
    #su-panel li small{display:block;color:#ada79d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #su-panel li.su-wl a{color:#e0a33a}
    #su-panel .su-tag{font-size:11px;color:#62d6d0;margin-left:4px}
    #su-panel .su-star{background:none;border:none;font-size:18px;padding:2px 4px;color:#555}
    #su-panel .su-wl .su-star{color:#e0a33a}
    #su-panel .su-done{color:#8ccf7e;font-size:12px}
    #su-panel .su-failed{color:#ef6a62;font-size:12px}
    #su-panel input[type=checkbox]{width:18px;height:18px;accent-color:#e0a33a;margin:0}
    #su-panel .su-foot{border-top:1px solid rgba(247,241,232,.12);padding:6px 10px;display:flex;flex-wrap:wrap;gap:2px;justify-content:space-between}
    #su-panel .su-settings{padding:4px 14px 14px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
    #su-panel .su-settings label{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px}
    #su-panel .su-settings input[type=number]{width:90px}
    #su-panel .su-settings h4{margin:6px 0 0;font-size:13px;color:#e0a33a}
    #su-panel .su-note{font-size:12px;color:#ef6a62}
  </style>
  <div class="su-top"></div>
  <div class="su-listview" style="display:contents">
    <input type="search" class="su-search">
    <div class="su-filters"></div>
    <ul></ul>
    <div class="su-foot"></div>
  </div>
  <div class="su-settings" hidden></div>`;
  document.body.appendChild(panel);
  const $ = (sel) => panel.querySelector(sel);
  const top = $(".su-top");
  const listView = $(".su-listview");
  const search = $(".su-search");
  const filterBar = $(".su-filters");
  const list = $("ul");
  const foot = $(".su-foot");
  const settingsView = $(".su-settings");

  // Profile picture links expire (e.g. in a saved scan) or get blocked, so swap broken ones for a letter avatar.
  // Error events don't bubble, hence the capture listener.
  panel.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (img.tagName !== "IMG" || !img.closest("li")) return;
      const letter = document.createElement("span");
      letter.className = "su-ava";
      letter.textContent = (img.closest("li").querySelector("a")?.textContent || "?").charAt(0).toUpperCase();
      img.replaceWith(letter);
    },
    true
  );

  // Sites like TikTok cancel wheel scrolling outside their own popups, so the panel scrolls its lists itself.
  panel.addEventListener(
    "wheel",
    (e) => {
      const box = e.target.closest("ul, .su-settings");
      if (!box) return;
      box.scrollTop += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      e.preventDefault();
    },
    { passive: false }
  );

  function matches(u) {
    const q = search.value.trim().toLowerCase();
    if (q && !u.username.toLowerCase().includes(q) && !(u.name || "").toLowerCase().includes(q)) return false;
    if (!platform.filters) return true;
    return (filters.verified || !u.verified) && (filters.isPrivate || !u.isPrivate) && (filters.noPic || !u.noPic);
  }
  const visible = () => users.filter((u) => !isWl(u) && matches(u));

  function render() {
    const active = users.filter((u) => !isWl(u));
    const shown = visible();
    const wl = users.filter((u) => isWl(u) && matches(u));
    const hasCache = !users.length && !busy && load(key("last_scan"), null);
    const limit = settings.dailyLimit > 0 ? ` <span style="opacity:.7">(${t("today", todayCount(), settings.dailyLimit)})</span>` : "";
    const quick = (k, label) =>
      `<button data-action="pick" data-pick="${k}" ${busy || !shown.some((u) => u[k]) ? "disabled" : ""}>${t(label)}</button>`;

    top.innerHTML = `
      <header><span>${esc(platform.name)} · ${t("notFollowing", active.length)}</span><button data-action="close" title="Close">✕</button></header>
      <div class="su-msg">${esc(message)}${limit}</div>
      ${view === "list" ? `
      <div class="su-row">
        <button class="su-primary" data-action="scan" ${busy ? "disabled" : ""}>${t("scan")}</button>
        ${hasCache ? `<button data-action="cache">${t("loadLast")}</button>` : ""}
        ${busy ? `<button data-action="stop">${t("stop")}</button>` : ""}
      </div>
      <div class="su-row">
        <button data-action="all" ${busy || !shown.length ? "disabled" : ""}>${t(search.value.trim() ? "selectShown" : "selectAll")}</button>
        ${platform.filters ? quick("verified", "selVerified") + quick("isPrivate", "selPrivate") + quick("noPic", "selNoPic") : ""}
        <button data-action="none" ${busy || !selected.size ? "disabled" : ""}>${t("clear")}</button>
      </div>
      <div class="su-row">
        <button data-action="wl-add" ${busy || !selected.size ? "disabled" : ""}>${t("addWl", selected.size)}</button>
        ${confirming
          ? `<button class="su-danger" data-action="unfollow-yes">${t("yesUnfollow", selected.size)}</button><button data-action="unfollow-no">${t("cancel")}</button>`
          : `<button class="su-danger" data-action="unfollow" ${busy || !selected.size || partial ? "disabled" : ""}>${t("unfollowN", selected.size)}</button>`}
      </div>` : ""}`;

    listView.hidden = view !== "list";
    settingsView.hidden = view !== "settings";
    if (view !== "list") return;

    search.placeholder = t("search");
    filterBar.innerHTML = platform.filters
      ? `<div class="su-row"><span style="font-size:12px;color:#ada79d">${t("show")}</span>
          ${[["verified", "verified"], ["isPrivate", "private"], ["noPic", "noPic"]]
            .map(([k, label]) => `<label class="su-chip"><input type="checkbox" data-filter="${k}" ${filters[k] ? "checked" : ""}>${t(label)}</label>`)
            .join("")}</div>`
      : "";
    const row = (u) => {
      const result = u.result ? `<span class="su-${u.result}">${t(u.result === "done" ? "unfollowed" : "failed")}</span>` : "";
      return `<li class="${isWl(u) ? "su-wl" : ""}">
        <input type="checkbox" data-user="${esc(u.username)}" ${selected.has(u.username) ? "checked" : ""} ${busy || u.result === "done" ? "disabled" : ""}>
        <img src="${esc(u.avatar || "")}" alt="" loading="lazy">
        <div class="su-who"><a href="${esc(platform.profileUrl(u))}" target="_blank" rel="noreferrer">${esc(u.username)}</a>${u.verified ? '<span class="su-tag">✔</span>' : ""}${u.isPrivate ? `<span class="su-tag">${t("private").toLowerCase()}</span>` : ""}<small>${esc(u.name || "")}</small></div>
        ${result}
        <button class="su-star" data-action="star" data-user="${esc(u.username)}" title="★">★</button>
      </li>`;
    };
    list.innerHTML =
      shown.map(row).join("") +
      (wl.length ? `<li style="color:#ada79d;font-size:12px;font-weight:800">${t("whitelisted", wl.length)}</li>` + wl.map(row).join("") : "");
    foot.innerHTML = `
      <span>
        <button class="su-link" data-action="copy" ${shown.length ? "" : "disabled"}>${t("copy")}</button>
        <button class="su-link" data-action="json" ${shown.length ? "" : "disabled"}>JSON</button>
        <button class="su-link" data-action="csv" ${shown.length ? "" : "disabled"}>CSV</button>
      </span>
      <span>
        <button class="su-link" data-action="lang">${lang === "en" ? "ES" : "EN"}</button>
        <button class="su-link" data-action="settings">⚙ ${t("settings")}</button>
      </span>`;
  }

  // Built once per opening so background renders never wipe what's being typed.
  function openSettings() {
    view = "settings";
    const num = (name, label) =>
      `<label>${t(label)} <input type="number" min="0" step="1" data-setting="${name}" value="${esc(settings[name])}"></label>`;
    settingsView.innerHTML = `
      ${num("delay", "delay")}
      ${num("restEvery", "restEvery")}
      ${num("restSeconds", "restSeconds")}
      ${num("dailyLimit", "dailyLimit")}
      ${num("backoffMinutes", "backoffMinutes")}
      <label>${t("language")} <select data-setting="lang"><option value="en" ${lang === "en" ? "selected" : ""}>English</option><option value="es" ${lang === "es" ? "selected" : ""}>Español</option></select></label>
      <div class="su-note">${t("riskNote")}</div>
      <h4 class="su-wl-title">${t("wlTitle", whitelist.size)}</h4>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        <button data-action="wl-export" ${whitelist.size ? "" : "disabled"}>${t("wlExport")}</button>
        <button data-action="wl-import">${t("wlImport")}</button>
        <span class="su-wl-clear"><button data-action="wl-clear" ${whitelist.size ? "" : "disabled"}>${t("wlClear")}</button></span>
        <input type="file" accept=".json,application/json" hidden class="su-file">
      </div>
      <textarea rows="3" placeholder="${esc(t("wlPastePh"))}" class="su-paste"></textarea>
      <div><button data-action="wl-paste">${t("wlPaste")}</button></div>
      <div style="display:flex;gap:6px;justify-content:flex-end">
        <button data-action="settings-back">${t("back")}</button>
        <button class="su-primary" data-action="settings-save">${t("save")}</button>
      </div>`;
    settingsView.querySelector(".su-file").addEventListener("change", importWhitelist);
    render();
  }
  function refreshWhitelistBox() {
    settingsView.querySelector(".su-wl-title").textContent = t("wlTitle", whitelist.size);
    settingsView.querySelector(".su-wl-clear").innerHTML = `<button data-action="wl-clear" ${whitelist.size ? "" : "disabled"}>${t("wlClear")}</button>`;
  }
  function addToWhitelist(names) {
    const before = whitelist.size;
    names.forEach((n) => n && whitelist.add(String(n).replace(/^@+/, "").trim().toLowerCase()));
    saveWhitelist();
    ctx.status(t("wlAdded", whitelist.size - before));
    refreshWhitelistBox();
  }
  function importWhitelist(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    file.text().then((text) => {
      let data;
      try { data = JSON.parse(text); } catch {}
      if (!Array.isArray(data)) return ctx.status(t("wlBadFile"));
      // accepts this tool's export (usernames) and the old full-page tool's export (user objects)
      addToWhitelist(data.map((x) => (typeof x === "string" ? x : x && x.username)).filter(Boolean));
    });
  }

  search.addEventListener("input", render);
  panel.addEventListener("change", (e) => {
    const { user, filter } = e.target.dataset;
    if (user) e.target.checked ? selected.add(user) : selected.delete(user);
    if (filter) {
      filters[filter] = e.target.checked;
      selected = new Set([...selected].filter((n) => visible().some((u) => u.username === n)));
    }
    if (user || filter) render();
  });
  panel.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const name = el.dataset.user;
    switch (el.dataset.action) {
      case "close": stopRequested = true; panel.remove(); break;
      case "stop": stopRequested = true; ctx.status(t("stopping")); break;
      case "scan": scan(); break;
      case "cache": loadLastScan(); break;
      case "unfollow": confirming = true; render(); break;
      case "unfollow-no": confirming = false; render(); break;
      case "unfollow-yes": unfollow(); break;
      case "all": visible().forEach((u) => u.result !== "done" && selected.add(u.username)); render(); break;
      case "pick": visible().forEach((u) => u[el.dataset.pick] && u.result !== "done" && selected.add(u.username)); render(); break;
      case "none": selected = new Set(); render(); break;
      case "wl-add": setWhitelisted([...selected], true); break;
      case "star": setWhitelisted([name], !whitelist.has(name.toLowerCase())); break;
      case "copy": copyList(); break;
      case "json": download(`${platform.id}-non-followers.json`, JSON.stringify(exportRows(), null, 2), "application/json"); break;
      case "csv": {
        const rows = exportRows();
        const header = ["username", "name", "verified", "private", "url"];
        download(`${platform.id}-non-followers.csv`, [header.join(","), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(","))].join("\n"), "text/csv");
        break;
      }
      case "lang": lang = lang === "en" ? "es" : "en"; save("su_lang", lang); render(); break;
      case "settings": openSettings(); break;
      case "settings-back": view = "list"; render(); break;
      case "settings-save": {
        settingsView.querySelectorAll("input[data-setting]").forEach((input) => {
          settings[input.dataset.setting] = Math.max(0, Number(input.value) || 0);
        });
        save(key("pacing"), settings);
        lang = settingsView.querySelector('select[data-setting="lang"]').value;
        save("su_lang", lang);
        view = "list";
        ctx.status(t("saved"));
        break;
      }
      case "wl-export":
        download(`${platform.id}-whitelist-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify([...whitelist].sort(), null, 2), "application/json");
        break;
      case "wl-import": settingsView.querySelector(".su-file").click(); break;
      case "wl-paste": {
        const box = settingsView.querySelector(".su-paste");
        addToWhitelist(box.value.split(/[\s,;]+/).filter((n) => /^@?[\w.]+$/.test(n)));
        box.value = "";
        break;
      }
      case "wl-clear":
        el.parentElement.innerHTML = `<button class="su-danger" data-action="wl-clear-yes">${t("wlClearYes", whitelist.size)}</button>`;
        break;
      case "wl-clear-yes": whitelist = new Set(); saveWhitelist(); ctx.status(t("wlCleared")); refreshWhitelistBox(); break;
    }
  });

  render();
}
