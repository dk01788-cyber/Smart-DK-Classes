document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const grid = document.getElementById("videos-grid");
  let free = [];
  try {
    const res = await fetch("/api/youtube-feed");
    const data = await res.json();
    free = data.videos || [];
  } catch {}
  const cards = free.map(v => `<a class="video-card" target="_blank" rel="noopener" href="${sdk.escapeHtml(v.url)}"><div class="video-thumb"><img src="${sdk.escapeHtml(v.thumbnail)}" alt=""><span>▶</span></div><b>${sdk.escapeHtml(v.title)}</b></a>`);
  try {
    const sb = sdk.getClient();
    if (sb) {
      const { data } = await sb.from("videos").select("*").eq("is_published", true).order("created_at", {ascending:false});
      for (const v of (data||[])) {
        if (!v.youtube_video_id) continue;
        if (v.access === "paid") {
          cards.push(`<article class="video-card"><div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube_video_id)}" title="${sdk.escapeHtml(v.title)}" allowfullscreen></iframe></div><b>🔓 ${sdk.escapeHtml(v.title)} • Purchased access</b></article>`);
        } else {
          cards.push(`<a class="video-card" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.youtube_video_id)}"><div class="video-thumb"><img src="https://i.ytimg.com/vi/${encodeURIComponent(v.youtube_video_id)}/hqdefault.jpg" alt=""><span>▶</span></div><b>${sdk.escapeHtml(v.title)}</b></a>`);
        }
      }
    }
  } catch {}
  grid.innerHTML = cards.join("") || '<div class="empty-box">YouTube feed deploy होने के बाद latest videos यहाँ दिखेंगे।</div>';
});
