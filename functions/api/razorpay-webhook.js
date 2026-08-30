import { json, restJson, verifyHmacHex, markPaid } from "../../src/functions-utils.js";

export async function onRequestPost(context) {
  try {
    if (!context.env.RAZORPAY_WEBHOOK_SECRET) return json({ error: "Webhook secret not configured." }, 500);
    const raw = await context.request.text();
    const signature = context.request.headers.get("X-Razorpay-Signature") || "";
    const valid = await verifyHmacHex(context.env.RAZORPAY_WEBHOOK_SECRET, raw, signature);
    if (!valid) return json({ error: "Invalid signature." }, 401);

    const event = JSON.parse(raw);
    if (event.event !== "qr_code.credited") return json({ ok: true, ignored: event.event });

    const qr = event.payload?.qr_code?.entity || {};
    const payment = event.payload?.payment?.entity || {};
    if (!qr.id) return json({ ok: true, ignored: "No QR id" });

    const rows = await restJson(context.env, `payments?provider_qr_id=eq.${encodeURIComponent(qr.id)}&select=*`);
    const row = rows?.[0];
    if (!row) return json({ ok: true, ignored: "Unknown QR" });
    if (row.status !== "paid") await markPaid(context.env, row, payment.id || null, payment.amount || qr.payments_amount_received || 0);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message || "Webhook failed." }, 500);
  }
}
