(async function () {
  const cfg = window.SMART_DK_CONFIG || {};
  let settings = { ...cfg };
  try {
    if (window.smartdk?.configured()) {
      const sb = window.smartdk.getClient();
      const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (data) settings = { ...settings, ...data };
    }
  } catch (_) {}
  const header = document.getElementById("app-header");
  const footer = document.getElementById("app-footer");
  const current = location.pathname.split("/").pop() || "index.html";

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
          <span id="auth-mini"><a href="/login.html">Login</a></span>
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
    if (window.smartdk) {
      const { user } = await window.smartdk.getSession();
      const mini = document.getElementById("auth-mini");
      if (mini && user) {
        const profile = await window.smartdk.getProfile();
        mini.innerHTML = `<a href="/dashboard.html">${window.smartdk.escapeHtml(profile?.full_name || user.email || "Account")}</a> · <button class="link-button" id="logout-mini">Logout</button>`;
        document.getElementById("logout-mini")?.addEventListener("click", () => window.smartdk.logout());
      }
    }
  } catch (_) {}
})();
