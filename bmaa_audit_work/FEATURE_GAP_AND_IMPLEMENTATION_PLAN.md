# BMAA Fashion — Customer & Admin Feature Plan

**Project:** BMAA Fashion e-commerce  
**Website:** https://bmaafashion.com/  
**Document version:** 1.0 — 10 October 2026

## Purpose

This document is the feature backlog for completing the customer storefront and admin operations. It separates features already documented in the current codebase from enhancements that should be implemented and tested. A feature listed as “existing / verify” must be tested in the deployed environment; this document alone does not prove that the feature is enabled or production-ready.

## Priority definitions

- **P0 — Launch-critical:** affects checkout correctness, money, stock, security, fulfilment or legal/customer trust.
- **P1 — Important:** improves daily operations, customer retention and support.
- **P2 — Growth:** marketing, merchandising and deeper reporting.
- **P3 — Advanced:** automation and optimisation after core flows are stable.

## Customer / storefront features

| Priority | Feature | Expected behaviour | Admin setup / dependency | Acceptance test |
|---|---|---|---|---|
| P0 | Account registration, login and password reset | Customers can securely access their account; guest checkout remains available if enabled. | Authentication, email delivery and session settings | Register, verify, sign in, reset password and sign out. |
| P0 | Product catalogue and categories | Browse, search and filter active products. | Product/category management | Inactive products do not appear in public listings. |
| P0 | Size/colour variants | Selected variant controls SKU, price, images and stock. | Variant inventory management | Different sizes/colours show their own stock and price. |
| P0 | Cart and checkout validation | Server recalculates item price, discounts, tax, shipping and final total. | Tax, shipping and promotion rules | Tampered browser price/total is ignored. |
| P0 | Payment confirmation | Payment status comes from verified provider callbacks/server checks. | Razorpay keys, webhook and callback URL | Failed/pending payment is not marked paid. |
| P0 | Order history and status | Customer sees their orders and valid statuses. | Order operations | Customer cannot change order/payment status via API. |
| P0 | Cancellation, returns and refunds | Requests follow configured policy and are tracked. | Return policy and admin approval workflow | Ineligible request is blocked; refund status follows provider confirmation. |
| P0 | Shipping fee and serviceability | Show correct shipping fee, delivery estimate and COD availability for supported destinations. | Default fee, pincode/region rules, free-shipping threshold, carrier settings | Test supported and unsupported pincodes and threshold boundaries. |
| P0 | Privacy, terms and policy pages | Customers can read current privacy, shipping, returns and cancellation policies. | Admin-managed policy content | Links work on desktop and mobile before checkout. |
| P1 | Wishlist and product comparison | Save products and compare up to the supported limit. | Feature toggles / account support | Wishlist persists for signed-in customers; comparison handles removed products. |
| P1 | Reviews and ratings | Submit reviews; display only reviews allowed by moderation rules. | Review moderation | Pending/hidden reviews are not publicly displayed. |
| P1 | Recently viewed and recommendations | Relevant products appear without leaking another customer's history. | Recommendation configuration | Guest and signed-in histories remain appropriately isolated. |
| P1 | Back-in-stock notification | Customer subscribes to a specific size/colour variant and receives a notice when available. | Waitlist and email configuration | Restock one variant; only subscribers for that variant are notified. |
| P1 | Customer support tickets | Customers create and track support requests. | Support inbox and response templates | Customer sees only their own tickets. |
| P1 | Order notifications | Send reliable order, payment, dispatch and refund status messages. | SMTP/email templates; optional SMS/WhatsApp provider | Failed sends are logged and can be retried; no false “sent” status. |
| P1 | Coupon / welcome offer | Eligible first-time customer can use one configured welcome offer. | Offer enabled, limits, dates, minimum spend and first-order rule | Repeated logins do not create repeated eligibility. |
| P1 | Repeat-purchase offer | Eligible returning customer can redeem a next-purchase offer once under its rules. | Previous-order eligibility, expiry and usage limits | Cancelled/unpaid orders do not incorrectly qualify. |
| P1 | Loyalty and referral | Customers see balances and rules; rewards are issued only after qualifying events. | Loyalty conversion, referral reward and anti-abuse rules | Duplicate callbacks/orders do not duplicate rewards. |
| P1 | Gift cards | Customers check balance and redeem within balance and order rules. | Gift-card issuance and expiry | Cannot redeem more than the available balance. |
| P2 | Search autocomplete and richer filters | Suggest matching products and filter by size, colour, price, category and availability. | Search index/product attributes | Search remains responsive and returns only active products. |
| P2 | Product bundles / frequently bought together | Offer curated bundles with transparent savings. | Bundle definitions and stock policy | Bundle checkout validates every component's stock. |
| P2 | Size guide / fit help | Show size chart and measurement guidance by product/category. | Size-chart management | Chart is accessible on mobile and linked to the right product. |
| P2 | Customer marketing preferences | Let customers manage email/WhatsApp marketing consent. | Consent capture and unsubscribe process | Opt-out is respected by every marketing campaign. |
| P2 | SEO and social sharing | Product/category metadata, canonical URLs, sitemap and structured data. | SEO fields and domain settings | Validate metadata and avoid indexing admin/account pages. |
| P3 | Personalised recommendations | Use consent-aware purchase/browsing signals to tailor products. | Recommendation policy and privacy controls | Recommendations do not expose another user's activity. |
| P3 | Multi-currency / preorders | Only if business strategy requires them. | Currency conversion, preorder inventory and disclosure rules | Currency and preorder terms are clear at checkout. |

