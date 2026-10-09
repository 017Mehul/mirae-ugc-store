const { getSupabaseAdmin } = require("./_lib/supabase");
const { enforceOrigin, enforceRateLimit, requireCsrf } = require("./_lib/security");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!enforceOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, "api/newsletter.js", 10, 10 * 60_000)) return;
  if (!requireCsrf(req, res)) return;
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from("newsletter_subscribers").upsert({ email }, { onConflict: "email" });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(503).json({ error: "Newsletter service is temporarily unavailable." });
  }
};