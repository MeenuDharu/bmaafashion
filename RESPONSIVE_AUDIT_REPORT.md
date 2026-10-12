# BMAA Fashion — Responsive Audit

## Scope and verification status

- Reviewed source files under `client/src`.
- Page components found: **49**.
- Components containing shared dialog/alert-dialog content: **19** files; static source count is not equivalent to a browser-tested popup count.
- This is a **source-level audit and targeted shared-component hardening**, not a completed visual QA run at every device width. Browser automation and a successful production build were not available in this pass.

## Changes included in this update

1. Shared Radix `DialogContent` is constrained to viewport width and height, uses responsive padding, and scrolls vertically when its content is taller than the screen.
2. Admin layout flex children use `min-w-0` so wide tables/forms are less likely to force the entire page wider than the viewport.
3. Admin main content uses responsive padding and allows vertical scrolling while preventing accidental horizontal overflow at the content shell.
4. Global safety rules constrain media to the available width and add a reusable `[data-responsive-scroll]` hook for wide tables/grids.

## Page inventory reviewed

- `client/src/pages/About.tsx`
- `client/src/pages/Addresses.tsx`
- `client/src/pages/Categories.tsx`
- `client/src/pages/Checkout.tsx`
- `client/src/pages/CompareProducts.tsx`
- `client/src/pages/Contact.tsx`
- `client/src/pages/DesignShowcase.tsx`
- `client/src/pages/EmailVerificationPending.tsx`
- `client/src/pages/ForgotPassword.tsx`
- `client/src/pages/FreshProduce.tsx`
- `client/src/pages/GiftCards.tsx`
- `client/src/pages/GuestOrderLookup.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/Loyalty.tsx`
- `client/src/pages/OrderAccess.tsx`
- `client/src/pages/OrderDetail.tsx`
- `client/src/pages/OrderHistory.tsx`
- `client/src/pages/PrivacyPolicy.tsx`
- `client/src/pages/ProductDetail.tsx`
- `client/src/pages/Products.tsx`
- `client/src/pages/Profile.tsx`
- `client/src/pages/Referrals.tsx`
- `client/src/pages/Register.tsx`
- `client/src/pages/ResetPassword.tsx`
- `client/src/pages/ReturnPolicy.tsx`
- `client/src/pages/Services.tsx`
- `client/src/pages/ShippingPolicy.tsx`
- `client/src/pages/Support.tsx`
- `client/src/pages/TermsOfService.tsx`
- `client/src/pages/VerifyEmail.tsx`
- `client/src/pages/Wishlist.tsx`
- `client/src/pages/admin/AdminAnalytics.tsx`
- `client/src/pages/admin/AdminCategories.tsx`
- `client/src/pages/admin/AdminCommerceFeatures.tsx`
- `client/src/pages/admin/AdminCustomers.tsx`
- `client/src/pages/admin/AdminDashboard.tsx`
- `client/src/pages/admin/AdminExports.tsx`
- `client/src/pages/admin/AdminInventory.tsx`
- `client/src/pages/admin/AdminMessageTemplates.tsx`
- `client/src/pages/admin/AdminNotifications.tsx`
- `client/src/pages/admin/AdminOrders.tsx`
- `client/src/pages/admin/AdminProducts.tsx`
- `client/src/pages/admin/AdminReviews.tsx`
- `client/src/pages/admin/AdminSettings.tsx`
- `client/src/pages/admin/AdminTopProducts.tsx`
- `client/src/pages/admin/AdminUsers.tsx`
- `client/src/pages/admin/AdminWhatsappAnalytics.tsx`
- `client/src/pages/not-found.tsx`

## Components with dialog/alert-dialog markup

- `client/src/components/AddressSelector.tsx` — 2 dialog-content instance(s) found by source scan
- `client/src/components/ProductCard.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/components/ProductImageGallery.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/components/ProductVariantsManager.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/components/VariantSelectorDialog.tsx` — 2 dialog-content instance(s) found by source scan
- `client/src/components/admin/ExportConfigModal.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/components/ui/command.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/pages/Addresses.tsx` — 2 dialog-content instance(s) found by source scan
- `client/src/pages/GuestOrderLookup.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/pages/Profile.tsx` — 3 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminCategories.tsx` — 2 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminCustomers.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminInventory.tsx` — 3 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminMessageTemplates.tsx` — 3 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminNotifications.tsx` — 1 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminOrders.tsx` — 3 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminProducts.tsx` — 2 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminReviews.tsx` — 2 dialog-content instance(s) found by source scan
- `client/src/pages/admin/AdminUsers.tsx` — 1 dialog-content instance(s) found by source scan

## Risks that still need page-by-page visual testing

- Custom modal implementations that do not use the shared `DialogContent` may need their own `max-height`, viewport width, and scroll handling.
- Wide tables, variant grids, charts, filter toolbars, and product forms need checks at 320px, 375px, 768px, 1024px, and desktop widths.
- Sticky headers/footers inside dialogs should be checked to ensure they do not cover form fields or action buttons.
- Test keyboard focus, Escape-to-close, close button visibility, and screen-reader labels for every dialog.
- Global horizontal overflow clipping can prevent page-wide sideways scrolling; wide data tables should use a local scroll wrapper (for example, `data-responsive-scroll`) instead.
- Validate long translations/product names, validation messages, empty/loading/error states, and mobile virtual keyboard behavior.

## Manual regression checklist

- [ ] Customer pages: Home, Products, Product Detail, Cart, Checkout, Login/Register, Profile, Addresses, Orders, Wishlist, Compare, Support and policy pages.
- [ ] Admin pages: Dashboard, Products (create/edit/variant dialogs), Categories, Orders, Customers, Users, Inventory, Reviews, Analytics, Exports, Settings, Commerce Features, Notifications, Message Templates, Top Products and WhatsApp Analytics.
- [ ] Test every create/edit/delete/confirm popup and ensure its title, content, close control and footer buttons remain visible or scrollable.
- [ ] Test mobile navigation drawer and confirm sidebar can open and close at narrow widths.
- [ ] Confirm no page has horizontal overflow except intentionally scrollable tables/grids.
- [ ] Run `npm run check` and `npm run build` after installing dependencies.

## How to test

1. Apply the included files to the project, preserving paths.
2. Run `npm ci`, `npm run check`, and `npm run build`.
3. Start the app and test the listed routes at the viewport widths above. Check DevTools Console and Network for runtime errors.
4. Treat any route or dialog not manually exercised as not yet visually verified.
