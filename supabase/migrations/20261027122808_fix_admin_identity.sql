/*
# Fix admin auth identity

The seeded admin@tech.com user was inserted directly into auth.users, which
skipped the normal auth.identities row Supabase Auth expects for email/password
login. Without it, signInWithPassword rejects the request with "Invalid login
credentials" even though the password hash is correct.

This migration inserts the missing email identity so password login works.
It is idempotent and safe to re-run.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@tech.com';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'admin@tech.com user not found';
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'admin@tech.com',
      'email_verified', true
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END $$;
