# BMAA Fashion – Production Commerce Upgrade

This upgrade is additive and is based on the TypeScript-cleaned project baseline.

## Implemented

### Customer storefront
- Advanced server-side product search endpoint (name/description/SKU/category/size/color/price).
- Product recommendations endpoint.
- Recently viewed products for users and guest sessions.
- Product comparison with a maximum of four products.
- Delivery-pincode serviceability lookup with delivery days, shipping charge and COD availability.
- Advanced coupon validation with percentage/fixed discount, minimum order, maximum discount, usage limits, per-customer limits, first-order-only, dates, product/category restrictions.
- Abandoned-cart tracking.
- Customer support ticket creation and threaded responses.
- Structured returns/refund requests.
- Loyalty points account/history and secure earning/redemption (100 points = ₹10).
- Referral codes and completed-order referral rewards.
- Gift-card balance checking and secure order-time redemption.
- Print-ready GST invoice endpoint.
- SEO `robots.txt` and dynamic `sitemap.xml`.
- Compare button on product detail and recently-viewed display.
- Checkout pincode check, advanced coupon validation, gift card application and loyalty points redemption.

### Admin
- Commerce Features admin page.
- Support ticket management.
- Returns/refunds management.
- Advanced coupon management.
- Gift-card creation/management.
- Delivery-pincode management.
- Shipping carrier configuration.
- Abandoned-cart visibility and recovery reminder support.
- Admin permission records.
- Admin audit log.
- Order shipping/tracking update endpoint.

### Automation / operations
- `npm run commerce:maintenance` for stale recently-viewed cleanup and abandoned-cart email reminders.
- Existing email infrastructure is reused; no new SMTP dependency is introduced.

## Database

The source schema is updated in `shared/commerceFeatures.ts` and re-exported from `shared/schema.ts`.

A human-readable additive SQL migration is included at:

`migrations/0002_production_commerce_features.sql`

Because this project already uses Drizzle, the normal deployment path is:

```bash
npm install
npm run check
npm run db:push
```

Review the generated Drizzle plan before applying it to production. The included SQL is also available for controlled/manual migration.

## Environment variables for invoice branding

Optional:

```env
BUSINESS_NAME=BMAA Fashion
BUSINESS_GSTIN=YOUR_GSTIN
BUSINESS_ADDRESS=YOUR_BUSINESS_ADDRESS
DOMAIN=https://bmaafashion.com
```

If GSTIN/address are not configured, the invoice explicitly displays that they are not configured rather than inventing them.

## Abandoned-cart reminder scheduling

Run manually:

```bash
npm run commerce:maintenance
```

For production, schedule it with cron/PM2/your hosting scheduler. A one-hour stale-cart threshold is used and each cart receives at most one reminder until its state changes.

## Important safety note

The existing secure order calculation remains server-side. Coupon, loyalty and gift-card amounts are recalculated/validated on the server; browser-submitted totals are not trusted.

The previous TypeScript-cleanup ZIP is preserved separately as the rollback baseline.

## Validation performed in this build environment

- All TypeScript/TSX source files were syntax/transpilation checked: 0 syntax errors.
- Modified backend and frontend files were individually transpilation checked.
- `strict: true` remains enabled in `tsconfig.json`.
- A complete `tsc --noEmit` could not be executed here because the container's dependency installation timed out before a complete `node_modules` tree was available. Therefore this package does **not** claim a verified 0-error semantic TypeScript check.
