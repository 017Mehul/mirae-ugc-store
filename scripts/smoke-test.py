from pathlib import Path

root = Path(__file__).resolve().parents[1]
required = [
    "index.html",
    "ugc/app.js",
    "ugc/styles.css",
    "favicon.svg",
    "robots.txt",
    "hero-photo.jpg",
    "editorial.jpg",
    "journal-1.jpg",
    "journal-2.jpg",
    "journal-3.jpg",
    "product-1.jpg",
    "product-2.jpg",
    "product-3.jpg",
    "product-4.jpg",
    "product-5.jpg",
]
missing = [p for p in required if not (root / p).exists()]
if missing:
    raise SystemExit("Missing required files: " + ", ".join(missing))

index = (root / "index.html").read_text(encoding="utf-8")
app = (root / "ugc/app.js").read_text(encoding="utf-8")
if 'src="/hero.jpg"' in index or "hero.jpg" in app:
    raise SystemExit("Stale duplicate hero.jpg reference found")
for marker in ['id="products"', 'id="categories"', 'id="cart-items"', 'src="/ugc/app.js"']:
    if marker not in index:
        raise SystemExit(f"Required storefront marker missing: {marker}")

print("MIRAE smoke checks passed.")
