import { json, getUser, restJson, razorpay, markPaid } from "../../src/functions-utils.js";

export async function onRequestGet(context) {
  try {
    const user = await getUser(context);
    if (!user) return json({ error: "Login required." }, 401);
    const url = new URL(context.request.url);
    const qrId = String(url.searchParams.get("qr_id") || "").trim();
    if (!qrId) return json({ error: "qr_id required." }, 400);

    const rows = await restJson(context.env, `payments?provider_qr_id=eq.${encodeURIComponent(qrId)}&user_id=eq.${encodeURIComponent(user.id)}&select=*`);
    const row = rows?.[0];
    if (!row) return json({ error: "Payment record not found." }, 404);
    if (row.status === "paid") return json({ status: "paid", amount: row.amount });

    const qr = await razorpay(context.env, `/v1/payments/qr_codes/${encodeURIComponent(qrId)}`, { method: "GET" });
    if (Number(qr.payments_count_received || 0) > 0 && Number(qr.payments_amount_received || 0) >= Math.round(Number(row.amount) * 100)) {
      let providerPaymentId = null;
      let providerAmount = qr.payments_amount_received;
      try {
        const payments = await razorpay(context.env, `/v1/payments/qr_codes/${encodeURIComponent(qrId)}/payments`, { method: "GET" });
        const captured = (payments.items || []).find((p) => p.status === "captured") || (payments.items || [])[0];
        if (captured) {
          providerPaymentId = captured.id;
          providerAmount = captured.amount;
        }
      } catch (_) {}
      await markPaid(context.env, row, providerPaymentId, providerAmount);
      return json({ status: "paid", amount: row.amount, provider_payment_id: providerPaymentId });
    }

    return json({ status: "pending", qr_status: qr.status, amount: row.amount });
  } catch (e) {
    return json({ error: e.message || "Could not check payment." }, 500);
  }
}
