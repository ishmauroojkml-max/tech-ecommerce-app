/*
# Update create_order to deduct stock + add submit_review function

## Changes

### 1. Update `create_order` function
- Now checks that each product has sufficient stock before creating the order
- Deducts the ordered quantity from `products.stock` after the order is inserted
- If any product is out of stock or has insufficient quantity, raises an error
  and no order is created (atomic — the whole function is one transaction)

### 2. Create `submit_review` function
- SECURITY DEFINER function that inserts or updates a user's review for a product
- Parameters: p_product_id (bigint), p_rating (1-5), p_comment (text, optional)
- Uses the authenticated user's uid automatically (auth.uid())
- Enforces: user must be authenticated, rating must be 1-5
- Upserts: if the user already has a review for this product, it updates it
- The trigger on reviews table recalculates the product's average rating

### Security
- create_order: already SECURITY DEFINER, execute to authenticated only
- submit_review: SECURITY DEFINER, execute revoked from PUBLIC, granted to authenticated
*/

-- Drop and recreate create_order with stock deduction
DROP FUNCTION IF EXISTS public.create_order(jsonb);

CREATE OR REPLACE FUNCTION public.create_order(p_items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  product_row public.products%ROWTYPE;
  quantity integer;
  order_id uuid;
  calculated_total numeric(12,2) := 0;
  snapshots jsonb := '[]'::jsonb;
  customer_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one product';
  END IF;

  SELECT email INTO customer_email FROM auth.users WHERE id = auth.uid();

  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF NOT (item ? 'id') OR NOT (item ? 'quantity') OR (item->>'id') !~ '^\d+$' OR (item->>'quantity') !~ '^\d+$' THEN
      RAISE EXCEPTION 'Invalid order item';
    END IF;
    quantity := (item->>'quantity')::integer;
    IF quantity < 1 OR quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'id')::bigint AND active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product unavailable';
    END IF;
    -- Check stock
    IF product_row.stock < quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', product_row.name;
    END IF;
    calculated_total := calculated_total + (product_row.price * quantity);
    snapshots := snapshots || jsonb_build_array(jsonb_build_object('id', product_row.id, 'name', product_row.name, 'price', product_row.price, 'quantity', quantity, 'image', product_row.image));
  END LOOP;

  INSERT INTO public.orders (user_id, email, items, total)
  VALUES (auth.uid(), COALESCE(customer_email, ''), snapshots, calculated_total)
  RETURNING id INTO order_id;

  -- Deduct stock
  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    UPDATE public.products
    SET stock = stock - (item->>'quantity')::integer
    WHERE id = (item->>'id')::bigint;
  END LOOP;

  RETURN order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(jsonb) TO authenticated;

-- Create submit_review function (upsert)
CREATE OR REPLACE FUNCTION public.submit_review(
  p_product_id bigint,
  p_rating integer,
  p_comment text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Product id is required';
  END IF;

  INSERT INTO reviews (product_id, user_id, rating, comment)
  VALUES (p_product_id, auth.uid(), p_rating, p_comment)
  ON CONFLICT (product_id, user_id)
  DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()
  RETURNING id INTO v_review_id;

  RETURN v_review_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_review(bigint, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review(bigint, integer, text) TO authenticated;
