# BMAA Fashion - Site Settings Upgrade

This version makes the checkout use the Admin Site Settings as the authoritative source for pricing rules.

## Checkout rules
- GST uses `policies.gst.rate`.
- Standard shipping uses `policies.shipping.shippingCost`.
- Free shipping applies when the taxable subtotal reaches `policies.shipping.freeThreshold`.
- Active promotion codes are validated on the server.
- Promotions support `percentage` or `fixed` discounts via `discountType` and `discountValue`.
- Older promotions without `discountValue` remain compatible when their message contains a percentage such as `15% off`.
- GST is calculated after the promotion discount.
- COD is only accepted when `orderSettings.codEnabled` is enabled.
- Product prices, stock, discount, shipping, GST and final total are calculated server-side; browser totals are display-only.
- Guest checkout now preserves size/color variants.

## Admin
The Promotions settings now include discount type/value, and Shipping Policy now includes standard shipping cost.

## Database
No new database columns are required for this upgrade. Promotion discount metadata is stored in the existing `site_settings.promotions` JSON field.
