-- BMAA Fashion production commerce features.
-- Additive migration: existing tables/data are preserved.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount numeric(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_card_discount numeric(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed integer DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_number_unique ON orders(invoice_number) WHERE invoice_number IS NOT NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS order_id varchar REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_charge_applicable boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_charge numeric(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS coupons (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage', discount_value numeric(10,2) NOT NULL,
  minimum_order_amount numeric(10,2) DEFAULT 0, maximum_discount_amount numeric(10,2),
  usage_limit integer, usage_count integer NOT NULL DEFAULT 0, per_customer_limit integer DEFAULT 1,
  first_order_only boolean NOT NULL DEFAULT false, applicable_product_ids text[] NOT NULL DEFAULT '{}',
  applicable_categories text[] NOT NULL DEFAULT '{}', starts_at timestamp, ends_at timestamp,
  active boolean NOT NULL DEFAULT true, created_by varchar REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_coupons_ends_at ON coupons(ends_at);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), coupon_id varchar NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id varchar REFERENCES users(id) ON DELETE SET NULL, order_id varchar REFERENCES orders(id) ON DELETE SET NULL,
  customer_email text, discount_amount numeric(10,2) NOT NULL, created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id varchar NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_user_id varchar REFERENCES users(id) ON DELETE SET NULL, sender_type text NOT NULL DEFAULT 'customer',
  message text NOT NULL, attachment_url text, created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);

CREATE TABLE IF NOT EXISTS return_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), order_id varchar NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id varchar REFERENCES users(id) ON DELETE SET NULL, customer_email text NOT NULL, reason text NOT NULL,
  details text, items jsonb NOT NULL, status text NOT NULL DEFAULT 'requested', refund_amount numeric(10,2) DEFAULT 0,
  admin_notes text, pickup_tracking_number text, created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_returns_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON return_requests(status);

CREATE TABLE IF NOT EXISTS recently_viewed_products (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar REFERENCES users(id) ON DELETE CASCADE,
  session_id text, product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE, viewed_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recent_viewed_user ON recently_viewed_products(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_viewed_session ON recently_viewed_products(session_id);
CREATE INDEX IF NOT EXISTS idx_recent_viewed_product ON recently_viewed_products(product_id);

CREATE TABLE IF NOT EXISTS compare_items (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar REFERENCES users(id) ON DELETE CASCADE,
  session_id text, product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE, created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_compare_user ON compare_items(user_id);
CREATE INDEX IF NOT EXISTS idx_compare_session ON compare_items(session_id);
CREATE INDEX IF NOT EXISTS idx_compare_product ON compare_items(product_id);

-- Pincode serviceability is intentionally not used. BMAA Fashion ships primarily across India and may ship internationally; shipping is calculated by destination rules and product-level charges.

CREATE TABLE IF NOT EXISTS shipping_rules (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, country text, state text,
  shipping_charge numeric(10,2) NOT NULL DEFAULT 0, free_shipping_threshold numeric(10,2),
  active boolean NOT NULL DEFAULT true, priority integer NOT NULL DEFAULT 100,
  created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_active_priority ON shipping_rules(active, priority);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_country_state ON shipping_rules(country, state);

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  session_id text, customer_email text, customer_name text, items jsonb NOT NULL, cart_total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', reminder_sent_at timestamp, recovered_order_id varchar REFERENCES orders(id) ON DELETE SET NULL,
  last_seen_at timestamp DEFAULT now(), created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_last_seen ON abandoned_carts(last_seen_at);

CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  points_balance integer NOT NULL DEFAULT 0, lifetime_points integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points integer NOT NULL, type text NOT NULL, description text, order_id varchar REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id);

CREATE TABLE IF NOT EXISTS referral_codes (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code varchar(32) NOT NULL UNIQUE, reward_points integer NOT NULL DEFAULT 100, active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS referral_uses (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), referral_code_id varchar NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referred_user_id varchar NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, order_id varchar REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gift_cards (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(32) NOT NULL UNIQUE, initial_amount numeric(10,2) NOT NULL,
  remaining_amount numeric(10,2) NOT NULL, purchaser_user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  recipient_email text, message text, expires_at timestamp, active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), gift_card_id varchar NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id varchar REFERENCES orders(id) ON DELETE SET NULL, amount numeric(10,2) NOT NULL, type text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  permissions text[] NOT NULL DEFAULT '{}', created_at timestamp DEFAULT now(), updated_at timestamp DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), admin_user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL, entity_type text NOT NULL, entity_id text, before_data jsonb, after_data jsonb,
  ip_address text, created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_logs(admin_user_id);

CREATE TABLE IF NOT EXISTS shipping_carriers (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, tracking_url_template text,
  active boolean NOT NULL DEFAULT true, created_at timestamp DEFAULT now()
);
