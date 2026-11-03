/*
# Create cart_items table for persistent shopping carts

## Purpose
Shoppers currently lose their cart when they clear the browser or switch devices.
This migration adds a per-user `cart_items` table so each signed-in customer's cart
is saved permanently in the database and restored on any device they sign in from.

## 1. New Tables
- `cart_items`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to the signed-in user, references auth.users)
  - `product_id` (bigint, not null, references products)
  - `quantity` (integer, not null, default 1, must be >= 1)
  - `created_at` (timestamptz, default now())
  - Unique constraint on (user_id, product_id) so a user can only have one row per product

## 2. Indexes
- Index on `user_id` for fast lookups of a user's cart
- Unique index on (user_id, product_id) backing the unique constraint

## 3. Security
- Enable RLS on `cart_items`.
- Grant CRUD to `authenticated` only (the app requires sign-in to reach this table).
- Owner-scoped CRUD: each authenticated user can only read, insert, update, and delete
  their own cart rows. `user_id` defaults to `auth.uid()` so inserts that omit it still
  satisfy the INSERT policy's WITH CHECK.
- A composite unique constraint enforces one cart row per product per user at the DB level.
*/
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_key
  ON cart_items (user_id, product_id);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx
  ON cart_items (user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO authenticated;

DROP POLICY IF EXISTS "select_own_cart" ON cart_items;
CREATE POLICY "select_own_cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cart" ON cart_items;
CREATE POLICY "insert_own_cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cart" ON cart_items;
CREATE POLICY "update_own_cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cart" ON cart_items;
CREATE POLICY "delete_own_cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
