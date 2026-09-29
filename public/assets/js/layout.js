(async function () {
  const cfg = window.SMART_DK_CONFIG || {};
  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  // Public website only: no web Admin Panel is exposed here.

  const blogUrl = appSettings.blogger_url || "https://smartdkclasses.blogspot.com/";
  const youtubeUrl = appSettings.youtube_channel_url || (settings.youtube_channel_id ? `https://www.youtube.com/channel/${encodeURIComponent(settings.youtube_channel_id)}` : "https://www.youtube.com/@smartdkclasses");
  // Public contact details: local config intentionally wins over any stale older DB value.
  // Public website intentionally does not expose a phone/WhatsApp number.
  // Keep support contact email-only even if an older number still exists in Supabase.
  const supportEmail = cfg.supportEmail || settings.support_email || settings.supportEmail || "smartdkclasses.help@gmail.com";

  // Latest Android APK is controlled from the protected Android Admin Panel.
  const apkPath = String(settings.android_apk_path || "").replace(/^\/+/, "");
  const apkVersion = String(settings.android_app_version || "").trim();
  const apkBase = String(cfg.supabaseUrl || "").replace(/\/$/, "");
  const apkHref = apkPath && apkBase
    ? `${apkBase}/storage/v1/object/public/app-downloads/${apkPath.split("/").map(encodeURIComponent).join("/")}`
    : "";
  const nav = [
    ["/", "⌂ Home"],
    ["/#classes", "▤ Classes"],
    ["/#latest-content", "▣ PDFs & Notes"],
    ["/videos.html", "▶ Videos"],
    ["/vacancies.html", "▰ Vacancy"],
    ["/guides.html", "☷ Study Guides"],
    ["/about.html", "ⓘ About"],
    ["/contact.html", "✉ Contact"],
    [blogUrl, "✎ Blog"]
  ];

  if (header) {
    header.innerHTML = `
      <div class="contact-strip"><div class="shell strip-inner">
        <div>✉ ${supportEmail}</div>
        <div class="strip-spacer"></div>
        <a href="${esc(youtubeUrl)}" target="_blank" rel="noopener">▶ YouTube</a>
        <span>Students: No Login Required</span>
      </div></div>
      <header class="main-header"><div class="shell header-row">
        <a class="brand" href="/"><img src="/assets/img/logo.png" alt="Smart DK Classes"><span><strong>Smart <em>DK</em> Classes</strong><small>${settings.tagline || "Learn Today • Build Tomorrow"}</small></span></a>
        <form class="global-search" action="/"><input name="q" placeholder="Search PDFs, Videos, Notes, Model Papers..."><button aria-label="Search">⌕</button></form>
      </div><nav class="nav-bar"><div class="shell nav-scroll">
        ${nav.map(([href,label]) => `<a href="${esc(href)}" ${/^https?:/i.test(href)?'target="_blank" rel="noopener"':''}>${label}</a>`).join("")}
      </div></nav></header>
      ${apkHref ? `<div class="apk-download-strip"><div class="shell apk-download-inner"><div class="apk-download-copy"><span class="apk-phone">📱</span><div><b>Smart DK Classes App डाउनलोड करें</b><small>${apkVersion ? `Latest version ${esc(apkVersion)} • ` : ""}Android APK सीधे डाउनलोड करें</small></div></div><a class="apk-download-btn" href="${esc(apkHref)}" download>Download APK</a></div></div>` : ""}`;
  }

  if (footer) {
    footer.innerHTML = `
      <section class="cta-band"><div class="shell cta-inner"><div><b>Smart DK Classes</b><span>PDFs, Notes, Videos, Model Papers और Vacancy Updates — बिना student login के।</span></div><a class="btn yellow" href="/#latest-content">Study Material →</a></div></section>
      <footer class="site-footer"><div class="shell footer-grid">
        <div><img class="footer-logo" src="/assets/img/logo.png" alt="Smart DK Classes"><p>Class 9, 10, 11, 12 के लिए खुला educational platform.</p></div>
        <div><b>Learning</b><a href="/#latest-content">PDFs &amp; Notes</a><a href="/videos.html">Videos</a><a href="/#classes">Classes</a><a href="/guides.html">Study Guides</a></div>
        <div><b>Updates</b><a href="/vacancies.html">Jobs / Vacancy</a><a href="${esc(blogUrl)}" target="_blank" rel="noopener">Blogger</a><b class="footer-subhead">Contact</b><a href="mailto:${supportEmail}">${supportEmail}</a></div>
        <div><b>Information</b><a href="/about.html">About Us</a><a href="/contact.html">Contact Us</a><a href="/privacy-policy.html">Privacy Policy</a><a href="/terms.html">Terms &amp; Conditions</a><a href="/legal.html">Legal</a></div>
      </div><div class="shell footer-bottom">© <span id="footer-year"></span> Smart DK Classes • Public learning access</div></footer>`;
    const yr = document.getElementById("footer-year");
    if (yr) yr.textContent = new Date().getFullYear();
  }})();
