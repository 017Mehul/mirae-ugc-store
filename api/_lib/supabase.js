const { createClient } = require("@supabase/supabase-js");

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase production environment is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

module.exports = { getSupabaseAdmin };

function jwtAal(token) {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json).aal || "aal1";
  } catch {
    return "aal1";
  }
}

async function requiresMfaAal2(db, userId, token) {
  const { data, error } = await db.rpc("user_mfa_required", { p_user_id: userId });
  if (error) throw error;
  return Boolean(data) && jwtAal(token) !== "aal2";
}

module.exports.requiresMfaAal2 = requiresMfaAal2;
