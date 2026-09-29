const crypto = require("crypto");
const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) return res.status(401).json({ error: "Webhook verification is not configured." });

  const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(401).json({ error: "Invalid webhook signature." });

  try {
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    if (!razorpayOrderId) return res.status(200).json({ ok:true, ignored:true });

    const status = event.event === "payment.captured" ? "paid" :
      event.event === "payment.failed" ? "failed" : null;
    if (!status) return res.status(200).json({ ok:true, ignored:true });

    const db = getSupabaseAdmin();
    const { error } = await db.from("orders").update({
      status, razorpay_payment_id:payment.id
    }).eq("razorpay_order_id", razorpayOrderId);
    if (error) throw error;
    return res.status(200).json({ ok:true });
  } catch (error) {
    return res.status(500).json({ error:"Webhook processing failed." });
  }
};
