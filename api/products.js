const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("products")
      .select("id,slug,name,description,price_inr,category,images,available_sizes,active")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ products: data || [] });
  } catch (error) {
    return res.status(503).json({ error: "Product service is not configured.", detail: error.message });
  }
};
