document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const rows = await sdk.loadAffiliates();
  document.getElementById("affiliate-grid").innerHTML = rows.map(a => `
    <article class="affiliate-card"><div class="market-badge">${sdk.escapeHtml(a.marketplace||"Store")}</div>
    <div class="affiliate-image">${a.image_url?`<img src="${sdk.escapeHtml(a.image_url)}" alt="">`:"📚"}</div>
    <h3>${sdk.escapeHtml(a.title)}</h3><p>${sdk.escapeHtml(a.description||"")}</p><b>${sdk.escapeHtml(a.price_text||"Check latest price")}</b>
    <a class="btn dark full" target="_blank" rel="nofollow sponsored noopener" href="${sdk.escapeHtml(a.affiliate_url||"#")}">View on ${sdk.escapeHtml(a.marketplace||"Store")} →</a></article>`).join("") || '<div class="empty-box">Affiliate products बाद में add करें।</div>';
});
