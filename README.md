# MIRAE — Fashion & UGC Storefront

A portfolio-grade fashion storefront for **MIRAE**, built with vanilla HTML/CSS/JavaScript and backed by **Vercel Functions + Supabase**.

## 🌐 Live demo

**https://mirae.themglabs.com**

This is a portfolio/demo commerce experience. **No real payment is charged.** Checkout creates a demo order and reserves inventory server-side.

## ✨ Features

- Responsive editorial fashion storefront
- Product catalogue loaded from Supabase
- Category browsing and client-side search
- Product detail pages with deep links
- Size selection and persistent shopping bag
- Quantity controls and server-side price validation
- Persistent wishlist
- Supabase email authentication
- Authenticated order history
- Newsletter and contact persistence
- Server-side product, variant and inventory validation
- Demo checkout with database-backed inventory reservation
- SEO metadata, canonical URL, Open Graph/Twitter metadata
- Product structured data and favicon
- Accessibility-focused labels, focus states, Escape handling and live regions
- Security headers and strict Content Security Policy
- CSRF protection, origin validation and API rate limiting
- DOM XSS output escaping and no persistent browser auth tokens
- Database RLS with explicit least-privilege grants
- GitHub Actions JavaScript/smoke checks

## 🏗️ Architecture

```text
Browser
  │
  ├── index.html / product.html
  ├── ugc/styles.css
  └── ugc/app.js
          │
          ▼
      Vercel /api/*
          ├── config.js
          ├── products.js
          ├── newsletter.js
          ├── contact.js
          ├── checkout.js
          └── orders.js
                  │
                  ▼
            Supabase Auth + PostgreSQL
```

## 🧰 Tech stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Vercel Serverless Functions
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- Deployment: Vercel
- CI: GitHub Actions
- Runtime: Node.js 22+
- External frontend dependency: Supabase JS via esm.sh

## 📁 Project structure

```text
.
├── index.html
├── product.html
├── ugc/
│   ├── app.js
│   └── styles.css
├── api/
│   ├── _lib/supabase.js
│   ├── config.js
│   ├── products.js
│   ├── newsletter.js
│   ├── contact.js
│   ├── checkout.js
│   └── orders.js
├── supabase/schema.sql
├── scripts/smoke-test.js
├── tests/e2e-plan.md
├── .github/workflows/storefront.yml
├── .env.example
├── vercel.json
└── package.json
```

## 🔐 Environment variables

The server requires:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- Keep all three values in Vercel Environment Variables.
- `APP_ORIGIN` may be set to the exact production origin; the backend defaults to `https://mirae.themglabs.com`.
- The service-role key is server-only and must never be committed or exposed to browser code.\n- MIRAE_ADMIN_USER_IDS is a comma-separated server-only allowlist of Supabase Auth user UUIDs permitted to use /admin.html and /api/admin.
- `.env.example` contains empty values only.

## 🗄️ Supabase setup

1. Use the dedicated MIRAE Supabase project.
2. Run `supabase/schema.sql`.
3. Configure Supabase Auth email settings and the site's allowed redirect URL.
4. Seed products and product variants/inventory.
5. Add the three environment variables to Vercel.
6. Redeploy and verify `/api/config` and `/api/products`.

**Important:** `supabase/schema.sql` is intended for the dedicated MIRAE database only.

## 💻 Local development

There is no frontend bundler/build step.

```bash
python -m http.server 8000
```

For Node checks:

```bash
npm install
npm run check
```

Local API functionality requires the Supabase environment variables and a Vercel-compatible runtime; the deployed Vercel environment is the reference production configuration.

## 🚀 Deployment

- Frontend/API: Vercel
- Database/Auth: Supabase
- Domain: `mirae.themglabs.com`

A push to `main` triggers GitHub Actions checks. Vercel handles production deployment separately.

## 🧪 Testing

Run:

```bash
npm run check
```

CI verifies JavaScript syntax, required assets, critical storefront markers, product ID/slug mapping, asset-path normalization and removal of obsolete Razorpay client code.

