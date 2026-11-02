/*
# Fix ambiguous column reference in save_product

## Problem
The save_product function's RETURN QUERY uses unqualified column names (id, name, etc.)
which clash with the RETURNS TABLE output column names, causing SQL error 42702
"column reference 'id' is ambiguous".

## Fix
Qualify all columns in the RETURN QUERY SELECT with the `products.` table prefix.
*/

DROP FUNCTION IF EXISTS public.save_product(bigint, text, text, numeric, numeric, text, integer, numeric, integer, text);

CREATE OR REPLACE FUNCTION public.save_product(
  p_id bigint,
  p_name text,
  p_category text,
  p_price numeric,
  p_original_price numeric,
  p_image text,
  p_stock integer DEFAULT 50,
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
  stock integer,
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
  IF p_stock IS NULL OR p_stock < 0 THEN
    RAISE EXCEPTION 'Stock must be >= 0';
  END IF;

  IF p_id IS NOT NULL THEN
    UPDATE products
    SET name = p_name,
        category = p_category,
        price = p_price,
        original_price = p_original_price,
        stock = p_stock,
        rating = p_rating,
        reviews = p_reviews,
        image = p_image,
        badge = p_badge
    WHERE products.id = p_id;
    v_result_id := p_id;
  ELSE
    INSERT INTO products (name, category, price, original_price, stock, rating, reviews, image, badge, active)
    VALUES (p_name, p_category, p_price, p_original_price, p_stock, p_rating, p_reviews, p_image, p_badge, true)
    RETURNING products.id INTO v_result_id;
  END IF;

  RETURN QUERY
    SELECT products.id, products.name, products.category, products.price,
           products.original_price, products.rating, products.reviews,
           products.image, products.badge, products.stock, products.active,
           products.created_at
    FROM products
    WHERE products.id = v_result_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_product(bigint, text, text, numeric, numeric, text, integer, numeric, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_product(bigint, text, text, numeric, numeric, text, integer, numeric, integer, text) TO anon, authenticated;
