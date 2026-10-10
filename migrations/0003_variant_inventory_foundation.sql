ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id varchar REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id varchar REFERENCES product_variants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_product_variant_id_cart ON cart_items(user_id, product_id, variant_id) WHERE user_id IS NOT NULL AND variant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_session_product_variant_id_cart ON cart_items(session_id, product_id, variant_id) WHERE session_id IS NOT NULL AND user_id IS NULL AND variant_id IS NOT NULL;
