document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const id = sdk.qs("id");
  const detail = document.getElementById("product-detail");
  const cover = document.getElementById("product-cover");
  const modal = document.getElementById("qr-modal");
  const closeBtn = document.getElementById("qr-close");
  closeBtn.addEventListener("click", () => { modal.hidden = true; });

  const p = await sdk.loadProduct(id);
  if (!p) {
    detail.innerHTML = '<div class="error-box">Product not found.</div>';
    return;
  }
  if (p.cover_url) cover.innerHTML = `<img src="${sdk.escapeHtml(p.cover_url)}" alt="">`;
  else cover.innerHTML = `<div><b>${sdk.escapeHtml(p.type||"Product")}</b><span>${sdk.escapeHtml(p.title)}</span><small>${sdk.escapeHtml([p.class_name,p.subject].filter(Boolean).join(" • "))}</small></div>`;

  const priced = Number(p.price||0) > 0;
  detail.innerHTML = `
    <span class="chip">${sdk.escapeHtml(p.type||"Product")}</span>
    <h1>${sdk.escapeHtml(p.title)}</h1>
    <p>${sdk.escapeHtml(p.description||"")}</p>
    <div class="meta-pills">${p.class_name?`<span>${sdk.escapeHtml(p.class_name)}</span>`:""}${p.subject?`<span>${sdk.escapeHtml(p.subject)}</span>`:""}${p.digital?`<span>Digital</span>`:""}${p.physical?`<span>Physical</span>`:""}${p.validity_days?`<span>${Number(p.validity_days)} days validity</span>`:""}</div>
    <div class="jumbo-price">${priced?`<b>${sdk.money(p.price)}</b>${Number(p.mrp||0)>Number(p.price||0)?`<del>₹${Number(p.mrp).toLocaleString("en-IN")}</del>`:""}`:`<b class="price-later">${sdk.money(0)}</b>`}</div>
    ${p.physical ? `<div class="panel shipping-panel"><h3>Delivery Address</h3><div class="form-grid"><label>Name<input class="input" id="ship-name" required></label><label>Mobile<input class="input" id="ship-mobile" inputmode="numeric" required></label><label class="span-2">Full Address<textarea class="input" id="ship-address" rows="3" required></textarea></label><label>PIN Code<input class="input" id="ship-pin" inputmode="numeric" required></label></div></div>` : ""}
    <div id="buy-msg"></div>
    <div class="buy-actions">
      <button id="buy-qr" class="btn primary big" ${priced?"":"disabled"}>Pay by Exact UPI QR</button>
      <a class="btn white-border big" href="/dashboard.html">My Dashboard</a>
    </div>
    ${priced?"":'<p class="notice-box">Admin Panel से selling price set करने के बाद purchase button चालू हो जाएगा।</p>'}
  `;

  const buy = document.getElementById("buy-qr");
  if (!buy) return;
  buy.addEventListener("click", async () => {
    const msg = document.getElementById("buy-msg");
    if (!sdk.configured()) {
      msg.replaceChildren(sdk.notice("पहले Supabase + Cloudflare environment setup complete करें।", "error"));
      return;
    }
    buy.disabled = true;
    msg.replaceChildren(sdk.notice("Secure QR create हो रहा है…"));
    try {
      let shipping = null;
      if (p.physical) {
        shipping = {
          name: document.getElementById("ship-name")?.value.trim(),
          mobile: document.getElementById("ship-mobile")?.value.trim(),
          address: document.getElementById("ship-address")?.value.trim(),
          pincode: document.getElementById("ship-pin")?.value.trim()
        };
        if (!shipping.name || !shipping.mobile || !shipping.address || !shipping.pincode) {
          throw new Error("Physical book के लिए delivery address पूरा भरें।");
        }
      }
      const out = await sdk.createQr(p.id, shipping);
      document.getElementById("qr-amount").textContent = `${sdk.money(out.amount)} • fixed amount`;
      document.getElementById("qr-image").src = out.image_url;
      document.getElementById("qr-msg").textContent = "QR scan करके payment करें। Auto verification चालू है…";
      modal.hidden = false;
      let tries = 0;
      const timer = setInterval(async () => {
        tries += 1;
        try {
          const st = await sdk.paymentStatus(out.qr_id);
          if (st.status === "paid") {
            clearInterval(timer);
            document.getElementById("qr-msg").textContent = "Payment verified ✓ Access unlocked.";
            msg.replaceChildren(sdk.notice("Payment verified. Dashboard में content access मिल गया है।", "success"));
            setTimeout(() => location.href="/dashboard.html", 1500);
          } else if (tries > 100) {
            clearInterval(timer);
            document.getElementById("qr-msg").textContent = "Auto check stopped. Dashboard refresh करके status देखें।";
          }
        } catch (_) {}
      }, 5000);
    } catch (e) {
      msg.replaceChildren(sdk.notice(e.message || "Payment setup incomplete.", "error"));
      buy.disabled = false;
    }
  });
});
