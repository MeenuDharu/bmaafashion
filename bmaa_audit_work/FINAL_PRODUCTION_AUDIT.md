# BMAA Fashion – Final Production Audit

## Completed
- Customer authentication and guest checkout flow audited.
- Product, variant, stock and cart flow audited.
- Server-side promotion, GST and shipping calculation retained from previous pass.
- Customer order cancellation, return request and order history routes fixed.
- Customer order status tampering blocked.
- Profile account deletion compatibility fixed.
- Waitlist persistence/API added.
- Admin waitlist read/delete endpoints added.
- Admin notification UI endpoint compatibility added.
- Recipient groups now resolve real users instead of mock counts.
- Bulk email notifications now queue real email jobs and use the authenticated admin as creator.
- Unsupported SMS/WhatsApp bulk channels are reported rather than falsely marked as delivered.
- Admin-only Razorpay refund endpoint added; order is marked refunded only after Razorpay confirms success.
- Message template CRUD/approval flow verified against existing server routes.

## Database
Run the existing Drizzle migration/push process after deploying because `waitlist_entries` is a new table:
`npm run db:push`

## Important operational requirement
Bulk email delivery requires the project's SMTP configuration and email queue worker to be configured correctly. Razorpay refunds require valid Razorpay API credentials.
