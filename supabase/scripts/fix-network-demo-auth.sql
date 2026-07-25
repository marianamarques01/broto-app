-- Corrige login das contas *@demo quando auth.users foi criado via SQL incompleto.
-- Rodar: supabase db query --linked -f supabase/scripts/fix-network-demo-auth.sql
--
-- Senha após fix: BrotoDemo2026!

DO $fix$
DECLARE
  demo_password text := 'BrotoDemo2026!';
  rec record;
BEGIN
  FOR rec IN SELECT id, email FROM auth.users WHERE email LIKE '%@demo'
  LOOP
    UPDATE auth.users
    SET
      instance_id = '00000000-0000-0000-0000-000000000000',
      aud = 'authenticated',
      role = 'authenticated',
      encrypted_password = extensions.crypt(demo_password, extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      recovery_sent_at = COALESCE(recovery_sent_at, now()),
      last_sign_in_at = COALESCE(last_sign_in_at, now()),
      raw_app_meta_data = COALESCE(
        raw_app_meta_data,
        '{"provider":"email","providers":["email"]}'::jsonb
      ),
      confirmation_token = COALESCE(confirmation_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      recovery_token = COALESCE(recovery_token, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      is_sso_user = false,
      is_anonymous = false,
      updated_at = now()
    WHERE id = rec.id;

    DELETE FROM auth.identities WHERE user_id = rec.id AND provider = 'email';

    INSERT INTO auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      rec.id::text, rec.id,
      jsonb_build_object('sub', rec.id::text, 'email', rec.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  END LOOP;
END;
$fix$;
