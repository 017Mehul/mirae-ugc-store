const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html","ugc/app.js","ugc/styles.css","favicon.svg","robots.txt",
  "hero-photo.jpg","editorial.jpg","journal-1.jpg","journal-2.jpg","journal-3.jpg",
  "product-1.jpg","product-2.jpg","product-3.jpg","product-4.jpg","product-5.jpg",
  "package.json",".env.example","vercel.json","supabase/schema.sql",
  "api/products.js","api/newsletter.js","api/contact.js","api/checkout.js",
  "api/config.js","api/orders.js","api/csrf.js","api/_lib/security.js","api/_lib/supabase.js"
];

const missing = required.filter(file => !fs.existsSync(path.join(root, file)));
if (missing.length) throw new Error("Missing required files: " + missing.join(", "));

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "ugc/app.js"), "utf8");

if (index.includes('src="/hero.jpg"') || app.includes("hero.jpg")) {
  throw new Error("Stale duplicate hero.jpg reference found");
}
for (const marker of ['id="products"', 'id="categories"', 'id="cart-items"', 'src="/ugc/app.js"']) {
  if (!index.includes(marker)) throw new Error("Required storefront marker missing: " + marker);
}
if (!app.includes("p.id, p.slug || p.id")) throw new Error("Production product ID/slug mapping missing");
if (!app.includes("s.startsWith('/')")) throw new Error("Asset path normalization missing");
if (app.includes("RAZORPAY") || app.includes("razorpay")) throw new Error("Obsolete Razorpay client code remains");

console.log("MIRAE production smoke checks passed.");

if (!app.includes("persistSession:false")) throw new Error("Auth persistence must stay disabled");
if (!app.includes("X-CSRF-Token")) throw new Error("CSRF header missing");
if (!app.includes("escapeHTML")) throw new Error("DOM XSS escaping helper missing");
if (app.includes("localStorage") && /auth-token|sb-[^'"]+auth-token/i.test(app)) throw new Error("Auth token persistence detected in localStorage");
if (!fs.existsSync(path.join(root, "package-lock.json"))) console.warn("No package-lock.json: dependency tree is not lockfile-reproducible yet.");
