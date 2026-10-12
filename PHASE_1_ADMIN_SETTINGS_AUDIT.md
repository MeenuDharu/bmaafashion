# BMAA Fashion — Phase 1 Admin-Controlled Settings

## Changes in this build

### Admin → Settings → Products → Order & Checkout
- **Online Payment (Razorpay):** Admin can turn new online-payment checkout off/on. When disabled, the checkout hides the online-payment option and only allows COD if COD is enabled. The server also rejects non-COD order creation while online payments are disabled.
- **Cash on Delivery (COD):** Existing admin switch remains. The server rejects COD orders unless the switch is enabled.
- **Minimum Order Amount:** Admin can set a minimum merchandise subtotal in INR; `0` disables the minimum. The checkout shows a helpful validation message and the server validates it again before creating the order.
- **Auto-cancel hours** and **delivery message:** Existing settings remain available.

### Existing settings already available in Admin
The existing Settings page includes store branding, fonts/colors, homepage slides and banners, announcement bar, featured categories, shipping and returns policy text, GST policy rate, contact details, social links, SEO metadata, promotional banners, footer links/newsletter, maintenance mode, WhatsApp widget, homepage section visibility, popup/coupon messaging, countdown timer, trust badges, product listing display/sort, new-product badge duration, low-stock display threshold, COD, auto-cancel duration, delivery message, analytics IDs, cookie consent, and inner-page banners.

The Commerce Features admin page separately provides coupon controls (including first-order/repeat-customer restrictions), shipping rules by destination, carrier/tracking templates, returns, gift cards, abandoned-cart features, permissions, and audit logs.

## Important limitations / security boundary
- This is a Phase 1 increment, not a claim that every conceivable store behaviour is now configurable. Settings must be audited feature-by-feature against the actual storefront and backend before calling the project fully admin-controlled.
- Payment provider secrets, database credentials, email passwords/API keys, session secrets, and other credentials must stay in server environment variables/secret management. They must never be returned by public settings endpoints or placed in browser code.
- Existing product/variant inventory quantities remain managed through product/variant administration; the global low-stock setting controls the display threshold but does not replace per-product/per-variant stock quantities.
- No database migration is expected for these changes because `orderSettings` is already stored in the existing JSONB `site_settings` column. Back up the database before deployment as usual.

## Deployment verification checklist
1. Run `npm ci` in a clean working copy.
2. Run `npm run check` and `npm run build`.
3. In Admin → Settings → Products, turn COD off and verify COD orders are rejected by the server; turn it on and verify COD works.
4. Turn Online Payment off and COD on; verify checkout offers only COD and server rejects a direct Razorpay order-creation attempt.
5. Set minimum order amount to ₹1,000; verify a ₹999 merchandise subtotal is blocked and ₹1,000 is allowed (shipping/tax are calculated separately).
6. Set minimum order amount back to `0` if no minimum is required.
7. Test on staging before production and keep payment credentials only in server-side environment variables.

## Scope still requiring a dedicated audit before Phase 1 can be called complete
- Whether global product listing settings are applied consistently on every listing/search/category page.
- Whether global low-stock thresholds are applied consistently to product and variant stock warnings.
- Automatic cancellation worker/scheduler behaviour versus the configured `autoCancelHours` value.
- Whether all checkout/cart surfaces consistently display the same shipping, tax, coupon, gift-card, loyalty, and minimum-order calculations.
- Whether each carrier/shipping-rule entry supports edit as well as create/delete, and whether every destination edge case is covered.
- Whether payment provider status/configuration can be safely tested from admin without exposing secrets.
