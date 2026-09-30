# MIRAE — Fashion & UGC Storefront

A portfolio-grade fashion storefront deployed on Vercel with Supabase-backed products, authentication, inventory, demo checkout, order history, newsletter and contact capture.

## Customer experience

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

The browser receives only the Supabase URL and publishable key. The service-role key is server-only.

For this portfolio build, payment gateway code and payment secrets are intentionally not used.

## E2E

See `tests/e2e-plan.md`.

## Tech stack

HTML5 · CSS3 · Vanilla JavaScript · Vercel Functions · Supabase · GitHub Actions

## Author

**Mehul Gupta**

GitHub: https://github.com/017Mehul