## Admin features and setup

| Priority | Admin area | Required controls | Acceptance test |
|---|---|---|---|
| P0 | Dashboard | Sales/order summaries, pending fulfilment, low-stock alerts and failed-operation indicators. | Counts reconcile with order records and filters. |
| P0 | Products/categories | Create/edit/archive products, categories, images, descriptions and SEO fields. | Validation prevents invalid price/category data. |
| P0 | Variant inventory | SKU, barcode if used, size, colour, variant price, compare-at price, stock, low-stock threshold, weight and variant images. | Duplicate size/colour combination is rejected; stock cannot become negative. |
| P0 | Orders | Search/filter, inspect line items and payment, update allowed statuses, fulfilment and tracking. | Status transitions are logged and cannot falsify payment. |
| P0 | Shipping settings | Default fee, free-shipping threshold, supported regions/pincodes, delivery estimate, COD availability, carrier settings and tracking. | Checkout and admin order totals use the same server-side rules. |
| P0 | Tax / invoice settings | Business name/address/GSTIN, tax rules, invoice numbering and invoice download. | Invoice matches paid order totals; missing business details are not fabricated. |
| P0 | Payment settings | Razorpay keys/webhook status, COD toggle, refund workflow and test/live mode indicators. Secrets stay server-side. | Test and live credentials are not mixed; webhook signature is verified. |
| P0 | User and staff access | Role-based permissions for product, order, refund, customer and settings actions. | Staff cannot perform actions outside their role. |
| P0 | Audit/security | Audit log for sensitive admin changes; rate limits, secure sessions, input validation and secret management. | Sensitive actions record actor/time/result; unauthorised calls fail. |
| P1 | Promotions / offer engine | Welcome, repeat-purchase, coupon, flash-sale and product/category restrictions; schedules, usage limits, stacking and customer eligibility. | Server validates every rule; no client-side discount trust. |
| P1 | Customer management | Customer search, order history, support context, consent status and safe data export. | Staff access is permission-checked and audited. |
| P1 | Returns/refunds | Policy, request queue, reason, evidence, approval/decline, return status and provider refund reference. | Refund only marked complete after provider confirmation. |
| P1 | Support management | Ticket queue, assignment, priority, internal notes, replies and response templates. | Customer-visible replies are distinguished from internal notes. |
| P1 | Notification centre | Email template management, queue status, retries, delivery errors and event-trigger settings. | “Queued”, “sent” and “failed” are distinct states. |
| P1 | Back-in-stock/waitlist | Variant-level subscriber list, notification state and unsubscribe controls. | No duplicate notifications for the same restock event. |
| P1 | Gift card / loyalty / referral admin | Issue/revoke gift cards, inspect ledger, set earning/redemption and referral rules. | All balance changes are auditable and idempotent. |
| P1 | Abandoned cart | Eligible cart list, reminder schedule, consent checks and suppression after purchase. | Purchased/opted-out customers are not sent reminders. |
| P2 | Reports and exports | Sales, orders, products, stock, discounts, returns, tax and customer retention reports. | Report totals reconcile with source records and date range. |
| P2 | Profit and margin analytics | Cost price, discounts, shipping cost and payment fees where data exists. | Unknown costs are shown as missing, not zero profit. |
| P2 | Supplier and purchase orders | Supplier records, restock orders, expected delivery and receiving stock. | Received quantities update the correct variant with history. |
| P2 | Content management | Homepage sections, banners, popups, trust badges, footer, policies and social links. | Changes are validated and previewed before publishing. |
| P2 | Marketing analytics | GA4/Meta events with consent controls and purchase event deduplication. | Purchase value/order ID match the server-confirmed order. |
| P3 | Forecasting and automation | Stock forecasts, replenishment suggestions and scheduled operational reports. | Recommendations explain assumptions and never adjust stock silently. |
| P3 | Multi-store / multi-currency | Separate locations, stock, pricing and tax only if expansion requires it. | Inventory and reporting remain separated by location/currency. |

