(function () {
  const cfg = window.SMART_DK_CONFIG || {};
  const demo = window.SMART_DK_DEMO || {};
  let client = null;

  const configured = () =>
    cfg.supabaseUrl &&
    cfg.supabasePublishableKey &&
    !String(cfg.supabaseUrl).startsWith("PASTE_") &&
    !String(cfg.supabasePublishableKey).startsWith("PASTE_") &&
    window.supabase &&
    typeof window.supabase.createClient === "function";

  function getClient() {
    if (!configured()) return null;
    if (!client) {
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return client;
  }

  function money(value) {
    const n = Number(value || 0);
    return n > 0 ? `₹${n.toLocaleString("en-IN")}` : "Price बाद में set होगी";
  }

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  function notice(msg, type = "notice") {
    const box = document.createElement("div");
    box.className = type === "error" ? "error-box" : type === "success" ? "success-box" : "notice-box";
    box.textContent = msg;
    return box;
  }

  async function getSession() {
    const sb = getClient();
    if (!sb) return { user: null, session: null };
    const { data } = await sb.auth.getSession();
    return { user: data.session?.user || null, session: data.session || null };
  }

  async function getProfile() {
    const sb = getClient();
    if (!sb) return null;
    const { user } = await getSession();
    if (!user) return null;
    const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) return null;
    return data;
  }

  async function requireAuth() {
    if (!configured()) {
      location.href = "/login.html?setup=1";
      return null;
    }
    const state = await getSession();
    if (!state.user) {
      location.href = `/login.html?next=${encodeURIComponent(location.pathname + location.search)}`;
      return null;
    }
    return state;
  }

  async function requireAdmin() {
    const state = await requireAuth();
    if (!state) return null;
    const profile = await getProfile();
    if (!profile?.is_admin) {
      location.replace('/dashboard.html');
      return null;
    }
    return { ...state, profile };
  }

  async function requireStudent() {
    const state = await requireAuth();
    if (!state) return null;
    const profile = await getProfile();
    if (profile?.is_admin) {
      location.replace('/admin.html');
      return null;
    }
    return { ...state, profile };
  }

  async function destinationForCurrentUser() {
    const state = await getSession();
    if (!state.user) return '/login.html';
    const profile = await getProfile();
    return profile?.is_admin ? '/admin.html' : '/dashboard.html';
  }

  async function loadPublic(table, fallbackKey, orderBy = "created_at", ascending = false) {
    const sb = getClient();
    if (!sb) return demo[fallbackKey] || [];
    let q = sb.from(table).select("*").eq("is_published", true);
    if (orderBy) q = q.order(orderBy, { ascending });
    const { data, error } = await q;
    return error ? (demo[fallbackKey] || []) : (data || []);
  }

  async function loadProducts(limit) {
    const rows = await loadPublic("products", "products");
    return limit ? rows.slice(0, limit) : rows;
  }
  async function loadVacancies(limit) {
    const rows = await loadPublic("vacancies", "vacancies", "updated_at");
    return limit ? rows.slice(0, limit) : rows;
  }
  async function loadAffiliates(limit) {
    const rows = await loadPublic("affiliate_products", "affiliates");
    return limit ? rows.slice(0, limit) : rows;
  }
  async function loadVideos(limit) {
    const rows = await loadPublic("videos", "videos");
    return limit ? rows.slice(0, limit) : rows;
  }

  async function loadProduct(id) {
    const sb = getClient();
    if (!sb) return (demo.products || []).find(x => x.id === id) || demo.products?.[0] || null;
    const { data, error } = await sb.from("products").select("*").eq("id", id).eq("is_published", true).maybeSingle();
    return error ? null : data;
  }

  async function signup({ fullName, phone, email, password }) {
    const sb = getClient();
    if (!sb) throw new Error("पहले Supabase URL और Publishable Key config.js में भरें।");
    return sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } }
    });
  }

  async function login({ email, password }) {
    const sb = getClient();
    if (!sb) throw new Error("पहले Supabase setup complete करें।");
    return sb.auth.signInWithPassword({ email, password });
  }

  async function sendPasswordReset(email) {
    const sb = getClient();
    if (!sb) throw new Error("पहले Supabase setup complete करें।");
    const site = String(cfg.siteUrl || location.origin).replace(/\/+$/, "");
    return sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/reset-password.html`
    });
  }

  async function updatePassword(password) {
    const sb = getClient();
    if (!sb) throw new Error("पहले Supabase setup complete करें।");
    return sb.auth.updateUser({ password });
  }

  async function logout() {
    const sb = getClient();
    if (sb) await sb.auth.signOut();
    const appMode = localStorage.getItem("smartdk_app_mode") === "1" ||
      window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    location.href = appMode ? "/app-login.html?app=1" : "/";
  }

  async function authFetch(url, options = {}) {
    const state = await getSession();
    if (!state.session?.access_token) throw new Error("Please login first.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${state.session.access_token}`);
    if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
    return fetch(url, { ...options, headers });
  }

  async function createQr(productId, shipping = null) {
    const res = await authFetch("/api/create-qr", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, shipping })
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || "QR create failed");
    return out;
  }

  async function paymentStatus(qrId) {
    const res = await authFetch(`/api/payment-status?qr_id=${encodeURIComponent(qrId)}`);
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || "Payment status failed");
    return out;
  }

  async function createCheckoutOrder(productId, shipping = null) {
    const res = await authFetch("/api/create-order", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, shipping })
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || "Razorpay order create failed");
    return out;
  }

  async function verifyCheckoutPayment(payload) {
    const res = await authFetch("/api/verify-payment", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || out.message || "Payment verification failed");
    return out;
  }

  async function myPurchases() {
    const sb = getClient();
    if (!sb) return [];
    const { data, error } = await sb
      .from("purchases")
      .select("*, products(id,title,type,file_path,cover_url)")
      .eq("status", "paid")
      .order("created_at", { ascending: false });
    return error ? [] : (data || []);
  }

  async function myDoubts() {
    const sb = getClient();
    if (!sb) return [];
    const { data, error } = await sb.from("doubts").select("*").order("created_at", { ascending: false });
    return error ? [] : (data || []);
  }


  async function downloadPaidFile(filePath, filename = "smart-dk-file") {
    const sb = getClient();
    if (!sb) throw new Error("Supabase setup required.");
    const { data, error } = await sb.storage.from("paid-files").download(filePath);
    if (error) throw error;

    // Android WebView bridge: saves paid files to Downloads on supported devices.
    if (window.SmartDKAndroid && typeof window.SmartDKAndroid.saveBase64File === "function") {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
        reader.onerror = () => reject(reader.error || new Error("File read failed"));
        reader.readAsDataURL(data);
      });
      window.SmartDKAndroid.saveBase64File(filename, data.type || "application/octet-stream", base64);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function addDoubt(question) {
    const sb = getClient();
    if (!sb) throw new Error("Supabase setup required.");
    const { user } = await getSession();
    if (!user) throw new Error("Login required.");
    return sb.from("doubts").insert({ user_id: user.id, question });
  }

  window.smartdk = {
    cfg, demo, configured, getClient, money, qs, escapeHtml, notice,
    getSession, getProfile, requireAuth, requireAdmin, requireStudent, destinationForCurrentUser,
    loadProducts, loadVacancies, loadAffiliates, loadVideos, loadProduct,
    signup, login, sendPasswordReset, updatePassword, logout, authFetch, createQr, paymentStatus, createCheckoutOrder, verifyCheckoutPayment, myPurchases, myDoubts, downloadPaidFile, addDoubt
  };
})();
