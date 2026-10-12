-- Adds repeat-customer eligibility to coupons without altering existing coupon rows.
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS repeat_customer_only boolean NOT NULL DEFAULT false;
