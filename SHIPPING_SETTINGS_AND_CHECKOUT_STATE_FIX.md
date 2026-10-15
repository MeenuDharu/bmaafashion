# Shipping Settings and Checkout State Fix

Changes in this update are limited to the shipping settings location and state-based checkout validation:

- Shipping rate rules remain under Admin → Commerce Features → Delivery.
- Site Settings → Policies no longer offers editable shipping cost or free-shipping threshold fields; it retains delivery estimate and shipping policy text.
- Cart drawer labels shipping as calculated at checkout because no destination address has been selected there.
- Checkout requires an explicitly selected saved address or a completed guest address with a state and country before proceeding.
- Address state fields use canonical Indian state/UT options so they match the state-wise rules configured in Commerce Features.
- The shipping quote API rejects requests without a destination state and country.
- Checkout quote and secure order creation use Commerce shipping rules; if no destination rule matches, the existing ₹60 per two-item default remains. A rule-specific free-shipping threshold continues to apply.
- Quantity calculation remains `ceil(total quantity / 2) × charge per group`; state-specific rules take priority over country-wide rules.

No database migration is required. Existing `.env` and `.git` files are intentionally not included in the shareable ZIP. Keep your local `.env` file in place when applying these source changes.
