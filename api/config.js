module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const payload = {
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || null
  };
  res.setHeader("Cache-Control","public, max-age=300");
  return res.status(200).json(payload);
};