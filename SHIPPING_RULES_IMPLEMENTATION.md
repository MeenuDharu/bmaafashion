# BMAA Fashion Shipping Rules

Updated 2026-10-08.

## Business model
- Primary market: India.
- Customers are not blocked by pincode/serviceability checks.
- Shipping can be charged by default, with free shipping above a configured order value.
- State-specific and country-specific shipping rules can override the default charge.
- Individual products can have an additional per-unit shipping charge.
- Product shipping charges are added even when the normal/base shipping component becomes free. This supports products that always incur special shipping/handling costs.
- Shipping is calculated again on the server when the order is created; browser totals are never trusted.

## Admin configuration
Admin -> Commerce Features -> Delivery/Shipping:
- Rule name
- Country (optional; blank means all countries)
- State (optional; blank means all states in that country)
- Shipping charge
- Free shipping threshold
- Priority (lower number is preferred)

Admin -> Products:
- Apply product shipping charge
- Product Shipping Charge (per item)

## Examples
Default India: ₹99, free above ₹2,000.
Tamil Nadu: ₹79, free above ₹1,500.
USA: ₹1,999, no free threshold.
Special saree/product: additional ₹100 per item.

If an order has a special-shipping product, its product charge is added separately. If the order reaches the free-shipping threshold, only the normal/base shipping is waived.

## Removed
Pincode availability/serviceability and pincode admin management are not part of this implementation.
