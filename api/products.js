const { getSupabaseAdmin } = require("./_lib/supabase");
const { enforceOrigin, enforceRateLimit } = require("./_lib/security");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!enforceOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, "products", 120, 60_000)) return;
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("products")
      .select("id,slug,name,description,price_inr,category,images,available_sizes,active")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ products: data || [] });
  } catch {
    return res.status(503).json({ error: "Product service is temporarily unavailable." });
  }
};