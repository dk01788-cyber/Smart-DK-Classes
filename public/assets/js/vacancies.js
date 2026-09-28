document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const grid = document.getElementById("vacancy-grid");
  const search = document.getElementById("vacancy-search");
  const cat = document.getElementById("vacancy-cat");

  let shared = await sdk.loadAppContent({ contentTypes: ["vacancy"] });
  let rows = shared.length ? shared.map(v => ({
    title:v.title, category:v.category || "Vacancy", department:v.subject || "", qualification:"", total_posts:"", last_date:"",
    description:v.description || "", notification_url:v.file_path ? sdk.publicContentUrl(v.file_path) : "", official_url:v.external_url || "", apply_url:v.external_url || "", updated_at:v.updated_at || v.created_at || ""
  })) : await sdk.loadVacancies();

  function render() {
    const q = search.value.trim().toLowerCase(), c = cat.value;
    const filtered = rows.filter(v => {
      const hay = `${v.title||""} ${v.department||""} ${v.category||""} ${v.qualification||""}`.toLowerCase();
      return (!q || hay.includes(q)) && (!c || v.category===c);
    });
    grid.innerHTML = filtered.map(v => `
      <article class="vacancy-card">
        <div class="vacancy-card-head"><span>${sdk.escapeHtml(v.category||"Vacancy")}</span><span>Updated: ${sdk.escapeHtml((v.updated_at||"").slice(0,10) || "—")}</span></div>
        <h2>${sdk.escapeHtml(v.title)}</h2><p>${sdk.escapeHtml(v.department||"")}</p>
        <div class="vacancy-facts"><span><b>Posts</b>${sdk.escapeHtml(v.total_posts||"—")}</span><span><b>Qualification</b>${sdk.escapeHtml(v.qualification||"—")}</span><span><b>Last Date</b>${sdk.escapeHtml(v.last_date||"—")}</span></div>
        <p>${sdk.escapeHtml(v.description||"")}</p>
        <div class="inline">
          ${v.notification_url && v.notification_url!=="#" ? `<a class="btn white-border" target="_blank" rel="noopener" href="${sdk.escapeHtml(v.notification_url)}">Notification / PDF</a>`:""}
          ${v.official_url && v.official_url!=="#" ? `<a class="btn primary" target="_blank" rel="noopener" href="${sdk.escapeHtml(v.official_url)}">Open →</a>`:""}
        </div>
      </article>`).join("") || '<div class="empty-box">No vacancy found.</div>';
  }
  search.addEventListener("input", render); cat.addEventListener("change", render); render();

  // Keep an already-open website page synced with content published from the Android Admin Panel.
  sdk.watchAppContent(() => location.reload(), 30000);
});
