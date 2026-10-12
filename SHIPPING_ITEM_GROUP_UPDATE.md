# Shipping item-group update

## Rule
- Shipping is based on total item quantity across all cart lines.
- Each group includes 2 items; each group (or partial group) costs the configured destination rule charge.
- Formula: `ceil(totalQuantity / 2) * shippingCharge`.
- With ₹60 configured: 1–2 items ₹60, 3–4 ₹120, 5–6 ₹180.
- State-specific rule takes precedence over country-wide rule. The admin state field is a dropdown.
- Checkout quote and secure order creation use the same quantity-group calculation. Product-specific shipping charges are not added on top, to avoid double charging.
- Existing free-shipping thresholds remain supported.

## Admin
In Admin → Commerce Features → Delivery, choose a state from the dropdown and enter the charge per 2-item group. Set ₹60 for Tamil Nadu to get the requested default behavior.

## Deployment caution
The source files were updated, but a full TypeScript check, database integration test, and production build have not been verified in this environment. Test with cart quantities 1 through 6 and at least two states before production deployment.
