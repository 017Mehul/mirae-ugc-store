const crypto = require("crypto");
const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports.config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve,reject) => {
    const chunks=[];
    req.on("data",chunk=>chunks.push(Buffer.from(chunk)));
    req.on("end",()=>resolve(Buffer.concat(chunks)));
    req.on("error",reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!signature || !secret) return res.status(401).json({ error: "Webhook verification is not configured." });

  try {
    const raw = await rawBody(req);
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    const a=Buffer.from(String(signature)); const b=Buffer.from(expected);
    if (a.length!==b.length || !crypto.timingSafeEqual(a,b)) return res.status(401).json({ error: "Invalid webhook signature." });
    const event = JSON.parse(raw.toString("utf8"));
    const payment = event?.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    if (!razorpayOrderId) return res.status(200).json({ ok:true, ignored:true });
    const status = event.event === "payment.captured" ? "paid" : event.event === "payment.failed" ? "failed" : null;
    if (!status) return res.status(200).json({ ok:true, ignored:true });

    const db = getSupabaseAdmin();
    const { data: order, error: orderError } = await db.from("orders").select("id,status,inventory_reserved").eq("razorpay_order_id",razorpayOrderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return res.status(200).json({ ok:true, ignored:true });

    const { error } = await db.from("orders").update({ status, razorpay_payment_id:payment.id }).eq("id", order.id);
    if (error) throw error;

    if (status === "failed" && order.inventory_reserved) {
      const { error: releaseError } = await db.rpc("release_order_inventory", { p_order_id: order.id });
      if (releaseError) throw releaseError;
    }
    return res.status(200).json({ ok:true });
  } catch {
    return res.status(500).json({ error:"Webhook processing failed." });
  }
};
