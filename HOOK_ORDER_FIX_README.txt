BMAA Fashion React Hook Order Fix

Only change:
- client/src/pages/Products.tsx: moved selectedCategoryData useMemo above the loading conditional return.

This fixes the React "Rendered more hooks than during the previous render" / minified React error #310 caused when the product page rendered the loading state first and then called an additional useMemo after loading completed.

No pricing, coupon, shipping, variant, stock, cart, or checkout logic was intentionally changed.

After extracting, run:
  npm run check
  npm run build

Then deploy the rebuilt frontend. Test /products and switch categories while data is loading.
