/*
# Rebuild admin auth user correctly

The previous seed inserted a user directly into auth.users with a synthetic
instance_id of all zeros, but auth.instances is empty. GoTrue's login flow
queries the instances table to load JWT config and fails with a 500
"Database error querying schema" when no row matches.

This migration:
1. Removes the broken user, its identity row, and its profile.
2. Re-inserts the user with instance_id NULL and a proper bcrypt password.
   confirmed_at is a generated column (derived from email_confirmed_at), so
   it is not set directly.
3. Re-creates the matching auth.identities row.
4. Re-creates the admin profile row.

Safe to re-run.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  DELETE FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@tech.com');
  DELETE FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@tech.com');
  DELETE FROM auth.users WHERE email = 'admin@tech.com';

  v_user_id := gen_random_uuid();
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous
  )
  VALUES (
    v_user_id,
    NULL,
    'authenticated',
    'authenticated',
    'admin@tech.com',
    crypt('NexaAdmin#2026!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}'::jsonb,
    '{"name":"Nexa Admin"}'::jsonb,
    false,
    false
  );

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
  );

  INSERT INTO public.profiles (id, display_name, role)
  VALUES (v_user_id, 'Nexa Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = 'Nexa Admin';
END $$;
