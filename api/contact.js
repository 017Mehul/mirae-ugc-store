const { getSupabaseAdmin } = require("./_lib/supabase");
const { enforceOrigin, enforceRateLimit, requireCsrf } = require("./_lib/security");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!enforceOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, "api/contact.js", 10, 10 * 60_000)) return;
  if (!requireCsrf(req, res)) return;
  const name = String(req.body?.name || "").trim().slice(0, 120);
  const email = String(req.body?.email || "").trim().toLowerCase();
  const message = String(req.body?.message || "").trim().slice(0, 4000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) return res.status(400).json({ error: "Name, valid email and message are required." });
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from("contact_messages").insert({ name, email, message });
    if (error) throw error;
    return res.status(201).json({ ok: true });
  } catch {
    return res.status(503).json({ error: "Contact service is temporarily unavailable." });
  }
};