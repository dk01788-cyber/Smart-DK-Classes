document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  let products = await sdk.loadProducts();
  const grid = document.getElementById("shop-grid");
  const search = document.getElementById("shop-search");
  const type = document.getElementById("shop-type");
  const initial = new URLSearchParams(location.search).get("q") || "";
  search.value = initial;

  function render() {
    const q = search.value.trim().toLowerCase();
    const t = type.value;
    const rows = products.filter(p => {
      const hay = `${p.title||""} ${p.type||""} ${p.class_name||""} ${p.subject||""} ${p.description||""}`.toLowerCase();
      return (!q || hay.includes(q)) && (!t || p.type === t);
    });
    grid.innerHTML = rows.map(p => {
      const priced = Number(p.price||0) > 0;
      return `<article class="product-card">
        <a class="product-thumb placeholder-thumb" href="/product.html?id=${encodeURIComponent(p.id)}">${p.cover_url?`<img src="${sdk.escapeHtml(p.cover_url)}" alt="">`:`<div><b>${sdk.escapeHtml(p.type||"Product")}</b><span>${sdk.escapeHtml(p.title)}</span><small>${sdk.escapeHtml([p.class_name,p.subject].filter(Boolean).join(" • "))}</small></div>`}</a>
        <div class="product-info"><span class="chip">${sdk.escapeHtml(p.type||"Product")}</span><h3>${sdk.escapeHtml(p.title)}</h3><p>${sdk.escapeHtml(p.description||"")}</p>
        <div class="price-row"><b class="${priced?"":"price-later"}">${sdk.money(p.price)}</b>${Number(p.mrp||0)>Number(p.price||0)&&priced?`<del>₹${Number(p.mrp).toLocaleString("en-IN")}</del>`:""}</div>
        <a class="btn primary full" href="/product.html?id=${encodeURIComponent(p.id)}">View Details</a></div></article>`;
    }).join("") || '<div class="empty-box">No matching products.</div>';
  }
  search.addEventListener("input", render);
  type.addEventListener("change", render);
  render();
});
