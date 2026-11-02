/*
# Add stock column and reviews table

## Changes

### 1. Add `stock` column to `products` table
- New integer column `stock` with default 0 (meaning "unlimited/out of stock tracking off" when 0, positive means N in stock)
- Actually, for this store we'll use: stock integer NOT NULL DEFAULT 50 (every product starts with 50 units)
- We add a check constraint stock >= 0

### 2. Create `reviews` table
- id (uuid, PK)
- product_id (bigint, FK to products, ON DELETE CASCADE)
- user_id (uuid, FK to auth.users, ON DELETE CASCADE)
- rating (integer, 1-5, NOT NULL)
- comment (text, optional, max length enforced in app)
- created_at (timestamptz, default now())
- UNIQUE constraint on (product_id, user_id) — one review per user per product

### 3. Security
- RLS enabled on reviews
- Anyone (anon + authenticated) can SELECT reviews (they're public)
- Only authenticated users can INSERT their own review
- Only authenticated users can UPDATE/DELETE their own review
- Grants: SELECT to anon + authenticated; INSERT/UPDATE/DELETE to authenticated

### 4. Add trigger to update product rating/reviews count
- After INSERT/UPDATE/DELETE on reviews, recalculate the product's average rating and review count
- Uses a trigger function that aggregates reviews for the affected product
*/

-- Add stock column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 50;
ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock >= 0);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;

-- Policies: public read, owner write
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Trigger function: recalculate product rating and review count from reviews
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id bigint;
BEGIN
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);
  IF v_product_id IS NOT NULL THEN
    UPDATE products
    SET rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = v_product_id), 5),
        reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = v_product_id), 0)
    WHERE id = v_product_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_rating_trigger ON reviews;
CREATE TRIGGER reviews_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- Revoke default execute from PUBLIC, grant to authenticated (trigger runs as definer anyway)
REVOKE EXECUTE ON FUNCTION public.update_product_rating() FROM PUBLIC;
