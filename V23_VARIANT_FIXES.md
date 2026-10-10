# BMAA Fashion V23 - Variant Type/Cart Fixes

This version fixes the 10 TypeScript errors reported after V22.

## Fixed

1. `ShoppingCartSlideout.tsx`
   - Added `variant: ProductVariant | null` to the cart item UI type.
   - Updated quantity/remove callback signatures to carry `size`, `color`, and `variantId`.
   - Variant-specific price now compiles and is used for display.
   - Variant-specific remove/update preserves the exact cart line.

2. `CartContext.tsx`
   - Added `variantId` to `validateStock` implementation.
   - Variant stock validation now uses `variantId` as the authoritative identity.
   - Falls back to size/color only when no `variantId` is provided.

3. `Checkout.tsx`
   - Added `variantId` to the authenticated order item payload as well as guest checkout payload.

4. `server/storage.ts`
   - Added `getVariantById()` to `IStorage` and `DatabaseStorage`.
   - `getCartWithProducts()` can now resolve the variant referenced by `cartItems.variantId`.

## Expected test

- Select Black / L for `BMAA-KURTI-001`.
- Confirm the cart uses the variant price, not the parent product price.
- Add quantity 2.
- Cart should show 2 units at the variant price.
- Quantity changes must continue to target the same variant.
- Checkout payload must contain the exact `variantId`.
- Server order creation must resolve price and stock from that variant.
