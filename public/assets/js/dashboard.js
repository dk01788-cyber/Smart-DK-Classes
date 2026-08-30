document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const state = await sdk.requireAuth();
  if (!state) return;
  const profile = await sdk.getProfile();
  document.getElementById("account-box").innerHTML = `<b>${sdk.escapeHtml(profile?.full_name || state.user.email || "Student")}</b><p>${sdk.escapeHtml(state.user.email||"")}</p>${profile?.phone?`<p>${sdk.escapeHtml(profile.phone)}</p>`:""}`;
  if (profile?.is_admin) document.getElementById("admin-link").hidden = false;

  const purchases = await sdk.myPurchases();
  document.getElementById("purchase-list").innerHTML = purchases.map(p => `<div><span><b>${sdk.escapeHtml(p.products?.title || "Product")}</b><small>${new Date(p.created_at).toLocaleDateString("en-IN")} • ${sdk.money(p.amount)}</small></span>${p.products?.file_path?`<button class="btn small primary download-paid" data-path="${sdk.escapeHtml(p.products.file_path)}" data-name="${sdk.escapeHtml(p.products.title || "Smart-DK-file")}">Download</button>`:`<span class="status paid">Unlocked</span>`}</div>`).join("") || '<div>No paid purchases yet.</div>';


  document.getElementById("purchase-list").addEventListener("click", async (e) => {
    const btn = e.target.closest(".download-paid");
    if (!btn) return;
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Downloading…";
    try {
      await sdk.downloadPaidFile(btn.dataset.path, `${btn.dataset.name}.pdf`);
    } catch (err) {
      alert(err.message || "Download failed.");
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  });

  async function renderDoubts() {
    const doubts = await sdk.myDoubts();
    document.getElementById("doubt-list").innerHTML = doubts.map(d => `<article><small>${sdk.escapeHtml(d.status||"open")}</small><p><b>Q:</b> ${sdk.escapeHtml(d.question)}</p>${d.answer?`<p class="answer"><b>Answer:</b> ${sdk.escapeHtml(d.answer)}</p>`:""}</article>`).join("");
  }
  await renderDoubts();

  document.getElementById("doubt-form").addEventListener("submit", async e => {
    e.preventDefault();
    const q = document.getElementById("doubt-question");
    const msg = document.getElementById("doubt-msg");
    try {
      const { error } = await sdk.addDoubt(q.value.trim());
      if (error) throw error;
      q.value = "";
      msg.replaceChildren(sdk.notice("Doubt submitted.", "success"));
      renderDoubts();
    } catch (err) {
      msg.replaceChildren(sdk.notice(err.message || "Could not submit", "error"));
    }
  });
});
