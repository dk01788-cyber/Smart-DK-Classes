(async function () {
  const cfg = window.SMART_DK_CONFIG || {};
  let settings = { ...cfg };
  let appSettings = {};
  let user = null;
  let profile = null;

  try {
    if (window.smartdk?.configured()) {
      const sb = window.smartdk.getClient();
      const [{ data: settingsRow }, { data: appRow }, sessionState] = await Promise.all([
        sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
        sb.from("app_settings").select("*").eq("id", 1).maybeSingle(),
        window.smartdk.getSession()
      ]);
      if (settingsRow) settings = { ...settings, ...settingsRow };
      if (appRow) appSettings = appRow;
      user = sessionState?.user || null;
      if (user) profile = await window.smartdk.getProfile();
    }
  } catch (_) {}

  const current = location.pathname.split("/").pop() || "index.html";
  const isAdmin = Boolean(user && profile?.is_admin);
  const header = document.getElementById("app-header");
  const footer = document.getElementById("app-footer");

  // Only the Admin area requires login. All student/public learning pages remain open.
  if (current === "admin.html" && isAdmin) {
    if (header) {
      header.innerHTML = `
        <div class="contact-strip"><div class="shell strip-inner">
          <div>🔐 Admin: ${window.smartdk.escapeHtml(user.email || "")}</div>
          <div class="strip-spacer"></div>
          <a href="/">View Website</a>
          <button class="link-button" id="logout-mini">Logout</button>
        </div></div>
        <header class="main-header"><div class="shell header-row">
          <a class="brand" href="/admin.html"><img src="/assets/img/logo.svg" alt="Smart DK Classes"><span><strong>Smart <em>DK</em> Classes</strong><small>Admin Control</small></span></a>
        </div><nav class="nav-bar"><div class="shell nav-scroll"><a class="active-nav" href="/admin.html">⚙ Admin Panel</a><a href="/">⌂ Public Website</a></div></nav></header>`;
      document.getElementById("logout-mini")?.addEventListener("click", () => window.smartdk.logout());
    }
    if (footer) footer.innerHTML = `<footer class="site-footer"><div class="shell footer-bottom">Smart DK Classes • Protected Admin Area</div></footer>`;
    return;
  }

  const blogUrl = appSettings.blogger_url || "https://smartdkclasses.blogspot.com/";
  const youtubeUrl = appSettings.youtube_channel_url || (settings.youtube_channel_id ? `https://www.youtube.com/channel/${encodeURIComponent(settings.youtube_channel_id)}` : "https://www.youtube.com/@smartdkclasses");
  const nav = [
    ["/", "⌂ Home"],
    ["/#classes", "▤ Classes"],
    ["/#latest-content", "▣ PDFs & Notes"],
    ["/videos.html", "▶ Videos"],
    ["/vacancies.html", "▰ Vacancy"],
    [blogUrl, "✎ Blog"]
  ];

  if (header) {
    header.innerHTML = `
      <div class="contact-strip"><div class="shell strip-inner">
        <div>☎ ${settings.support_phone || settings.supportPhone || ""} (Call/WhatsApp)</div>
        <div class="hide-mobile">✉ ${settings.support_email || settings.supportEmail || ""}</div>
        <div class="strip-spacer"></div>
        <a href="${window.smartdk.escapeHtml(youtubeUrl)}" target="_blank" rel="noopener">▶ YouTube</a>
        <span>Students: No Login Required</span>
      </div></div>
      <header class="main-header"><div class="shell header-row">
        <a class="brand" href="/"><img src="/assets/img/logo.svg" alt="Smart DK Classes"><span><strong>Smart <em>DK</em> Classes</strong><small>${settings.tagline || "Learn Today • Build Tomorrow"}</small></span></a>
        <form class="global-search" action="/"><input name="q" placeholder="Search PDFs, Videos, Notes, Model Papers..."><button aria-label="Search">⌕</button></form>
      </div><nav class="nav-bar"><div class="shell nav-scroll">
        ${nav.map(([href,label]) => `<a href="${window.smartdk.escapeHtml(href)}" ${/^https?:/i.test(href)?'target="_blank" rel="noopener"':''}>${label}</a>`).join("")}
      </div></nav></header>`;
  }

  if (footer) {
    footer.innerHTML = `
      <section class="cta-band"><div class="shell cta-inner"><div><b>Smart DK Classes</b><span>PDFs, Notes, Videos, Model Papers और Vacancy Updates — बिना student login के।</span></div><a class="btn yellow" href="/#latest-content">Study Material →</a></div></section>
      <footer class="site-footer"><div class="shell footer-grid">
        <div><img class="footer-logo" src="/assets/img/logo.svg" alt=""><p>Class 9, 10, 11, 12 के लिए खुला educational platform.</p></div>
        <div><b>Learning</b><a href="/#latest-content">PDFs & Notes</a><a href="/videos.html">Videos</a><a href="/#classes">Classes</a></div>
        <div><b>Updates</b><a href="/vacancies.html">Jobs / Vacancy</a><a href="${window.smartdk.escapeHtml(blogUrl)}" target="_blank" rel="noopener">Blogger</a></div>
        <div><b>Support</b><a href="tel:${settings.support_phone || settings.supportPhone || ""}">${settings.support_phone || settings.supportPhone || ""}</a><a href="mailto:${settings.support_email || settings.supportEmail || ""}">${settings.support_email || settings.supportEmail || ""}</a><a href="/legal.html">Privacy / Terms</a></div>
      </div><div class="shell footer-bottom">© <span id="footer-year"></span> Smart DK Classes • Public learning access</div></footer>`;
    const yr = document.getElementById("footer-year");
    if (yr) yr.textContent = new Date().getFullYear();
  }
})();
