# BMAA Fashion Admin Product and User Management Update

## Included
- Product detail dialog in Admin → Products.
- Shop visibility control in create/edit product forms, visibility badge/filter, and quick Show/Hide action.
- Public product listing/category/search queries filter hidden products; public product detail and variant endpoints return 404 for hidden products.
- Admin product listing includes hidden products.
- Admin user create/edit, activate/deactivate, and delete/deactivate actions. User deactivation preserves order history.
- Admin API checks prevent self-deactivation and demotion/deactivation of the last active administrator.
- Login rejects deactivated accounts.

## Database migration required
Before deploying application code, back up production and apply:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/20261014_admin_product_visibility_user_status.sql
```

The migration adds `products.is_visible` and `users.is_active`, both defaulting to `true` so existing products/users remain visible/active. Review the SQL before applying it to production.

## Verification limitation
The ZIP was inspected and source changes were made. Dependency installation timed out in this environment, so TypeScript checks and a production build could not be run here. Run `npm ci`, `npm run check`, and `npm run build` locally before deployment. Test in staging first.
