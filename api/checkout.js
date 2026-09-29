const Razorpay = require("razorpay");
const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "Your bag is empty." });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ error: "Payment service is not configured." });

  try {
    const db = getSupabaseAdmin();
    const ids = items.map(x => x.product_id).filter(Boolean);
    const { data: products, error } = await db.from("products").select("id,name,price_inr,active").in("id", ids).eq("active", true);
    if (error) throw error;
    const byId = new Map((products || []).map(p => [p.id, p]));
    const normalized = items.map(x => {
      const p = byId.get(x.product_id);
      const qty = Number(x.quantity);
      if (!p || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error("Invalid cart item.");
      return { product_id:p.id, name:p.name, quantity:qty, unit_price_inr:Number(p.price_inr) };
    });
    const amount = normalized.reduce((sum,x)=>sum+x.unit_price_inr*x.quantity,0);
    if (amount <= 0) throw new Error("Invalid order amount.");
    const razorpay = new Razorpay({ key_id:process.env.RAZORPAY_KEY_ID, key_secret:process.env.RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({ amount:amount*100, currency:"INR", receipt:"mirae_"+Date.now(), notes:{ source:"mirae-store" } });
    return res.status(200).json({ keyId:process.env.RAZORPAY_KEY_ID, orderId:order.id, amount, currency:"INR", items:normalized });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to create checkout." });
  }
};
