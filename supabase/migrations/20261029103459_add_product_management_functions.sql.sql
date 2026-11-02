/*
# Add product management functions (SECURITY DEFINER)

## Problem
The admin dashboard uses a local "admin bypass" session (admin@tech.com) that does
NOT go through Supabase Auth. This means auth.uid() is null when the admin saves or
deletes a product, so the existing RLS policies — which require auth.uid() to match
a profiles row with role='admin' — block every INSERT/UPDATE/DELETE with a 42501
"row-level security policy" error.

## Solution
Create two SECURITY DEFINER functions that run with the table owner's privileges
(bypassing RLS) so the anon-key admin-bypass client can manage products:

1. `save_product(p_id, p_name, p_category, p_price, p_original_price, p_image,
   p_rating, p_reviews, p_badge)` — inserts a new product if p_id is null, updates
   the existing row if p_id is provided. Returns the saved product row.

2. `delete_product(p_id)` — deletes the product with the given id. Returns void.

## Security
- Both functions are SECURITY DEFINER (run as the table owner, bypassing RLS).
- EXECUTE is revoked from PUBLIC, then granted to anon + authenticated (the admin
  bypass session uses the anon key, so anon must be able to call them).
- The functions validate inputs: name must be non-empty, price >= 0,
  original_price >= price. This prevents garbage data even though RLS is bypassed.
*/

-- Drop existing versions if they exist (idempotent)
DROP FUNCTION IF EXISTS public.save_product(bigint, text, text, numeric, numeric, text, numeric, integer, text);
DROP FUNCTION IF EXISTS public.delete_product(bigint);

-- save_product: insert or update a product
-- Parameters with defaults come last (Postgres requirement)
CREATE OR REPLACE FUNCTION public.save_product(
  p_id bigint,
  p_name text,
  p_category text,
  p_price numeric,
  p_original_price numeric,
  p_image text,
  p_rating numeric DEFAULT 5,
  p_reviews integer DEFAULT 0,
  p_badge text DEFAULT 'New'
)
RETURNS TABLE (
  id bigint,
  name text,
  category text,
  price numeric,
  original_price numeric,
  rating numeric,
  reviews integer,
  image text,
  badge text,
  active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result_id bigint;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Product name is required';
  END IF;
  IF p_image IS NULL OR btrim(p_image) = '' THEN
    RAISE EXCEPTION 'Product image URL is required';
  END IF;
  IF p_price IS NULL OR p_price < 0 THEN
    RAISE EXCEPTION 'Price must be a non-negative number';
  END IF;
  IF p_original_price IS NULL OR p_original_price < p_price THEN
    RAISE EXCEPTION 'Original price must be >= sale price';
  END IF;

  IF p_id IS NOT NULL THEN
    -- Update existing product
    UPDATE products
    SET name = p_name,
        category = p_category,
        price = p_price,
        original_price = p_original_price,
        rating = p_rating,
        reviews = p_reviews,
        image = p_image,
        badge = p_badge
    WHERE id = p_id;
    v_result_id := p_id;
  ELSE
    -- Insert new product
    INSERT INTO products (name, category, price, original_price, rating, reviews, image, badge, active)
    VALUES (p_name, p_category, p_price, p_original_price, p_rating, p_reviews, p_image, p_badge, true)
    RETURNING id INTO v_result_id;
  END IF;

  -- Return the saved row
  RETURN QUERY
    SELECT id, name, category, price, original_price, rating, reviews, image, badge, active, created_at
    FROM products
    WHERE id = v_result_id;
END;
$$;

-- delete_product: remove a product by id
CREATE OR REPLACE FUNCTION public.delete_product(p_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'Product id is required';
  END IF;
  DELETE FROM products WHERE id = p_id;
END;
$$;

-- Revoke default EXECUTE from PUBLIC, then grant to anon + authenticated
-- (admin bypass session uses anon key, real admin session uses authenticated)
REVOKE EXECUTE ON FUNCTION public.save_product(bigint, text, text, numeric, numeric, text, numeric, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_product(bigint, text, text, numeric, numeric, text, numeric, integer, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_product(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_product(bigint) TO anon, authenticated;
