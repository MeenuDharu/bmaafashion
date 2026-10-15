# BMAA Fashion – Global Automatic Discount

## What changed
- Added `productSettings.globalDiscountEnabled` and `productSettings.globalDiscountPercent` to the existing site settings JSON configuration.
- The default is enabled at 30%; existing settings without these keys also fall back to enabled at 30%.
- Added Admin Settings controls in the Products tab so an authorised admin can enable/disable the storewide discount and adjust the percentage (0–90%).
- Added Flipkart-style pricing to product cards, product detail pages, related/recent products, featured products, category previews, wishlist, variant selector, cart slideout and checkout: bold offer price, crossed-out original price, green “% off”.
- Checkout totals are shown using the offer price and the automatic discount is shown in the price breakdown.
- Secure backend order creation recalculates the offer price from the current database product/variant price and saved site settings; it does not trust browser-submitted prices. Original product and variant prices are not changed.
- No database migration is needed because the setting is stored in the existing `site_settings.product_settings` JSONB column.

## Validation
The code was not fully type-checked or production-built in this environment because dependencies could not be installed: npm registry requests failed with `EAI_AGAIN`. After extracting this project, run:

```bash
npm ci
npm run check
npm run build
```

Then open Admin Settings → Products, verify Automatic Storewide Discount is enabled and Default Discount is 30, and test a checkout before deploying to production.
