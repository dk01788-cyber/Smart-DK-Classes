document.addEventListener("DOMContentLoaded", async () => {
  const sdk = window.smartdk;
  const auth = await sdk.requireAdmin();
  if (!auth) return;
  const sb = sdk.getClient();

  const msgBox = (text, type="success") => {
    const el = document.createElement("div");
    el.className = type==="error" ? "error-box" : "success-box";
    el.textContent = text;
    return el;
  };

  let products = [], vacancies = [], affiliates = [], videos = [], doubts = [], profiles = [], settings = null;

  async function loadAll() {
    const [p, v, a, st, vi, du, pr] = await Promise.all([
      sb.from("products").select("*").order("created_at", {ascending:false}),
      sb.from("vacancies").select("*").order("updated_at", {ascending:false}),
      sb.from("affiliate_products").select("*").order("created_at", {ascending:false}),
      sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from("videos").select("*").order("created_at", {ascending:false}),
      sb.from("doubts").select("*").order("created_at", {ascending:false}).limit(100),
      sb.from("profiles").select("id,full_name,email")
    ]);
    products = p.data || [];
    vacancies = v.data || [];
    affiliates = a.data || [];
    settings = st.data || {};
    videos = vi.data || [];
    doubts = du.data || [];
    profiles = pr.data || [];
    renderProducts(); renderVacancies(); renderAffiliates(); renderVideos(); renderDoubts(); fillFileProducts(); fillVideoProducts(); fillSettings();
  }

  function fillSettings() {
    document.getElementById("set-phone").value = settings?.support_phone || "";
    document.getElementById("set-email").value = settings?.support_email || "";
    document.getElementById("set-whatsapp").value = settings?.whatsapp_number || "";
    document.getElementById("set-youtube").value = settings?.youtube_channel_id || "";
    document.getElementById("set-announcement").value = settings?.announcement || "";
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
    const { error } = await sb.from("site_settings").update(payload).eq("id", 1);
    if (error) msg.replaceChildren(sdk.notice(error.message, "error"));
    else {
      msg.replaceChildren(sdk.notice("Website settings saved. Page refresh पर header update होगा.", "success"));
      settings = { ...settings, ...payload };
    }
  });

  function renderProducts() {
    document.getElementById("product-admin-list").innerHTML = products.map(p => `
      <div class="edit-card"><div class="admin-row"><span><b>${sdk.escapeHtml(p.title)}</b><small>${sdk.escapeHtml(p.type||"")} • ${sdk.money(p.price)}</small></span>
      <button class="btn small white-border edit-product" data-id="${p.id}">Edit</button></div></div>`).join("") || '<div class="empty-box">No products.</div>';
  }
  function renderVacancies() {
    document.getElementById("vacancy-admin-list").innerHTML = vacancies.slice(0,20).map(v => `
      <div class="edit-card"><div class="admin-row"><span><b>${sdk.escapeHtml(v.title)}</b><small>${sdk.escapeHtml(v.category||"")} • ${sdk.escapeHtml(v.last_date||"No date")}</small></span>
      <button class="btn small white-border edit-vacancy" data-id="${v.id}">Edit</button></div></div>`).join("") || '<div class="empty-box">No vacancies.</div>';
  }
  function renderAffiliates() {
    document.getElementById("affiliate-admin-list").innerHTML = affiliates.map(a => `
      <div class="edit-card"><div class="admin-row"><span><b>${sdk.escapeHtml(a.title)}</b><small>${sdk.escapeHtml(a.marketplace||"")}</small></span>
      <button class="btn small white-border edit-affiliate" data-id="${a.id}">Edit</button></div></div>`).join("") || '<div class="empty-box">No recommendations.</div>';
  }
  function fillFileProducts() {
    document.getElementById("file-product").innerHTML = '<option value="">Select product</option>' + products.map(p => `<option value="${p.id}">${sdk.escapeHtml(p.title)}</option>`).join("");
  }

  function fillVideoProducts() {
    document.getElementById("video-product").innerHTML = '<option value="">No product</option>' + products.map(p => `<option value="${p.id}">${sdk.escapeHtml(p.title)}</option>`).join("");
  }
  function renderVideos() {
    document.getElementById("video-admin-list").innerHTML = videos.map(v => `
      <div class="edit-card"><div class="admin-row"><span><b>${sdk.escapeHtml(v.title)}</b><small>${sdk.escapeHtml(v.access)} • ${sdk.escapeHtml(v.youtube_video_id || "No YouTube ID")}</small></span>
      <button class="btn small white-border edit-video" data-id="${v.id}">Edit</button></div></div>`).join("") || '<div class="empty-box">No video records.</div>';
  }
  function renderDoubts() {
    const nameFor = (id) => {
      const p = profiles.find(x => x.id === id);
      return p?.full_name || p?.email || id;
    };
    document.getElementById("admin-doubts").innerHTML = doubts.map(d => `
      <article data-id="${d.id}">
        <small>${sdk.escapeHtml(nameFor(d.user_id))} • ${sdk.escapeHtml(d.status || "open")}</small>
        <p><b>Q:</b> ${sdk.escapeHtml(d.question)}</p>
        <textarea class="input admin-answer" rows="2" placeholder="Answer…">${sdk.escapeHtml(d.answer || "")}</textarea>
        <div class="inline"><button class="btn small primary save-answer">Save Answer</button><button class="btn small white-border close-doubt">Close</button></div>
      </article>`).join("") || '<div class="empty-box">No student doubts.</div>';
  }

  const productForm = document.getElementById("product-form");
  productForm.addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("prod-id").value;
    const payload = {
      title: document.getElementById("prod-title").value.trim(),
      type: document.getElementById("prod-type").value,
      class_name: document.getElementById("prod-class").value.trim(),
      subject: document.getElementById("prod-subject").value.trim(),
      mrp: Number(document.getElementById("prod-mrp").value || 0),
      price: Number(document.getElementById("prod-price").value || 0),
      description: document.getElementById("prod-desc").value.trim(),
      digital: document.getElementById("prod-digital").checked,
      physical: document.getElementById("prod-physical").checked,
      is_published: document.getElementById("prod-published").checked,
      validity_days: Number(document.getElementById("prod-validity").value || 0),
      updated_at: new Date().toISOString()
    };
    const res = id ? await sb.from("products").update(payload).eq("id", id) : await sb.from("products").insert(payload);
    if (res.error) return alert(res.error.message);
    resetProduct(); await loadAll();
  });
  function resetProduct() {
    productForm.reset();
    document.getElementById("prod-id").value = "";
    document.getElementById("prod-digital").checked = true;
    document.getElementById("prod-published").checked = true;
    document.getElementById("prod-validity").value = "0";
  }
  document.getElementById("prod-reset").addEventListener("click", resetProduct);
  document.getElementById("product-admin-list").addEventListener("click", e => {
    const b = e.target.closest(".edit-product"); if (!b) return;
    const p = products.find(x=>x.id===b.dataset.id); if (!p) return;
    document.getElementById("prod-id").value=p.id; document.getElementById("prod-title").value=p.title||"";
    document.getElementById("prod-type").value=p.type||"Model Paper"; document.getElementById("prod-class").value=p.class_name||"";
    document.getElementById("prod-subject").value=p.subject||""; document.getElementById("prod-mrp").value=p.mrp||0;
    document.getElementById("prod-price").value=p.price||0; document.getElementById("prod-desc").value=p.description||"";
    document.getElementById("prod-digital").checked=!!p.digital; document.getElementById("prod-physical").checked=!!p.physical;
    document.getElementById("prod-published").checked=!!p.is_published; document.getElementById("prod-validity").value=p.validity_days||0;
    productForm.scrollIntoView({behavior:"smooth"});
  });

  const vacForm = document.getElementById("vacancy-form");
  vacForm.addEventListener("submit", async e => {
    e.preventDefault();
    const id=document.getElementById("vac-id").value;
    const payload={
      title:document.getElementById("vac-title").value.trim(), category:document.getElementById("vac-category").value.trim(),
      department:document.getElementById("vac-dept").value.trim(), total_posts:document.getElementById("vac-posts").value.trim(),
      qualification:document.getElementById("vac-qualification").value.trim(), age_limit:document.getElementById("vac-age").value.trim(),
      fee:document.getElementById("vac-fee").value.trim(), salary:document.getElementById("vac-salary").value.trim(),
      start_date:document.getElementById("vac-start").value||null, last_date:document.getElementById("vac-last").value||null,
      official_url:document.getElementById("vac-official").value.trim(), apply_url:document.getElementById("vac-apply").value.trim(),
      notification_url:document.getElementById("vac-notification").value.trim(), description:document.getElementById("vac-desc").value.trim(),
      is_published:document.getElementById("vac-published").checked, updated_at:new Date().toISOString()
    };
    const res=id?await sb.from("vacancies").update(payload).eq("id",id):await sb.from("vacancies").insert(payload);
    if(res.error)return alert(res.error.message); resetVacancy(); await loadAll();
  });
  function resetVacancy(){vacForm.reset();document.getElementById("vac-id").value="";document.getElementById("vac-category").value="Government Jobs";document.getElementById("vac-published").checked=true;}
  document.getElementById("vac-reset").addEventListener("click",resetVacancy);
  document.getElementById("vacancy-admin-list").addEventListener("click",e=>{
    const b=e.target.closest(".edit-vacancy"); if(!b)return; const v=vacancies.find(x=>x.id===b.dataset.id); if(!v)return;
    const set=(id,val)=>document.getElementById(id).value=val??"";
    set("vac-id",v.id);set("vac-title",v.title);set("vac-category",v.category);set("vac-dept",v.department);set("vac-posts",v.total_posts);
    set("vac-qualification",v.qualification);set("vac-age",v.age_limit);set("vac-fee",v.fee);set("vac-salary",v.salary);set("vac-start",v.start_date);set("vac-last",v.last_date);
    set("vac-official",v.official_url);set("vac-apply",v.apply_url);set("vac-notification",v.notification_url);set("vac-desc",v.description);
    document.getElementById("vac-published").checked=!!v.is_published; vacForm.scrollIntoView({behavior:"smooth"});
  });

  const affForm=document.getElementById("affiliate-form");
  affForm.addEventListener("submit",async e=>{
    e.preventDefault();const id=document.getElementById("aff-id").value;
    const payload={marketplace:document.getElementById("aff-market").value,title:document.getElementById("aff-title").value.trim(),price_text:document.getElementById("aff-price").value.trim(),
      affiliate_url:document.getElementById("aff-url").value.trim(),image_url:document.getElementById("aff-image").value.trim(),description:document.getElementById("aff-desc").value.trim(),
      is_published:document.getElementById("aff-published").checked,updated_at:new Date().toISOString()};
    const res=id?await sb.from("affiliate_products").update(payload).eq("id",id):await sb.from("affiliate_products").insert(payload);
    if(res.error)return alert(res.error.message);resetAffiliate();await loadAll();
  });
  function resetAffiliate(){affForm.reset();document.getElementById("aff-id").value="";document.getElementById("aff-market").value="Amazon";document.getElementById("aff-published").checked=true;}
  document.getElementById("aff-reset").addEventListener("click",resetAffiliate);
  document.getElementById("affiliate-admin-list").addEventListener("click",e=>{
    const b=e.target.closest(".edit-affiliate");if(!b)return;const a=affiliates.find(x=>x.id===b.dataset.id);if(!a)return;
    const set=(id,val)=>document.getElementById(id).value=val??"";
    set("aff-id",a.id);set("aff-market",a.marketplace);set("aff-title",a.title);set("aff-price",a.price_text);set("aff-url",a.affiliate_url);set("aff-image",a.image_url);set("aff-desc",a.description);
    document.getElementById("aff-published").checked=!!a.is_published;affForm.scrollIntoView({behavior:"smooth"});
  });


  const videoForm = document.getElementById("video-form");
  videoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("video-id").value;
    const access = document.getElementById("video-access").value;
    const productId = document.getElementById("video-product").value || null;
    if (access === "paid" && !productId) return alert("Paid video के लिए linked product चुनें।");
    const payload = {
      title: document.getElementById("video-title").value.trim(),
      youtube_video_id: document.getElementById("video-youtube").value.trim(),
      access,
      product_id: productId,
      is_published: document.getElementById("video-published").checked
    };
    const res = id ? await sb.from("videos").update(payload).eq("id", id) : await sb.from("videos").insert(payload);
    if (res.error) return alert(res.error.message);
    resetVideo(); await loadAll();
  });
  function resetVideo() {
    videoForm.reset();
    document.getElementById("video-id").value = "";
    document.getElementById("video-access").value = "free";
    document.getElementById("video-published").checked = true;
  }
  document.getElementById("video-reset").addEventListener("click", resetVideo);
  document.getElementById("video-admin-list").addEventListener("click", (e) => {
    const b = e.target.closest(".edit-video"); if (!b) return;
    const v = videos.find(x => x.id === b.dataset.id); if (!v) return;
    document.getElementById("video-id").value = v.id;
    document.getElementById("video-title").value = v.title || "";
    document.getElementById("video-youtube").value = v.youtube_video_id || "";
    document.getElementById("video-access").value = v.access || "free";
    document.getElementById("video-product").value = v.product_id || "";
    document.getElementById("video-published").checked = !!v.is_published;
    videoForm.scrollIntoView({behavior:"smooth"});
  });

  document.getElementById("admin-doubts").addEventListener("click", async (e) => {
    const article = e.target.closest("article[data-id]"); if (!article) return;
    const id = article.dataset.id;
    if (e.target.closest(".save-answer")) {
      const answer = article.querySelector(".admin-answer").value.trim();
      const { error } = await sb.from("doubts").update({answer, status: answer ? "answered" : "open", updated_at:new Date().toISOString()}).eq("id", id);
      if (error) alert(error.message); else await loadAll();
    }
    if (e.target.closest(".close-doubt")) {
      const { error } = await sb.from("doubts").update({status:"closed", updated_at:new Date().toISOString()}).eq("id", id);
      if (error) alert(error.message); else await loadAll();
    }
  });

  document.getElementById("file-form").addEventListener("submit",async e=>{
    e.preventDefault();const productId=document.getElementById("file-product").value;const file=document.getElementById("paid-file").files[0];const msg=document.getElementById("file-msg");
    if(!productId||!file)return;
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-");const path=`${productId}/${Date.now()}-${safeName}`;
    msg.replaceChildren(sdk.notice("Uploading…"));
    const up=await sb.storage.from("paid-files").upload(path,file,{upsert:false});
    if(up.error){msg.replaceChildren(sdk.notice(up.error.message,"error"));return;}
    const updated=await sb.from("products").update({file_path:path,updated_at:new Date().toISOString()}).eq("id",productId);
    if(updated.error){msg.replaceChildren(sdk.notice(updated.error.message,"error"));return;}
    msg.replaceChildren(sdk.notice("Paid file attached successfully.","success"));e.target.reset();await loadAll();
  });

  await loadAll();
});
