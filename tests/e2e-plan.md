# MIRAE portfolio E2E checklist

Run this against the configured deployment.

1. Open storefront on desktop and mobile.
2. Confirm products load from Supabase.
3. Search for a product and open its detail view.
4. Confirm product images, prices, sizes and deep links work.
5. Select a valid size and add the item to the bag.
6. Increase/decrease quantity and verify totals.
7. Sign in and verify account state persists after refresh.
8. Add/remove a wishlist item and verify persistence.
9. Submit newsletter form and verify one subscriber row.
10. Submit contact form and verify one contact message row.
11. Start demo checkout and verify the server recalculates price from database data.
12. Verify the order, shipping address and order items are created and inventory is reserved.
13. Confirm the account order history shows the new order.
14. Test sign-out and password-reset flow.
15. Test invalid quantity, invalid product ID and tampered price payloads.
16. Test keyboard navigation, Escape handling and screen-reader labels.
17. Confirm no service-role key is present in browser source.
