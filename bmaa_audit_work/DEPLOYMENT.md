# Bmaafashion Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Variables & Secrets

#### Required Secrets (Must be configured before deployment)

- [ ] `RAZORPAY_KEY_ID` - Production Razorpay Key ID
- [ ] `RAZORPAY_KEY_SECRET` - Production Razorpay Key Secret
- [ ] `SENDGRID_API_KEY` - SendGrid API key for transactional emails
- [ ] `TWILIO_ACCOUNT_SID` - Twilio Account SID for SMS notifications
- [ ] `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- [ ] `TWILIO_PHONE_NUMBER` - Twilio phone number (India format: +91XXXXXXXXXX)
- [ ] `TWILIO_WHATSAPP_NUMBER` - Twilio WhatsApp-enabled number (format: whatsapp:+14155238886)
- [ ] `SESSION_SECRET` - Strong random string for session encryption (generate with: `openssl rand -base64 32`)
- [ ] `JWT_SECRET` - Strong random string for JWT signing (generate with: `openssl rand -base64 32`)
- [ ] `DATABASE_URL` - PostgreSQL connection string (automatically provided by Replit)

#### Optional Secrets

- [ ] `ADMIN_EMAIL` - Admin notification email address (default: admin@bmaafashion.com)
- [ ] `FROM_EMAIL` - SendGrid verified sender email (default: noreply@bmaafashion.com)

### 2. Razorpay Production Setup

#### Switch from Test to Live Mode

1. Log into [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to Settings → API Keys
3. Switch to "Live Mode" toggle
4. Generate new Production API Keys
5. Update secrets:
   - Set `RAZORPAY_KEY_ID` to live key_id
   - Set `RAZORPAY_KEY_SECRET` to live key_secret
6. Verify webhook setup for order status updates

#### Razorpay Compliance

- [ ] Complete KYC verification
- [ ] Add business details and GST number
- [ ] Configure settlement account (bank details)
- [ ] Set up payment methods (UPI, Cards, Netbanking, Wallets)
- [ ] Review and accept Razorpay terms

### 3. SendGrid Email Configuration

#### Production Email Setup

1. Log into [SendGrid Dashboard](https://app.sendgrid.com)
2. Navigate to Settings → Sender Authentication
3. Verify your domain (bmaafashion.com) or single sender email
4. Create API Key with "Mail Send" permissions
5. Update `SENDGRID_API_KEY` secret
6. Configure templates:
   - Order Confirmation Email
   - Shipping Notification Email
   - Delivery Notification Email
   - Password Reset Email
   - Email Verification

#### Email Compliance

- [ ] Verify sender domain with DKIM/SPF records
- [ ] Add unsubscribe link to marketing emails
- [ ] Review CAN-SPAM compliance
- [ ] Set up dedicated IP (optional, for high volume)

### 4. Twilio SMS & WhatsApp Setup

#### SMS Configuration

1. Log into [Twilio Console](https://console.twilio.com)
2. Navigate to Phone Numbers → Manage → Active Numbers
3. Select or purchase India-compatible phone number
4. Update `TWILIO_PHONE_NUMBER` secret
5. Verify SMS delivery to Indian carriers

#### WhatsApp Configuration

1. Navigate to Messaging → Try it Out → WhatsApp
2. Request production access for WhatsApp Business API
3. Complete Facebook Business verification
4. Get approved WhatsApp message templates:
   - Order confirmation template
   - Shipping update template
   - Delivery notification template
5. Update `TWILIO_WHATSAPP_NUMBER` secret

#### Twilio Compliance

- [ ] Complete Twilio Trust Hub registration
- [ ] Register A2P 10DLC campaign (for US numbers)
- [ ] Verify Indian DLT registration for SMS (if required)
- [ ] Set up opt-in/opt-out mechanisms

### 5. Database Migration

#### Production Database Setup

1. Verify PostgreSQL database is created (Replit auto-provisions)
2. Run database migration:
   ```bash
   npm run db:push
   ```
   If data-loss warning appears:
   ```bash
   npm run db:push --force
   ```
3. Seed initial admin user:
   ```bash
   npx tsx scripts/seed-users.ts
   ```
4. Seed initial products:
   ```bash
   npx tsx server/seedProducts.ts
   ```

#### Backup Strategy

- [ ] Enable automated database backups (Replit handles this)
- [ ] Document backup restoration process
- [ ] Test backup restoration procedure

### 6. Authentication & Security

#### Replit Auth (OIDC) Configuration

- Authentication is pre-configured via `javascript_log_in_with_replit` integration
- Users can log in with Google, GitHub, or other Replit-supported providers
- No additional configuration required

#### Security Hardening

- [ ] Verify `SESSION_SECRET` is strong (32+ characters)
- [ ] Verify `JWT_SECRET` is strong and different from SESSION_SECRET
- [ ] Enable HTTPS (Replit auto-configures)
- [ ] Review CORS settings in `server/index.ts`
- [ ] Implement rate limiting (already configured in routes)
- [ ] Review admin route authorization middleware

### 7. Payment Testing & Verification

#### Pre-Launch Payment Tests

1. Switch Razorpay to Test Mode
2. Test complete checkout flow:
   - [ ] Add products to cart
   - [ ] Proceed through checkout
   - [ ] Complete test payment (use Razorpay test cards)
   - [ ] Verify order confirmation email
   - [ ] Verify order appears in admin dashboard
3. Test payment scenarios:
   - [ ] Successful payment
   - [ ] Failed payment
   - [ ] Timeout/abandoned payment
   - [ ] Refund processing (from admin)
4. Switch to Live Mode and repeat one successful transaction
5. Immediately refund test transaction

#### Test Cards (Razorpay Test Mode)

- Success: 4111 1111 1111 1111
- Failure: 4012 0010 3714 1112
- CVV: Any 3 digits
- Expiry: Any future date

### 8. Inventory & Stock Management

#### Initial Inventory Setup

1. Log into admin dashboard (/admin/inventory)
2. Review all products have correct stock levels
3. Set low stock thresholds (default: 10 units)
4. Test low stock alerts:
   - [ ] Email notifications work
   - [ ] SMS notifications work (if enabled)
   - [ ] Admin dashboard displays alerts

#### Inventory Monitoring

- [ ] Verify inventory adjustment tracking works
- [ ] Test bulk operations (CSV upload)
- [ ] Confirm out-of-stock prevents purchases
- [ ] Set up restock notification workflow

### 9. Legal & Compliance

#### Required Legal Pages (Already Implemented)

- [x] Privacy Policy (/privacy-policy)
- [x] Terms of Service (/terms-of-service)
- [x] Shipping Policy (/shipping-policy)
- [x] Return & Refund Policy (/return-policy)

#### India-Specific Compliance

- [ ] Display GST registration number
- [ ] Include GST in invoice generation
- [ ] Set up legal entity details in Razorpay
- [ ] Consumer Protection Act compliance verified
- [ ] Dispute resolution contact clearly visible

### 10. SEO & Social Media

#### SEO Verification (Already Implemented)

- [x] Meta descriptions on all pages
- [x] Open Graph tags configured
- [x] Twitter Card tags configured
- [x] Unique page titles

#### Post-Deployment SEO Tasks

- [ ] Submit sitemap to Google Search Console
- [ ] Verify Open Graph tags with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Verify Twitter Cards with [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [ ] Set up Google Analytics (if required)
- [ ] Configure robots.txt

### 11. Email Templates & Notifications

#### Verify Email Templates

- [ ] Order confirmation email has correct branding
- [ ] Shipping notification includes tracking info
- [ ] Delivery notification confirms receipt
- [ ] Password reset email has secure reset link
- [ ] Email verification works correctly

#### Notification Channels

- [ ] Email notifications enabled: `/admin/settings/notifications`
- [ ] SMS notifications enabled (optional)
- [ ] WhatsApp notifications enabled (optional)
- [ ] Test all notification channels work

### 12. Admin Dashboard Access

#### Admin User Setup

1. Ensure admin user exists:
   ```bash
   npx tsx scripts/seed-users.ts
   ```
2. Default admin credentials:
   - Email: admin@bmaafashion.com
   - Password: Admin@123
3. **CRITICAL**: Change admin password immediately after first login
4. Create additional admin users if needed

#### Admin Route Protection

- [ ] Verify all `/admin/*` routes require authentication
- [ ] Verify only admin users can access admin routes
- [ ] Test admin middleware blocks non-admin access

### 13. Performance & Monitoring

#### Performance Checklist

- [ ] Enable production build optimizations
- [ ] Verify image assets are optimized
- [ ] Test page load times < 3 seconds
- [ ] Verify mobile responsiveness
- [ ] Test with slow 3G network simulation

#### Monitoring Setup

- [ ] Set up error tracking (Sentry, Bugsnag, or similar)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create alert rules for critical errors

### 14. Final Pre-Launch Tests

#### End-to-End Testing

- [ ] Complete customer journey: Browse → Add to Cart → Checkout → Payment
- [ ] Guest checkout creates account and sends verification email
- [ ] User registration and login works
- [ ] Password reset flow works
- [ ] Admin can manage products, inventory, orders
- [ ] Admin can view analytics and customer data
- [ ] All email notifications are received
- [ ] Mobile experience is smooth
- [ ] All legal pages are accessible

#### Error Handling

- [ ] 404 page displays correctly
- [ ] Out-of-stock products show appropriate message
- [ ] Payment failure shows user-friendly error
- [ ] Network errors are handled gracefully
- [ ] Form validation provides clear feedback

### 15. Launch Day Checklist

#### Go-Live Steps

1. [ ] Verify all environment variables are set correctly
2. [ ] Switch Razorpay to Live Mode
3. [ ] Verify SendGrid is sending from verified domain
4. [ ] Enable Twilio production WhatsApp templates
5. [ ] Make one test purchase with real payment (then refund)
6. [ ] Monitor logs for errors in first hour
7. [ ] Verify order flow works end-to-end
8. [ ] Check email deliverability
9. [ ] Announce launch!

#### Post-Launch Monitoring

- [ ] Monitor error logs for first 24 hours
- [ ] Check payment success rate
- [ ] Verify email delivery rate
- [ ] Monitor server performance
- [ ] Review first customer feedback

## Production Environment Variables Summary

```bash
# Authentication & Security
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# Database (Auto-configured by Replit)
DATABASE_URL=<auto-provided>

# Razorpay (Production Keys)
RAZORPAY_KEY_ID=<live-key-id>
RAZORPAY_KEY_SECRET=<live-key-secret>

# SendGrid (Email)
SENDGRID_API_KEY=<production-api-key>
FROM_EMAIL=noreply@bmaafashion.com
ADMIN_EMAIL=admin@bmaafashion.com

# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=<account-sid>
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Troubleshooting Common Issues

### Payment Issues

- **Problem**: Payments failing in production
- **Solution**: Verify Razorpay is in Live Mode, check key_id and key_secret are live keys

### Email Issues

- **Problem**: Emails not being received
- **Solution**: Check SendGrid sender verification, verify API key has "Mail Send" permission, check spam folder

### SMS Issues

- **Problem**: SMS not delivering to India
- **Solution**: Verify Twilio number supports Indian SMS, check DLT registration if required

### Database Issues

- **Problem**: Migration fails
- **Solution**: Use `npm run db:push --force` to force schema sync, verify DATABASE_URL is correct

### Authentication Issues

- **Problem**: Users can't log in
- **Solution**: Verify Replit Auth integration is active, check session configuration, verify JWT_SECRET is set

## Support & Resources

- **Razorpay Docs**: https://razorpay.com/docs/
- **SendGrid Docs**: https://docs.sendgrid.com/
- **Twilio Docs**: https://www.twilio.com/docs/
- **Replit Docs**: https://docs.replit.com/

## Deployment Command

Once all checklist items are complete, deploy using Replit's built-in deployment:

1. Click "Deploy" button in Replit workspace
2. Configure custom domain (optional): bmaafashion.com
3. Verify deployment health check passes
4. Monitor deployment logs for errors

**bmaafashion is ready for production! 🚀🌱**
