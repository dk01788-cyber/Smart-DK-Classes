import { json, getUser, restJson, razorpay, markPaid } from "../../src/functions-utils.js";

export async function onRequestPost(context) {
  try {
    const user = await getUser(context);
    if (!user) return json({ error: "Login required." }, 401);
    const body = await context.request.json().catch(() => ({}));
    const productId = String(body.product_id || "").trim();
    if (!productId) return json({ error: "product_id required." }, 400);

    const products = await restJson(context.env, `products?id=eq.${encodeURIComponent(productId)}&is_published=eq.true&select=id,title,price,type,physical`);
    const product = products?.[0];
    if (!product) return json({ error: "Product not found." }, 404);
    const amount = Number(product.price || 0);
    const shipping = body.shipping && typeof body.shipping === "object" ? body.shipping : null;
    if (product.physical) {
      if (!shipping?.name || !shipping?.mobile || !shipping?.address || !shipping?.pincode) {
        return json({ error: "Delivery address required for physical book." }, 400);
      }
    }
    if (!amount || amount <= 0) return json({ error: "Admin has not set a selling price yet." }, 400);

    const closeBy = Math.floor(Date.now() / 1000) + 20 * 60;
    const qr = await razorpay(context.env, "/v1/payments/qr_codes", {
      method: "POST",
      body: JSON.stringify({
        type: "upi_qr",
        name: "Smart DK Classes",
        usage: "single_use",
        fixed_amount: true,
        payment_amount: Math.round(amount * 100),
        description: String(product.title || "Smart DK purchase").slice(0, 250),
        close_by: closeBy,
        notes: { user_id: user.id, product_id: product.id, source: "smartdk-web" }
      })
    });

    const inserted = await restJson(context.env, "payments", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: user.id,
        product_id: product.id,
        provider: "razorpay_qr",
        provider_qr_id: qr.id,
        amount,
        status: "created",
        shipping_address: product.physical ? shipping : null
      })
    });

    return json({
      qr_id: qr.id,
      image_url: qr.image_url,
      amount,
      close_by: qr.close_by,
      payment_record_id: inserted?.[0]?.id || null
    });
  } catch (e) {
    return json({ error: e.message || "Could not create QR." }, 500);
  }
}