Manual E2E coverage is documented in [`tests/e2e-plan.md`](tests/e2e-plan.md), including authentication, wishlist, forms, checkout, inventory, order history, tampered payloads and accessibility.

## 💳 Checkout model

MIRAE intentionally does **not** use Razorpay or another real payment gateway.

Checkout is a portfolio demo flow: the server reloads product/variant data, recalculates the total, reserves inventory through a protected Supabase function, creates a demo order, and returns the order result. No card/payment transaction is processed.

## 🛡️ Security

- Supabase Row Level Security is enabled on exposed tables.
- Public users can read only active products/variants.
- Users can read only their own orders/order items.
- Public direct database writes are revoked for newsletter, contact, orders and order items.
- Inventory mutation functions are restricted to `service_role`.
- The service-role key is never sent to the browser.
- Vercel security headers and CSP are configured in `vercel.json`.
- Checkout validates products, variants, quantities and prices server-side.
- No payment gateway secrets are used.
- No file-upload endpoint or server-side URL fetcher exists, so there is currently no upload/SSRF attack surface in the app API.
- No webhook endpoint exists, so there is no unsigned webhook path to secure.
- No source-map files are committed.\n- Admin mutations are server-authorized, CSRF-protected, MFA-aware and recorded in admin_audit_logs.\n\n## Admin console\n\nOpen /admin.html after signing into the storefront. Access is denied unless the authenticated Supabase user UUID is present in the server-only MIRAE_ADMIN_USER_IDS Vercel environment variable. The console supports product activation, price updates, per-size inventory updates, order status updates and basic commerce metrics. No admin secret is exposed to the browser.

## ⚠️ Portfolio limitations

This is a **portfolio/demo storefront**, not a production retail operation. It intentionally does not include real payment processing, an admin dashboard, fulfilment/shipping integration, transactional email, reviews or a stock-management UI.

## 👤 Author

**Mehul Gupta**

GitHub: https://github.com/017Mehul


- Responsive editorial storefront
- Category browsing and product search
- Wishlist and persistent shopping bag
- Quantity and size selection
- Deep-link product pages at `/product.html?slug=...`
- Supabase email authentication
- Authenticated order history
- Newsletter and contact persistence
- Server-side price, product and inventory validation
- Portfolio demo checkout — **no real payment is charged**
- SEO metadata, Product structured data and favicon
- Accessibility-focused labels, focus states and keyboard dismissal

## Architecture

```
Browser
  ├── Static HTML/CSS/JS storefront
  └── /api/*
        ├── products.js
        ├── config.js
        ├── newsletter.js
        ├── contact.js
        ├── checkout.js
        └── orders.js
                 │
                 └── Supabase Auth + Postgres
```

## Database

The dedicated MIRAE Supabase project contains products, product variants/inventory, orders, order items, newsletter subscribers and contact messages. RLS is enabled on exposed tables and inventory mutation functions are restricted to server-side service-role execution.

Run `supabase/schema.sql` only against the dedicated MIRAE project.

## Environment

Required server variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Never commit the service-role key. It must never appear in browser code.

## Local development

No frontend build step is required:

    python -m http.server 8000

For Node syntax/CI checks:

    npm install

    npm run check

## CI

GitHub Actions checks all active JavaScript API/frontend files, required production assets and storefront smoke markers.

## Deployment

The current site uses Vercel + Supabase. Product data is served from Supabase through the server API.

Before calling the project complete, test the deployed storefront on desktop and mobile, verify authentication and demo checkout, and configure Supabase email policies/redirect URLs.

## Security notes

The browser receives only the Supabase URL and publishable key. Supabase Auth manages password hashing and JWT signing; this app does not implement custom password hashing or JWT secrets. Browser auth sessions are memory-only and are not persisted in localStorage. The service-role key is server-only.

For this portfolio build, payment gateway code and payment secrets are intentionally not used.

## E2E

See `tests/e2e-plan.md`.

## Tech stack

HTML5 · CSS3 · Vanilla JavaScript · Vercel Functions · Supabase · GitHub Actions

## Author

**Mehul Gupta**

GitHub: https://github.com/017Mehul
