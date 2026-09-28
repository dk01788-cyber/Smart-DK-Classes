document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const productEl = document.getElementById("home-products");
  const vacancyEl = document.getElementById("home-vacancies");
  const affEl = document.getElementById("home-affiliates");
  const vidEl = document.getElementById("home-videos");
  const blogEl = document.getElementById("home-blog-posts");

  const products = await sdk.loadProducts(4);
  productEl.innerHTML = products.map(productCard).join("") || '<div class="empty-box">अभी कोई product publish नहीं है।</div>';

  const vacancies = await sdk.loadVacancies(3);
  vacancyEl.innerHTML = vacancies.map(v => `
    <a class="vacancy-row" href="/vacancies.html">
      <div><span class="status-dot"></span><b>${sdk.escapeHtml(v.title)}</b><small>${sdk.escapeHtml(v.department || v.category || "")}</small></div>
      <div><span>Posts: ${sdk.escapeHtml(v.total_posts || "—")}</span><span>Last Date: ${sdk.escapeHtml(v.last_date || "—")}</span><strong>Details →</strong></div>
    </a>`).join("") || '<div class="empty-box">अभी कोई vacancy publish नहीं है।</div>';

  const affiliates = await sdk.loadAffiliates(4);
  affEl.innerHTML = affiliates.map(a => `
    <article class="affiliate-card">
      <div class="market-badge">${sdk.escapeHtml(a.marketplace || "Store")}</div>
      <div class="affiliate-image">${a.image_url ? `<img src="${sdk.escapeHtml(a.image_url)}" alt="">` : "📚"}</div>
      <h3>${sdk.escapeHtml(a.title)}</h3>
      <p>${sdk.escapeHtml(a.description || "")}</p>
      <b>${sdk.escapeHtml(a.price_text || "Check latest price")}</b>
      <a class="btn dark full" target="_blank" rel="nofollow sponsored noopener" href="${sdk.escapeHtml(a.affiliate_url || "#")}">View on ${sdk.escapeHtml(a.marketplace || "Store")} →</a>
    </article>`).join("") || '<div class="empty-box">Recommendations बाद में add करें।</div>';

  if (blogEl) {
    loadBloggerPosts(blogEl, 6);
  }

  function loadBloggerPosts(target, limit = 6) {
    const callbackName = `smartDkBlogFeed_${Date.now()}`;
    const script = document.createElement("script");
    const cleanup = () => {
      try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      script.remove();
    };

    window[callbackName] = (feed) => {
      try {
        const entries = feed?.feed?.entry || [];
        if (!entries.length) throw new Error("No Blogger posts");
        target.innerHTML = entries.slice(0, limit).map(blogCard).join("");
      } catch (_) {
        renderBlogFallback(target);
      } finally {
        cleanup();
      }
    };

    script.onerror = () => {
      cleanup();
      renderBlogFallback(target);
    };
    script.src = `https://smartdkclasses.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=${limit}&callback=${callbackName}`;
    script.async = true;
    document.head.appendChild(script);
  }

  function blogCard(entry) {
    const title = entry?.title?.$t || "Smart DK Classes Article";
    const link = (entry?.link || []).find(l => l.rel === "alternate")?.href || "https://smartdkclasses.blogspot.com/";
    const published = entry?.published?.$t ? new Date(entry.published.$t) : null;
    const dateText = published && !Number.isNaN(published.getTime())
      ? published.toLocaleDateString("hi-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "Smart DK Blog";
    const raw = entry?.summary?.$t || entry?.content?.$t || "";
    const temp = document.createElement("div");
    temp.innerHTML = raw;
    const summary = (temp.textContent || temp.innerText || "").replace(/\s+/g, " ").trim().slice(0, 145);
    let thumb = entry?.media$thumbnail?.url || "";
    if (thumb) thumb = thumb.replace(/\/s72-c\//, "/s640/").replace(/=s72-c/, "=s640");

    return `<article class="blog-card">
      <a class="blog-thumb ${thumb ? "" : "blog-thumb-empty"}" href="${sdk.escapeHtml(link)}" target="_blank" rel="noopener">
        ${thumb ? `<img src="${sdk.escapeHtml(thumb)}" alt="${sdk.escapeHtml(title)}" loading="lazy">` : `<span>✎</span><b>Smart DK Blog</b>`}
      </a>
      <div class="blog-card-body">
        <div class="blog-meta"><span>Smart DK Classes</span><time>${sdk.escapeHtml(dateText)}</time></div>
        <h3><a href="${sdk.escapeHtml(link)}" target="_blank" rel="noopener">${sdk.escapeHtml(title)}</a></h3>
        ${summary ? `<p>${sdk.escapeHtml(summary)}${summary.length >= 145 ? "…" : ""}</p>` : ""}
        <a class="blog-read-more" href="${sdk.escapeHtml(link)}" target="_blank" rel="noopener">Read Article →</a>
      </div>
    </article>`;
  }

  function renderBlogFallback(target) {
    target.innerHTML = `<div class="blog-fallback">
      <div><strong>✎ Smart DK Blog</strong><span>Latest articles अभी feed से load नहीं हो पाए।</span></div>
      <a class="btn primary" href="https://smartdkclasses.blogspot.com/" target="_blank" rel="noopener">Open Blog →</a>
    </div>`;
  }

  try {
    const res = await fetch("/api/youtube-feed");
    const data = await res.json();
    const videos = Array.isArray(data.videos) ? data.videos.slice(0, 4) : [];
    vidEl.innerHTML = videos.length ? videos.map(videoCard).join("") :
      `<article class="video-card"><div class="locked-video"><strong>▶ Smart DK Classes</strong><span>Latest YouTube videos deploy के बाद यहाँ आएँगे।</span></div><b>Public YouTube Feed</b></article>`;
  } catch {
    vidEl.innerHTML = `<article class="video-card"><div class="locked-video"><strong>▶ Smart DK Classes</strong><span>YouTube feed preview.</span></div><b>Public YouTube Feed</b></article>`;
  }

  function productCard(p) {
    const priced = Number(p.price || 0) > 0;
    return `<article class="product-card">
      <a class="product-thumb placeholder-thumb" href="/product.html?id=${encodeURIComponent(p.id)}">
        ${p.cover_url ? `<img src="${sdk.escapeHtml(p.cover_url)}" alt="">` : `<div><b>${sdk.escapeHtml(p.type || "Product")}</b><span>${sdk.escapeHtml(p.title)}</span><small>${sdk.escapeHtml([p.class_name,p.subject].filter(Boolean).join(" • "))}</small></div>`}
      </a>
      <div class="product-info"><span class="chip">${sdk.escapeHtml(p.type || "Product")}</span><h3>${sdk.escapeHtml(p.title)}</h3>
      <p>${sdk.escapeHtml(p.description || "")}</p><div class="price-row"><b class="${priced ? "" : "price-later"}">${sdk.money(p.price)}</b>${Number(p.mrp||0)>Number(p.price||0) && priced ? `<del>₹${Number(p.mrp).toLocaleString("en-IN")}</del>`:""}</div>
      <a class="btn primary full" href="/product.html?id=${encodeURIComponent(p.id)}">View Details</a></div></article>`;
  }

  function videoCard(v) {
    return `<a class="video-card" target="_blank" rel="noopener" href="${sdk.escapeHtml(v.url)}">
      <div class="video-thumb"><img src="${sdk.escapeHtml(v.thumbnail)}" alt=""><span>▶</span></div>
      <b>${sdk.escapeHtml(v.title)}</b>
    </a>`;
  }
});