## Recommended admin navigation

1. **Overview** — dashboard, alerts and operational health.
2. **Catalogue** — products, categories, variants, images and size charts.
3. **Inventory** — stock by variant, low-stock alerts, stock movements and suppliers.
4. **Orders** — orders, fulfilment, tracking, cancellations, returns and refunds.
5. **Commerce Settings** — shipping, serviceability, tax, invoices and payment methods.
6. **Marketing** — coupons, welcome offer, repeat-purchase offer, flash sales, gift cards, loyalty and referrals.
7. **Customers** — profiles, consent, support and customer segments.
8. **Engagement** — reviews, waitlists, notifications, email templates and abandoned carts.
9. **Content & SEO** — homepage, banners, policies, metadata and sitemap.
10. **Reports** — sales, stock, margins, customer retention and exports.
11. **Administration** — staff roles, permissions, audit logs, integrations and security.

## Suggested implementation sequence

### Phase 1 — Checkout and operations correctness (P0)
- Verify variant ID flows through product selection → cart → checkout → order line → stock decrement.
- Verify all prices, discounts, taxes and shipping fees are calculated on the server.
- Verify Razorpay callbacks/webhooks, payment reconciliation and refund confirmation.
- Finish role permissions, audit logging, backups and production migration safety.
- Validate shipping rules, COD rules, tax invoices and policy pages.

### Phase 2 — Retention and support (P1)
- Complete welcome and repeat-purchase offer lifecycle, including clear eligibility, expiry and redemption records.
- Complete notification queue visibility/retries and order-event templates.
- Finish variant-level back-in-stock notifications.
- Validate customer support, returns/refunds, loyalty, referral and gift-card ledgers.

### Phase 3 — Growth and reporting (P2)
- Search autocomplete and advanced filters.
- Better merchandising, size charts, bundles and review improvements.
- Sales, returns, stock and customer retention reports.
- Marketing consent and analytics integrations.

### Phase 4 — Optimisation (P3)
- Supplier purchase orders, forecasting, scheduled reports and personalisation.
- Multi-currency or multi-store only when required by business operations.

## Definition of done for each feature

- Admin can configure it without editing source code, where it is intended to be configurable.
- API validates permissions, inputs and business rules on the server.
- Database changes have a reviewed additive migration and backup/rollback plan.
- Customer UI works on mobile and desktop, including loading, empty, success and error states.
- TypeScript check, production build and relevant API/UI tests pass.
- Logs and audit records cover sensitive actions; secrets and customer data are not leaked.
- Documentation and screenshots are updated to match the actual deployed UI.

## Current limitations and cautions

- The current codebase has several commerce modules and admin pages already documented in `COMMERCE_FEATURE_UPGRADE_2026-10-08.md` and `FINAL_PRODUCTION_AUDIT.md`; use those documents as the initial implementation inventory.
- Treat all “existing” features as requiring end-to-end verification on the deployed site.
- Do not apply `drizzle-kit push` or destructive seed scripts to production without a database backup and reviewing the schema diff.
- Keep payment, email and carrier secrets in server-side environment variables only.
- This backlog is a planning artifact. Adding this file does not mean every item above has been implemented.
