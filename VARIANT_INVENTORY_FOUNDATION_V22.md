# BMAA Fashion — Variant Inventory Foundation V22

## Implemented

- Added nullable `variantId` to `cart_items`.
- Added nullable `variantId` to `order_items`.
- Added indexes for cart/order variant lookups.
- Added partial unique indexes for authenticated/guest carts when `variantId` is present.
- Cart API now treats `variantId` as the authoritative variant identity.
- Legacy size/color cart requests still resolve to the matching variant.
- Cart records store the canonical variant size/color.
- Cart responses include the selected variant.
- Guest local cart preserves `variantId`.
- Cart sync/merge preserves variant identity.
- Product detail resolves the selected size/color to the exact variant.
- Variant selector passes the exact `variantId` into the cart.
- Cart totals use variant price when configured.
- Checkout display uses variant price.
- Authenticated and guest checkout send `variantId`.
- Server-side order creation validates the exact variant, uses variant price, and reserves exact variant stock atomically.
- Order items snapshot the resolved `variantId`.
- Product-level stock continues to track total inventory for compatibility.

## Database

Migration file:

`migrations/0003_variant_inventory_foundation.sql`

For environments using the existing Drizzle workflow, apply the schema with the project's normal database migration/push process before testing checkout.

## Validation

The sandbox did not have a complete dependency installation. `npm ci` timed out, so no local TypeScript/build result is claimed from this environment.

Run in the project after extracting V22:

```bash
npm run check
npm run build
```
