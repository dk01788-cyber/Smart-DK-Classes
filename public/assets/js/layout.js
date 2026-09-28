(async function () {
  const cfg = window.SMART_DK_CONFIG || {};
  let settings = { ...cfg };
  let user = null;
  let profile = null;

  try {
    if (window.smartdk?.configured()) {
      const sb = window.smartdk.getClient();
      const [{ data: settingsRow }, sessionState] = await Promise.all([
        sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
        window.smartdk.getSession()
      ]);
      if (settingsRow) settings = { ...settings, ...settingsRow };
      user = sessionState?.user || null;
      if (user) profile = await window.smartdk.getProfile();
    }
  } catch (_) {}

  const current = location.pathname.split("/").pop() || "index.html";
  const adminPages = new Set(["admin.html", "wallet.html"]);
  const isAdmin = Boolean(user && profile?.is_admin);

  // App/PWA mode is deliberately login-first. The normal website remains unchanged.
  const params = new URLSearchParams(location.search);
  const launchedAsApp = params.get("app") === "1" || params.get("native") === "1" ||
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true ||
    localStorage.getItem("smartdk_app_mode") === "1";
  if (launchedAsApp) {
    localStorage.setItem("smartdk_app_mode", "1");
    document.documentElement.classList.add("smartdk-app-mode");
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const appPublicPages = new Set(["app-login.html", "forgot-password.html", "reset-password.html", "offline.html"]);
    if (!user && !appPublicPages.has(current)) {
      location.replace("/app-login.html?app=1");
      return;
    }
    if (!user && appPublicPages.has(current)) {
      document.getElementById("app-header")?.remove();
      document.getElementById("app-footer")?.remove();
      document.querySelectorAll('a[href="/login.html"]').forEach((a) => a.setAttribute("href", "/app-login.html?app=1"));
      return;
    }
    if (user && current === "app-login.html") {
      location.replace(isAdmin ? "/admin.html" : "/dashboard.html");
      return;
    }
  }

  // Strict role separation:
  // - Admin account only uses Admin/Wallet area while logged in.
  // - Student accounts can never stay on Admin/Wallet pages.
  if (isAdmin && !adminPages.has(current)) {
    location.replace("/admin.html");
    return;
  }
  if (user && !isAdmin && adminPages.has(current)) {
    location.replace("/dashboard.html");
    return;
  }

  const header = document.getElementById("app-header");
  const footer = document.getElementById("app-footer");

  if (isAdmin) {
    if (header) {
      header.innerHTML = `
        <div class="contact-strip">
          <div class="shell strip-inner">
            <div>🔐 Admin: ${window.smartdk.escapeHtml(user.email || "")}</div>
            <div class="strip-spacer"></div>
            <button class="link-button" id="logout-mini">Logout</button>
          </div>
        </div>
        <header class="main-header">
          <div class="shell header-row">
            <div class="brand">
              <img src="/assets/img/logo.svg" alt="Smart DK Classes">
              <span><strong>Smart <em>DK</em> Classes</strong><small>Admin Control</small></span>
            </div>
          </div>
          <nav class="nav-bar">
            <div class="shell nav-scroll">
              <a class="${current === "admin.html" ? "active-nav" : ""}" href="/admin.html">⚙ Admin Panel</a>
              <a class="${current === "wallet.html" ? "active-nav" : ""}" href="/wallet.html">₹ Wallet / Balance</a>
            </div>
          </nav>
        </header>`;
      document.getElementById("logout-mini")?.addEventListener("click", () => window.smartdk.logout());
    }
    if (footer) {
      footer.innerHTML = `<footer class="site-footer"><div class="shell footer-bottom">Smart DK Classes • Admin access only</div></footer>`;
    }
    return;
  }

  const nav = [
    ["index.html", "⌂ Home"],
    ["shop.html", "▣ Courses & Store"],
    ["vacancies.html", "★ Jobs / Vacancy"],
    ["affiliate.html", "🛍 Recommended"],
    ["videos.html", "▶ Videos"],
    ["test-series.html", "☑ Test Series"],
    ["dashboard.html", "◉ Dashboard"]
  ];

  if (header) {
    header.innerHTML = `
      <div class="contact-strip">
        <div class="shell strip-inner">
          <div>☎ ${settings.support_phone || settings.supportPhone || ""} (Call/WhatsApp)</div>
          <div class="hide-mobile">✉ ${settings.support_email || settings.supportEmail || ""}</div>
          <div class="strip-spacer"></div>
          <a href="https://www.youtube.com/channel/${encodeURIComponent(settings.youtube_channel_id || settings.youtubeChannelId || "")}" target="_blank" rel="noopener">▶ YouTube</a>
          <span id="auth-mini">${user ? "" : '<a href="/login.html">Login</a>'}</span>
        </div>
      </div>
      <header class="main-header">
        <div class="shell header-row">
          <a class="brand" href="/">
            <img src="/assets/img/logo.svg" alt="Smart DK Classes">
            <span><strong>Smart <em>DK</em> Classes</strong><small>${settings.tagline || ""}</small></span>
          </a>
          <form class="global-search" action="/shop.html">
            <input name="q" placeholder="Search courses, books, notes, model papers...">
            <button aria-label="Search">⌕</button>
          </form>
          <a class="cart-badge" href="/dashboard.html" title="My learning">🎓</a>
        </div>
        <nav class="nav-bar">
          <div class="shell nav-scroll">
            ${nav.map(([href,label]) => `<a class="${current===href?'active-nav':''}" href="/${href}">${label}</a>`).join("")}
          </div>
        </nav>
      </header>`;
  }

  if (footer) {
    footer.innerHTML = `
      <section class="cta-band"><div class="shell cta-inner">
        <div><b>Smart DK Classes</b><span>पढ़ाई, vacancies, books, model papers और paid learning — एक ही जगह।</span></div>
        <a class="btn yellow" href="/shop.html">Explore Store →</a>
      </div></section>
      <footer class="site-footer"><div class="shell footer-grid">
        <div><img class="footer-logo" src="/assets/img/logo.svg" alt=""><p>Original Smart DK branded education platform.</p></div>
        <div><b>Learning</b><a href="/shop.html">Courses & Store</a><a href="/videos.html">Videos</a><a href="/test-series.html">Test Series</a></div>
        <div><b>Updates</b><a href="/vacancies.html">Jobs / Vacancy</a><a href="/affiliate.html">Recommended Store</a><a href="/dashboard.html">Student Dashboard</a></div>
        <div><b>Support</b><a href="tel:${settings.support_phone || settings.supportPhone || ""}">${settings.support_phone || settings.supportPhone || ""}</a><a href="mailto:${settings.support_email || settings.supportEmail || ""}">${settings.support_email || settings.supportEmail || ""}</a><a href="/legal.html">Privacy / Terms / Refund</a></div>
      </div><div class="shell footer-bottom">© <span id="footer-year"></span> Smart DK Classes • Affiliate links may earn commission.</div></footer>`;
    const yr = document.getElementById("footer-year");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  try {
    const mini = document.getElementById("auth-mini");
    if (mini && user) {
      mini.innerHTML = `<a href="/dashboard.html">${window.smartdk.escapeHtml(profile?.full_name || user.email || "Account")}</a> · <button class="link-button" id="logout-mini">Logout</button>`;
      document.getElementById("logout-mini")?.addEventListener("click", () => window.smartdk.logout());
    }
  } catch (_) {}
})();
