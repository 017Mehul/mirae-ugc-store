# MIRAE production E2E checklist

Run this against a configured deployment with test payment credentials.

1. Open storefront on desktop and mobile.
2. Search for a product and open its detail view.
3. Select a valid size and add the item to the bag.
4. Increase/decrease quantity and verify totals.
5. Sign in and verify account state persists after refresh.
6. Add/remove a wishlist item and verify persistence.
7. Submit newsletter form with a test address and verify one subscriber row.
8. Submit contact form and verify one contact message row.
9. Start checkout and verify the server recalculates the amount from database prices.
10. Complete Razorpay test payment.
11. Verify the order and order items are created only after verified payment.
12. Refresh the account page and verify the order history is visible.
13. Test invalid quantity, invalid product ID and tampered price payloads.
14. Test keyboard navigation, Escape handling, reduced-motion mode and screen-reader labels.
15. Confirm no service-role or Razorpay secret is present in browser source.
