/*
# Update save_product with stock + add get_product_reviews function

## Changes

### 1. Update save_product function
- Adds p_stock parameter (integer, default 50) to save_product
- Includes stock in INSERT and UPDATE statements
- Return type now includes stock column

### 2. Create get_product_reviews function
- SECURITY DEFINER function returning reviews for a product with reviewer display names
- Joins reviews with profiles to get display_name (profiles not readable by anon, hence SECURITY DEFINER)
- Execute granted to anon + authenticated (reviews are public)
*/

-- Drop and recreate save_product with stock parameter
DROP FUNCTION IF EXISTS public.save_product(bigint, text, text, numeric, numeric, text, numeric, integer, text);

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
    WHERE id = p_id;
    v_result_id := p_id;
  ELSE
    INSERT INTO products (name, category, price, original_price, stock, rating, reviews, image, badge, active)
    VALUES (p_name, p_category, p_price, p_original_price, p_stock, p_rating, p_reviews, p_image, p_badge, true)
    RETURNING id INTO v_result_id;
  END IF;

  RETURN QUERY
    SELECT id, name, category, price, original_price, rating, reviews, image, badge, stock, active, created_at
    FROM products
    WHERE id = v_result_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_product(bigint, text, text, numeric, numeric, text, integer, numeric, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_product(bigint, text, text, numeric, numeric, text, integer, numeric, integer, text) TO anon, authenticated;

-- Create get_product_reviews function
CREATE OR REPLACE FUNCTION public.get_product_reviews(p_product_id bigint)
RETURNS TABLE (
  id uuid,
  product_id bigint,
  user_id uuid,
  rating integer,
  comment text,
  created_at timestamptz,
  display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at,
           COALESCE(p.display_name, 'Anonymous') AS display_name
    FROM reviews r
    LEFT JOIN profiles p ON p.id = r.user_id
    WHERE r.product_id = p_product_id
    ORDER BY r.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_product_reviews(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_product_reviews(bigint) TO anon, authenticated;
