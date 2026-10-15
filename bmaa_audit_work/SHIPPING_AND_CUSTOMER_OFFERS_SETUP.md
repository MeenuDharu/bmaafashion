# BMAA Fashion — Shipping and Customer Offers Setup

## Admin navigation

- **Admin → Commerce Features → Delivery**: create destination-based shipping rules and carrier tracking templates.
- **Admin → Settings → Policies → Shipping Policy**: set the default shipping fee, free-shipping threshold and delivery estimate.
- **Admin → Commerce Features → Coupons**: create welcome/first-order and repeat-customer offers.
- **Admin → Settings → Products**: product-specific shipping flags/charges are configured from product management where supported.

## Example offer setup

### Welcome offer
1. Open Admin → Commerce Features → Coupons.
2. Code: `WELCOME10`.
3. Discount type: Percentage; value: `10`.
4. Set a minimum order and optional maximum discount.
5. Enable **First order only (welcome offer)**.
6. Keep **Previous order required (next-purchase offer)** disabled.
7. Create the coupon and activate it.
8. If you want to advertise it in the storefront popup, configure the same code in Admin → Settings → Advanced → Popup Settings. The popup only advertises the code; coupon validation enforces eligibility.

### Repeat-purchase offer
1. Create another coupon, e.g. `COMEBACK15`.
2. Discount type: Percentage; value: `15`.
3. Set the minimum order, maximum discount and usage limits.
4. Enable **Previous order required (next-purchase offer)**.
5. Ensure **First order only** is disabled.
6. Create and activate the coupon.

Discount values above are examples; choose values appropriate for the business margin. Customers must provide an account or the same email address used for their previous order for eligibility checks to match.

## Shipping configuration

- The default charge and free-shipping threshold are in Settings → Policies → Shipping Policy.
- Country/state overrides are in Commerce Features → Delivery → Shipping Charges by Destination.
- Product-specific extra shipping charges are part of the product shipping fields and are calculated per quantity when enabled.
- The checkout server recalculates shipping; do not trust a browser-submitted shipping total.

## Database update

This update adds `repeat_customer_only` to the `coupons` table. Back up the database first, then apply:

```sql
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS repeat_customer_only boolean NOT NULL DEFAULT false;
```

File: `migrations/0042_add_repeat_customer_coupon.sql`.

Do not run a broad production `db:push` solely for this column if it currently fails on an unrelated primary-key diff. Apply the reviewed SQL migration after confirming the target database and taking a backup.

## Behaviour notes

- First-order eligibility checks prior non-cancelled orders by authenticated user ID and/or checkout email.
- Repeat-customer eligibility requires at least one prior non-cancelled order by the same account/email.
- The coupon is still entered at checkout; this patch does not automatically insert a discount into the cart or issue an email automatically.
- The existing shipping rule system remains responsible for country/state charges, free-shipping thresholds and carrier settings.
