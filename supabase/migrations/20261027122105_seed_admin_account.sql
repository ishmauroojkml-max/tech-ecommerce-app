/*
# Seed the NexaTech admin account

1. Auth user
- Inserts a verified admin@tech.com user into auth.users with email/password login enabled.
- Uses crypt() with bf (Blowfish) so Supabase Auth accepts the password.
- Email confirmation is bypassed so the credentials work immediately.

2. Profile
- Inserts the matching public.profiles row with role set to 'admin' so the Admin Dashboard gate allows entry.
- The auth.users trigger would otherwise create a 'customer' profile; this migration upserts the admin role.

3. Important notes
- This is a one-time seed for the operator-provided admin credentials.
- Safe to re-run: the profile upsert keeps role = 'admin' even if the user row already existed.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@tech.com';
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@tech.com',
      crypt('AdminPassword123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{}'::jsonb,
      '{}'::jsonb
    )
    RETURNING id INTO v_user_id;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('AdminPassword123!', gen_salt('bf')),
        email_confirmed_at = now(),
        updated_at = now()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (id, display_name, role)
  VALUES (v_user_id, 'Nexa Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = COALESCE(public.profiles.display_name, 'Nexa Admin');
END $$;
