-- Add administrator moderation controls for product reviews.
-- Existing reviews remain approved; new submissions are marked pending in the API.
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;

ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_product_reviews_moderation
  ON product_reviews (is_approved, is_flagged, created_at);
