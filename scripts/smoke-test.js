const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html","ugc/app.js","ugc/styles.css","favicon.svg","robots.txt",
  "hero-photo.jpg","editorial.jpg","journal-1.jpg","journal-2.jpg","journal-3.jpg",
  "product-1.jpg","product-2.jpg","product-3.jpg","product-4.jpg","product-5.jpg",
  "package.json",".env.example","vercel.json","supabase/schema.sql",
  "api/products.js","api/newsletter.js","api/contact.js","api/checkout.js",
  "api/config.js","api/orders.js","api/razorpay-webhook.js"
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

console.log("MIRAE production smoke checks passed.");
