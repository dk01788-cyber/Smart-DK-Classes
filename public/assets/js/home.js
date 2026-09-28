document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const contentEl = document.getElementById("home-content");
  const vacancyEl = document.getElementById("home-vacancies");
  const vidEl = document.getElementById("home-videos");
  const clearBtn = document.getElementById("clear-home-filter");
  let allHomeContent = [];
  let allWebsiteContent = [];

  const typeLabel = (type) => ({
    pdf: "PDF", note: "Notes", model_paper: "Model Paper", question_paper: "Question Paper",
    video: "Video", vacancy: "Vacancy", other: "Study Material"
  }[type] || "Content");

  const contentHref = (x) => {
    if (x.external_url) return x.external_url;
    if (x.youtube_url) return x.youtube_url;
    if (x.file_path) return sdk.publicContentUrl(x.file_path);
    return "#";
  };

  function studyCard(x) {
    const href = contentHref(x);
    const isFile = Boolean(x.file_path);
    const meta = [x.class_name && `Class ${String(x.class_name).replace(/^Class\s*/i, "")}`, x.subject, x.category].filter(Boolean).join(" • ");
    return `<article class="sdkc-study-card searchable-home" data-class="${sdk.escapeHtml(String(x.class_name || "").replace(/\D/g, ""))}" data-type="${sdk.escapeHtml(x.content_type || "other")}" data-search="${sdk.escapeHtml([x.title,x.description,x.class_name,x.subject,x.category].filter(Boolean).join(" ").toLowerCase())}">
      <div class="study-icon ${sdk.escapeHtml(x.content_type || "other")}">${x.content_type === "video" ? "▶" : x.content_type === "vacancy" ? "📢" : "PDF"}</div>
      <div class="study-copy"><span>${sdk.escapeHtml(typeLabel(x.content_type))}</span><h3>${sdk.escapeHtml(x.title)}</h3><p>${sdk.escapeHtml(meta || x.description || "Smart DK Classes")}</p></div>
      <div class="study-actions">${href !== "#" ? (isFile ? `<a class="mini-btn" href="/pdf-viewer.html?url=${encodeURIComponent(href)}&title=${encodeURIComponent(x.title || 'Smart DK Classes PDF')}">View PDF</a><a class="mini-btn mini-download" target="_blank" rel="noopener" href="${sdk.escapeHtml(href)}">Download</a>` : `<a class="mini-btn" target="_blank" rel="noopener" href="${sdk.escapeHtml(href)}">Open</a>`) : `<span class="mini-muted">Coming Soon</span>`}</div>
    </article>`;
  }

  function renderStudy(rows) {
    const docs = rows.filter(x => x.content_type !== "video" && x.content_type !== "vacancy");
    contentEl.innerHTML = docs.length ? docs.slice(0, 8).map(studyCard).join("") : '<div class="empty-box sdkc-empty-wide">Admin Panel से Website/Both content publish करते ही यहाँ दिखेगा।</div>';
  }

  function applyFilter({ classNo = "", type = "", query = "" } = {}) {
    let rows = [...allWebsiteContent];
    if (classNo) rows = rows.filter(x => String(x.class_name || "").replace(/\D/g, "") === String(classNo));
    if (type) rows = rows.filter(x => x.content_type === type);
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(x => [x.title,x.description,x.class_name,x.subject,x.category].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    renderStudy(rows);
    clearBtn.hidden = !(classNo || type || query);
    document.getElementById("latest-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  allWebsiteContent = await sdk.loadAppContent();
  allHomeContent = allWebsiteContent.filter(x => x.show_on_home === true);
  renderStudy(allHomeContent);

  document.querySelectorAll("[data-class-filter]").forEach(btn => btn.addEventListener("click", () => applyFilter({ classNo: btn.dataset.classFilter })));
  document.querySelectorAll("[data-type-filter]").forEach(btn => btn.addEventListener("click", () => applyFilter({ type: btn.dataset.typeFilter })));
  clearBtn?.addEventListener("click", () => { renderStudy(allHomeContent); clearBtn.hidden = true; });

  const urlQuery = new URLSearchParams(location.search).get("q")?.trim();
  if (urlQuery) applyFilter({ query: urlQuery });

  const appVideos = allHomeContent.filter(x => x.content_type === "video");
  if (appVideos.length) {
    vidEl.innerHTML = appVideos.slice(0, 4).map(x => {
      const href = contentHref(x);
      const thumb = x.thumbnail_url || "";
      return `<a class="sdkc-video-card" target="_blank" rel="noopener" href="${sdk.escapeHtml(href || "#")}">
        <div class="sdkc-video-thumb">${thumb ? `<img src="${sdk.escapeHtml(thumb)}" alt="">` : `<div class="video-placeholder"><span>▶</span><b>${sdk.escapeHtml(x.class_name || "Smart DK")}</b></div>`}<i>▶</i></div>
        <span>${sdk.escapeHtml(x.class_name || "Smart DK Classes")}</span><b>${sdk.escapeHtml(x.title)}</b><small>${sdk.escapeHtml(x.subject || "Video Class")}</small>
      </a>`;
    }).join("");
  } else {
    try {
      const res = await fetch("/api/youtube-feed");
      const data = await res.json();
      const videos = Array.isArray(data.videos) ? data.videos.slice(0, 4) : [];
      vidEl.innerHTML = videos.length ? videos.map(v => `<a class="sdkc-video-card" target="_blank" rel="noopener" href="${sdk.escapeHtml(v.url)}"><div class="sdkc-video-thumb"><img src="${sdk.escapeHtml(v.thumbnail)}" alt=""><i>▶</i></div><span>Smart DK Classes</span><b>${sdk.escapeHtml(v.title)}</b><small>YouTube Video</small></a>`).join("") : '<div class="empty-box sdkc-empty-wide">Latest videos जल्द यहाँ दिखेंगे।</div>';
    } catch {
      vidEl.innerHTML = '<div class="empty-box sdkc-empty-wide">Latest videos जल्द यहाँ दिखेंगे।</div>';
    }
  }

  const appVacancies = allHomeContent.filter(x => x.content_type === "vacancy");
  if (appVacancies.length) {
    vacancyEl.innerHTML = appVacancies.slice(0, 4).map(x => `<a class="sdkc-vacancy-card" target="_blank" rel="noopener" href="${sdk.escapeHtml(contentHref(x) || "#")}"><span>NEW</span><div><b>${sdk.escapeHtml(x.title)}</b><small>${sdk.escapeHtml(x.description || x.category || "Latest Vacancy Update")}</small></div><strong>Details →</strong></a>`).join("");
  } else {
    const vacancies = await sdk.loadVacancies(4);
    vacancyEl.innerHTML = vacancies.length ? vacancies.map(v => `<a class="sdkc-vacancy-card" href="/vacancies.html"><span>NEW</span><div><b>${sdk.escapeHtml(v.title)}</b><small>${sdk.escapeHtml(v.department || v.category || "Latest Vacancy")}</small></div><strong>Details →</strong></a>`).join("") : '<div class="empty-box sdkc-empty-wide">अभी कोई vacancy publish नहीं है।</div>';
  }


  // Keep an already-open website page synced with content published from the Android Admin Panel.
  sdk.watchAppContent(() => location.reload(), 30000);
});
