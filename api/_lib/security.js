const crypto = require("crypto");

const ALLOWED_ORIGIN = process.env.APP_ORIGIN || "https://mirae.themglabs.com";
const buckets = new Map();

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.headers["x-real-ip"] || "unknown").trim() || "unknown";
}

function rateLimit(req, key, limit, windowMs) {
  const now = Date.now();
  const bucketKey = key + ":" + clientIp(req);
  const entry = buckets.get(bucketKey);
  if (!entry || now >= entry.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

function enforceRateLimit(req, res, key, limit, windowMs) {
  if (rateLimit(req, key, limit, windowMs)) return true;
  res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
  res.status(429).json({ error: "Too many requests. Please try again later." });
  return false;
}

function enforceOrigin(req, res) {
  const origin = String(req.headers.origin || "");
  if (origin && origin !== ALLOWED_ORIGIN) {
    res.status(403).json({ error: "Cross-origin request blocked." });
    return false;
  }
  return true;
}

function setCsrfCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `mirae_csrf=${token}; Path=/; Max-Age=1800; SameSite=Strict; Secure`
  );
}

function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString("hex");
  setCsrfCookie(res, token);
  return token;
}

function readCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";").map(x => x.trim());
  const prefix = name + "=";
  const found = cookies.find(x => x.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

function requireCsrf(req, res) {
  const cookie = readCookie(req, "mirae_csrf");
  const header = String(req.headers["x-csrf-token"] || "");
  if (!cookie || !header || cookie.length !== header.length ||
      !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    res.status(403).json({ error: "CSRF validation failed." });
    return false;
  }
  return true;
}

module.exports = {
  enforceOrigin,
  enforceRateLimit,
  issueCsrfToken,
  requireCsrf
};
