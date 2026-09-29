# MIRAE — Fashion & UGC Storefront

A portfolio-grade fashion commerce experience that starts as a polished static storefront and now includes a production-ready Vercel API layer for products, authentication, order history, newsletter/contact capture and Razorpay checkout.

## Customer experience

- Responsive editorial storefront
- Category browsing and product search
- Wishlist and persistent bag
- Quantity and variant selection
- Deep-link SEO product pages at `/product.html?slug=...`
- Supabase email authentication when configured
- Authenticated order history
- Newsletter and contact persistence
- Razorpay checkout flow with server-side price/stock validation
- Verified Razorpay webhook updates
- SEO metadata, Product structured data and favicon
- Accessibility-focused labels, focus states and keyboard dismissal

## Architecture

```
Browser
  ├── Static storefront (HTML/CSS/JS)
  └── /api/*
        ├── products.js
        ├── config.js
        ├── newsletter.js
        ├── contact.js
        ├── orders.js
        ├── checkout.js
        └── razorpay-webhook.js
                 │
                 ├── Supabase Auth + Postgres
                 └── Razorpay
```

## Production data model

`supabase/schema.sql` defines products, variants/inventory, customers through Supabase Auth, orders, order items, newsletter subscribers and contact messages. RLS is enabled on exposed tables.

Run the schema **only in a dedicated MIRAE Supabase project**. Do not use another application’s database.

## Environment

Copy `.env.example` into the deployment environment and provide:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `PUBLIC_RAZORPAY_KEY_ID`
- `PUBLIC_SITE_URL`

Never commit `.env`, service-role keys, Razorpay secrets or webhook secrets.

## Local development

No frontend build step is required:

    python -m http.server 8000

The static UI works without backend credentials. Production APIs intentionally return configuration errors until their environment variables and database are configured.

For API dependency installation:

    npm install

## CI

GitHub Actions checks:

- browser JavaScript syntax
- all Vercel API JavaScript syntax
- required production files
- stale asset references
- storefront smoke markers

## Deployment

Deploy the repository to Vercel. Add the production environment variables in Vercel before enabling real checkout/authentication.

Configure Razorpay to send payment events to:

    /api/razorpay-webhook

Use a Razorpay webhook secret and verify the deployed webhook before accepting live payments.

## Important production notes

The code is deliberately fail-closed when external services are not configured. It does not invent credentials or silently turn demo behavior into fake production behavior.

Before launch, still complete:

1. Create and configure the dedicated MIRAE Supabase project.
2. Run and review `supabase/schema.sql`.
3. Seed real product records, variants, images and stock.
4. Configure Supabase email verification/password policies.
5. Configure Razorpay test keys and webhook signing secret.
6. Test payment success/failure/refund flows using test mode.
7. Configure the final custom domain and replace any placeholder social URLs.
8. Add rate limiting/bot protection at the edge if traffic requires it.
9. Add monitoring/analytics and a real transactional email provider.
10. Perform a full Playwright/browser checkout test before going live.

## E2E checklist

See `tests/e2e-plan.md`.

## Tech stack

HTML5 · CSS3 · Vanilla JavaScript · Vercel Functions · Supabase · Razorpay · GitHub Actions

## Author

**Mehul Gupta**

GitHub: https://github.com/017Mehul
