# BMAA Fashion — Shipping, Email Verification, and Variant Fixes

## Shipping controls
- **Admin → Settings → Policies → Shipping**: configure the default shipping charge, free-shipping threshold, delivery estimate, and policy text.
- **Admin → Commerce Features → Delivery**: configure destination-specific country/state shipping rules, shipping charge, free-shipping threshold, priority, and carrier tracking templates.
- The checkout shipping calculator and order creation use the configured policy and matching destination rule. A destination-specific rule overrides the default policy values.

## Email verification fixes
- Verification link requests are now idempotent for the same unexpired token. If the token was already used by a duplicate browser request or an email link scanner, the page can receive an already-verified success response rather than a false failure.
- Expired verification tokens are cleared by the existing cleanup routine.
- **Admin → Users → View Details → Account Status** shows the actual `emailVerified` value.
- An admin-only `PATCH /api/admin/users/:id/verify-email` endpoint allows a permitted administrator to manually verify an account. It checks that the user exists, does not expose password fields, and clears the outstanding verification token.

## Variant dialog fix
- All action buttons in `ProductVariantsManager` explicitly use `type="button"`. This component sits inside the parent product-edit form; without an explicit button type, browser defaults could submit the parent form and close the product popup when an admin clicks a variant action.

## Verification status
- Source changes have been applied. This environment did not have `node_modules`, so `npm run check` and `npm run build` have not been run. Install the project's locked dependencies and run both checks before deploying.
