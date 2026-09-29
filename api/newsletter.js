const { getSupabaseAdmin } = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from("newsletter_subscribers").upsert({ email }, { onConflict: "email" });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(503).json({ error: "Newsletter service is not configured.", detail: error.message });
  }
};
