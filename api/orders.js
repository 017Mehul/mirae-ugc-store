const { getSupabaseAdmin, requiresMfaAal2 } = require("./_lib/supabase");
const { enforceOrigin, enforceRateLimit, requireCsrf } = require("./_lib/security");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error:"Method not allowed" });
  if (!enforceOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, "orders", 60, 60_000)) return;
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i,"");
  if (!token) return res.status(401).json({ error:"Authentication required." });

  try {
    const db = getSupabaseAdmin();
    const { data:{ user }, error:userError } = await db.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error:"Invalid session." });
    if (await requiresMfaAal2(db, user.id, token)) return res.status(403).json({ error:"Complete two-factor authentication to access your orders." });

    const { data, error } = await db.from("orders")
      .select("id,status,total_inr,payment_provider,payment_id,created_at,order_items(size,quantity,unit_price_inr)")
      .eq("user_id",user.id)
      .order("created_at",{ascending:false});

    if(error) throw error;
    return res.status(200).json({orders:data||[]});
  } catch(error) {
    return res.status(500).json({error:"Unable to load orders."});
  }
};
