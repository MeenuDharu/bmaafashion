# BMAA Fashion — Premium UI & Performance Upgrade

This pass keeps the audited ecommerce/business logic intact and improves the storefront presentation and mobile UX.

## Included
- Premium gold/charcoal visual language with softer surfaces and luxury typography support.
- Lightweight CSS-only reveal, hover and image motion.
- Mobile-first bottom navigation: Home, Shop, Wishlist, Account and Bag.
- Touch-friendly mobile controls and safe-area support for modern phones.
- Reduced-motion support for accessibility.
- Lazy/async product image loading to reduce initial payload pressure.
- Search icon now navigates to the product catalogue instead of being inert.
- Frosted/sticky storefront header treatment.
- Premium product-card hover elevation and image zoom without adding runtime dependencies.

## Performance principles
- Avoid large animation libraries for simple UI effects.
- Keep hero first image eager and subsequent slides lazy.
- Keep product images lazy and async.
- Prefer WebP/AVIF assets where the source images can be converted on the server/CDN.
- Continue using production Vite code splitting.
- Do not ship `node_modules` in the deployment archive.

## Deploy validation
After extracting and restoring the real environment variables:

```bash
npm install
npm run check
npm run build
```

The build could not be completed in the isolated audit container because dependency installation did not finish and `vite` was unavailable. No production credentials are included in this archive.
