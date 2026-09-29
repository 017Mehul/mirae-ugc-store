const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error:"Method not allowed" });
  const token = String(req.headers.authorization || "").replace(/^Bearer\\s+/i,"");
  if (!token) return res.status(401).json({ error:"Authentication required." });
  try {
    const db = getSupabaseAdmin();
    const { data:{ user }, error:userError } = await db.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error:"Invalid session." });
    const { data, error } = await db.from("orders")
      .select("id,razorpay_order_id,razorpay_payment_id,status,total_inr,created_at,order_items(product_name,size,quantity,unit_price_inr)")
      .eq("user_id",user.id).order("created_at",{ascending:false});
    if(error)throw error;
    return res.status(200).json({orders:data||[]});
  } catch(error) {
    return res.status(500).json({error:"Unable to load orders."});
  }
};
