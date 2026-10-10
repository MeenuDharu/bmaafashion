# BMAA Fashion TypeScript Cleanup V3

This version addresses the latest checker report:
- typed product-level shipping fields to match the additive migration
- typed SMS/WhatsApp notification preference JSON
- fixed PAYMENT_FAILED enum usage
- fixed nullable date formatting and customer date checks
- added missing order-with-items storage method
- added missing CSV generation helper
- added missing customer segmentation/search/insight implementations
- added missing notification template/bulk notification schema imports
- added compatibility for WhatsApp delivery webhook updates
- removed Drizzle query-builder reassignment patterns that caused strict typing failures
- fixed nullable inventory/order history fields
- added export fileName support where routes expect it
- fixed Admin Commerce page authenticated fetch closure ordering
- preserved strict TypeScript mode

The pincode serviceability feature remains removed. Shipping uses country/state rules, free-shipping thresholds, and product-level shipping charges.

Full semantic `npm run check` still needs to be run in an environment with a complete dependency installation.
