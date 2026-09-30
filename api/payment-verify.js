const crypto = require("crypto");
const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { localOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!localOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Incomplete payment verification payload." });
  }
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(503).json({ error: "Payment verification is not configured." });

  try {
    const expected = crypto.createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (String(razorpay_signature) !== expected) return res.status(401).json({ error: "Invalid payment signature." });

    const db = getSupabaseAdmin();
    const { data: order, error: lookupError } = await db.from("orders")
      .select("id,razorpay_order_id,status")
      .eq("id",localOrderId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!order || order.razorpay_order_id !== razorpay_order_id) return res.status(404).json({ error: "Order not found." });

    const { error } = await db.from("orders")
      .update({ status:"paid", razorpay_payment_id })
      .eq("id",localOrderId)
      .in("status",["pending"]);
    if (error) throw error;
    return res.status(200).json({ ok:true });
  } catch {
    return res.status(500).json({ error:"Payment verification failed." });
  }
};
