# BMAA Fashion – Promotions and Shipping Admin Update

## Admin-controlled first and repeat purchase offers

Go to **Admin → Commerce Features → Coupons**.

- Create a welcome coupon and select **First purchase only** to restrict it to customers with no previous non-cancelled order.
- Create a repeat-customer coupon and select **Existing customer only** to require a previous non-cancelled order.
- Configure percentage/fixed discount, minimum order amount, optional maximum discount, total usage limit, and uses per customer.
- The first-purchase and repeat-customer options are mutually exclusive.
- These are purchase eligibility rules, not a discount triggered merely by logging in. Customers must enter the coupon code unless a separate automatic-promotion flow is implemented.

## Admin-controlled shipping

### State/country shipping rules

Go to **Admin → Commerce Features → Delivery**.

- Add, edit, or remove destination rules.
- Set country, optional state, per-order shipping charge, optional free-shipping threshold, and priority.
- A state-specific rule takes precedence over a country-wide rule; priority chooses between rules of equal specificity.
- The same state-rule precedence is used in the quote endpoint and server-side order creation.

### Per-product / per-item shipping

Go to **Admin → Products**, create or edit a product, and configure the product shipping-charge toggle and charge. The charge is multiplied by the ordered quantity. Product-specific shipping is additional to the destination-based per-order charge and remains separate from the free-shipping threshold calculation.

## Validation status

This archive is a source update. TypeScript/build tests were not run because `node_modules` is not present in the workspace. After extracting into your project, run:

```bash
npm ci
npm run check
npm run build
```

Test the shipping quote and a test order using an address in a state with a specific rule, and another state that only matches the country-wide rule. Test welcome and repeat-customer coupon eligibility with separate test accounts.
