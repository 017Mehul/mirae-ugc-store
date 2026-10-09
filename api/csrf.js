const { enforceOrigin, enforceRateLimit, issueCsrfToken } = require("./_lib/security");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!enforceOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, "csrf", 30, 60_000)) return;
  const token = issueCsrfToken(res);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ csrfToken: token });
};
