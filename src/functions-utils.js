export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extraHeaders }
  });
}

export function requireEnv(env, names) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing Cloudflare environment variables: ${missing.join(", ")}`);
}

export function bearerToken(request) {
  const value = request.headers.get("Authorization") || "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

export async function getUser(context) {
  requireEnv(context.env, ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"]);
  const token = bearerToken(context.request);
  if (!token) return null;
  const res = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: context.env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  return res.json();
}

export async function adminRest(env, path, init = {}) {
  requireEnv(env, ["SUPABASE_URL", "SUPABASE_SECRET_KEY"]);
  const headers = new Headers(init.headers || {});
  headers.set("apikey", env.SUPABASE_SECRET_KEY);
  headers.set("content-type", headers.get("content-type") || "application/json");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
  return res;
}

export async function restJson(env, path, init = {}) {
  const res = await adminRest(env, path, init);
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    throw new Error(typeof data === "string" ? data : (data?.message || data?.hint || `Supabase error ${res.status}`));
  }
  return data;
}

export function basicAuth(key, secret) {
  return `Basic ${btoa(`${key}:${secret}`)}`;
}

export async function razorpay(env, path, init = {}) {
  requireEnv(env, ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]);
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", basicAuth(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET));
  headers.set("content-type", headers.get("content-type") || "application/json");
  const res = await fetch(`https://api.razorpay.com${path}`, { ...init, headers });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error?.description || data?.error?.reason || `Razorpay error ${res.status}`);
  return data;
}

export async function verifyHmacHex(secret, body, signature) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== String(signature || "").length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

export async function markPaid(env, paymentRow, providerPaymentId, providerAmountPaise) {
  const paidAmount = Number(providerAmountPaise || 0) / 100;
  if (paidAmount + 0.001 < Number(paymentRow.amount || 0)) {
    throw new Error("Captured amount is lower than expected.");
  }
  await restJson(env, `payments?id=eq.${encodeURIComponent(paymentRow.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      status: "paid",
      provider_payment_id: providerPaymentId || null,
      updated_at: new Date().toISOString()
    })
  });
  await restJson(env, "purchases?on_conflict=user_id,product_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: paymentRow.user_id,
      product_id: paymentRow.product_id,
      payment_id: paymentRow.id,
      amount: paymentRow.amount,
      status: "paid",
      shipping_address: paymentRow.shipping_address || null,
      updated_at: new Date().toISOString()
    })
  });
}
