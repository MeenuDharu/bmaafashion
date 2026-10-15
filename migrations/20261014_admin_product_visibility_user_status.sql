-- BMAA Fashion admin product visibility and user account status.
-- Safe for existing data: existing products/users default to visible/active.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
