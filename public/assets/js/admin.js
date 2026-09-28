document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const auth = await sdk.requireAdmin();
  if (!auth) return;
  const sb = sdk.getClient();
  let settings = {};

  async function load() {
    const [{ data: st }, { data: content, error }] = await Promise.all([
      sb.from("site_settings").select("*").eq("id",1).maybeSingle(),
      sb.from("app_content").select("id,title,content_type,class_name,subject,show_on_home,is_published,display_target,updated_at,created_at").order("sort_order",{ascending:false}).order("created_at",{ascending:false}).limit(100)
    ]);
    settings = st || {};
    fillSettings();
    renderContent(error ? [] : (content || []));
  }

  function fillSettings() {
    document.getElementById("set-phone").value = settings.support_phone || "";
    document.getElementById("set-email").value = settings.support_email || "";
    document.getElementById("set-whatsapp").value = settings.whatsapp_number || "";
    document.getElementById("set-youtube").value = settings.youtube_channel_id || "";
    document.getElementById("set-announcement").value = settings.announcement || "";
  }

  function renderContent(rows) {
    const visible = rows.filter(x => x.is_published && ["website","both"].includes(x.display_target || "both"));
    document.getElementById("sync-count").textContent = `${visible.length} Website-visible`;
    document.getElementById("sync-content-list").innerHTML = visible.length ? visible.map(x => `
      <div class="edit-card"><div class="admin-row"><span><b>${sdk.escapeHtml(x.title)}</b><small>${sdk.escapeHtml(x.content_type || "content")} ${x.class_name ? " • "+sdk.escapeHtml(x.class_name) : ""} ${x.subject ? " • "+sdk.escapeHtml(x.subject) : ""}</small></span><span class="chip">${x.display_target === "website" ? "Website Only" : "App + Website"}${x.show_on_home ? " • Home" : ""}</span></div></div>`).join("") : '<div class="empty-box">App Admin Panel से Website/Both content publish करते ही यहाँ दिखेगा।</div>';
  }

  document.getElementById("settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("settings-msg");
    const payload = {
      support_phone: document.getElementById("set-phone").value.trim(),
      support_email: document.getElementById("set-email").value.trim(),
      whatsapp_number: document.getElementById("set-whatsapp").value.trim(),
      youtube_channel_id: document.getElementById("set-youtube").value.trim(),
      announcement: document.getElementById("set-announcement").value.trim(),
      updated_at: new Date().toISOString()
    };
    const { error } = await sb.from("site_settings").update(payload).eq("id",1);
    if (error) msg.replaceChildren(sdk.notice(error.message,"error"));
    else { settings = {...settings,...payload}; msg.replaceChildren(sdk.notice("Website settings saved.","success")); }
  });

  await load();
});
