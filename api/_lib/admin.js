const { getSupabaseAdmin, requiresMfaAal2 } = require("./supabase");

function adminIds() {
  return String(process.env.MIRAE_ADMIN_USER_IDS || "")
    .split(",").map(x => x.trim()).filter(Boolean);
}

async function requireAdmin(req, res) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  const db = getSupabaseAdmin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid session." });
    return null;
  }
  if (!adminIds().includes(user.id)) {
    res.status(403).json({ error: "Administrator access required." });
    return null;
  }
  if (await requiresMfaAal2(db, user.id, token)) {
    res.status(403).json({ error: "Complete two-factor authentication before using the admin console." });
    return null;
  }
  return { db, user, token };
}

async function audit(db, actorId, action, targetType, targetId, details = {}) {
  await db.from("admin_audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId == null ? null : String(targetId),
    details
  });
}

module.exports = { requireAdmin, audit };
