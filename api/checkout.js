const Razorpay = require("razorpay");
const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "Your bag is empty." });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ error: "Payment service is not configured." });

  try {
    const db = getSupabaseAdmin();
    const ids = [...new Set(items.map(x => x.product_id).filter(Boolean))];
    const { data: products, error } = await db.from("products").select("id,name,price_inr,active").in("id", ids).eq("active", true);
    if (error) throw error;
    const byId = new Map((products || []).map(p => [p.id, p]));
    const { data: variants, error: variantError } = await db.from("product_variants").select("product_id,size,stock").in("product_id", ids);
    if (variantError) throw variantError;
    const variantMap = new Map((variants || []).map(v => [`${v.product_id}:${v.size}`, v]));

    const normalized = items.map(x => {
      const p = byId.get(x.product_id);
      const qty = Number(x.quantity);
      const size = String(x.size || "");
      if (!p || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error("Invalid cart item.");
      const variant = variantMap.get(`${p.id}:${size}`);
      if (!variant || variant.stock < qty) throw new Error(`${p.name} is unavailable in size ${size || "selected"}.`);
      return { product_id:p.id, name:p.name, size, quantity:qty, unit_price_inr:Number(p.price_inr) };
    });
    const amount = normalized.reduce((sum,x)=>sum+x.unit_price_inr*x.quantity,0);
    if (amount <= 0) throw new Error("Invalid order amount.");

    const razorpay = new Razorpay({ key_id:process.env.RAZORPAY_KEY_ID, key_secret:process.env.RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({ amount:amount*100, currency:"INR", receipt:"mirae_"+Date.now(), notes:{ source:"mirae-store" } });

    const { data: dbOrder, error: orderError } = await db.from("orders").insert({
      razorpay_order_id:order.id, status:"pending", total_inr:amount, customer_email:req.body?.customer_email || null
    }).select("id").single();
    if (orderError) throw orderError;
    const { error: itemsError } = await db.from("order_items").insert(normalized.map(x=>({
      order_id:dbOrder.id, product_id:x.product_id, product_name:x.name, size:x.size,
      quantity:x.quantity, unit_price_inr:x.unit_price_inr
    })));
    if (itemsError) throw itemsError;

    return res.status(200).json({ keyId:process.env.RAZORPAY_KEY_ID, orderId:order.id, amount, currency:"INR" });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unable to create checkout." });
  }
};
