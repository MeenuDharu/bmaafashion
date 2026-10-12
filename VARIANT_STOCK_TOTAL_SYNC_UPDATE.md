# Variant stock total synchronization

## Behaviour
- Whenever an admin creates, edits, deletes, or adjusts stock for a variant through the shared variant storage, the parent product `inStock` is recalculated as the sum of every variant's `stockQuantity`.
- When editing a product that already has variants, the server ignores a conflicting parent stock value and preserves the calculated total.
- Admin product forms explain that stock for variant-based products is managed from the variant manager.
- Products without variants retain the normal manually managed product stock quantity.

## Example
Size S = 5, M = 8, L = 7; parent product stock is automatically 20. If the admin changes M to 10, the parent total becomes 22. If a variant is removed, its stock is removed from the total.

## Verify before production
Run `npm ci`, `npm run check`, and `npm run build`; then test variant create/edit/delete and product edit in a staging database. This patch has not been verified by a completed build in this environment.
