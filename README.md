# MIRAE — Fashion & UGC Storefront

A polished, responsive fashion storefront built as a lightweight static web experience with interactive shopping features.

## Features

- Editorial fashion-focused landing page
- Responsive desktop, tablet and mobile layouts
- Shop-by-category browsing
- New-arrivals product grid
- Product detail modal with size selection
- Add-to-bag shopping cart with quantities
- Persistent cart and wishlist using LocalStorage
- Product search
- Demo account/sign-in flow
- Journal/article modals
- Demo contact/support form
- Newsletter interaction
- Mobile navigation
- Interactive hero carousel
- SEO metadata, Open Graph and Twitter cards
- Robots directives and SVG favicon
- Keyboard-friendly modal dismissal and visible focus states
- Vercel-ready static deployment

## Tech Stack

HTML5 · CSS3 · Vanilla JavaScript · LocalStorage · Google Fonts · Vercel

## Run locally

No build step is required:

    python -m http.server 8000

Then open http://localhost:8000.

## Deployment

The repository can be deployed directly to Vercel or any static hosting provider.

## Production scope

This repository is intentionally a **frontend demonstration storefront**.

Cart and wishlist data are persisted locally in the browser. Authentication, payments, orders, inventory, newsletter delivery and backend persistence are demo flows and are **not represented as production services**.

For a real store, connect a secure backend and payment provider. Private credentials must remain server-side.

## Project structure

    .
    ├── index.html
    ├── favicon.svg
    ├── robots.txt
    ├── scripts/
    │   └── smoke-test.py
    ├── .github/
    │   └── workflows/
    │       └── storefront.yml
    ├── ugc/
    │   ├── app.js
    │   ├── styles.css
    │   └── assets/
    └── *.jpg

## Author

**Mehul Gupta**

GitHub: https://github.com/017Mehul
