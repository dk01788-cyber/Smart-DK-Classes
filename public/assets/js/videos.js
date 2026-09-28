document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const grid = document.getElementById("videos-grid");
  const cards = [];

  try {
    const appVideos = await sdk.loadAppContent({ contentTypes: ["video"] });
    for (const v of appVideos) {
      const href = v.youtube_url || v.external_url || "#";
      const thumb = v.thumbnail_url || "";
      if (href === "#") continue;
      cards.push(`<a class="video-card" target="_blank" rel="noopener" href="${sdk.escapeHtml(href)}"><div class="video-thumb">${thumb ? `<img src="${sdk.escapeHtml(thumb)}" alt="">` : `<div class="video-placeholder"><span>▶</span><b>${sdk.escapeHtml(v.class_name || "Smart DK Classes")}</b></div>`}<span>▶</span></div><b>${sdk.escapeHtml(v.title)}</b></a>`);
    }
  } catch {}

  try {
    const res = await fetch("/api/youtube-feed");
    const data = await res.json();
    for (const v of (data.videos || [])) {
      cards.push(`<a class="video-card" target="_blank" rel="noopener" href="${sdk.escapeHtml(v.url)}"><div class="video-thumb"><img src="${sdk.escapeHtml(v.thumbnail)}" alt=""><span>▶</span></div><b>${sdk.escapeHtml(v.title)}</b></a>`);
    }
  } catch {}

  grid.innerHTML = cards.join("") || '<div class="empty-box">Latest videos जल्द यहाँ दिखेंगे।</div>';

  // Keep an already-open website page synced with content published from the Android Admin Panel.
  sdk.watchAppContent(() => location.reload(), 30000);
});
