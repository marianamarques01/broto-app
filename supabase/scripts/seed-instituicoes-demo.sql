-- Seed completo: contas demo Instituições (professor → escola → rede)
-- Rodar: supabase db query --linked -f supabase/scripts/seed-instituicoes-demo.sql
--
-- Senha única: BrotoDemo2026!
-- Ver docs/instituicoes-demo-contas.md

-- UUIDs
-- NETWORK_ORG:   b0e00000-0000-4000-8000-000000000100
-- REDE_USER:     b0e00000-0000-4000-8000-000000000101
-- SCHOOL_ALPHA:  b0e00000-0000-4000-8000-000000000110
-- SCHOOL_BETA:   b0e00000-0000-4000-8000-000000000120
-- SCHOOL_GAMMA:  b0e00000-0000-4000-8000-000000000130
-- TEACHER:       b0e00000-0000-4000-8000-000000000201
-- COORD:         b0e00000-0000-4000-8000-000000000202
-- OWNER:         b0e00000-0000-4000-8000-000000000203
-- BROTO_ADMIN:   b0e00000-0000-4000-8000-000000000204
-- CLASS_DEMO:    b0e00000-0000-4000-8000-000000000211

-- ---------------------------------------------------------------------------
-- Helper: remove membership student automática na org ENEM pública
-- ---------------------------------------------------------------------------

DELETE FROM public.organization_memberships om
USING auth.users u
WHERE om.user_id = u.id
  AND u.email LIKE '%@demo'
  AND om.role = 'student'
  AND om.organization_id = 'a0e00000-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------------------
-- Auth users (@demo) — upsert via DO block
-- ---------------------------------------------------------------------------

DO $auth$
DECLARE
  demo_password text := 'BrotoDemo2026!';
  rec record;
BEGIN
  FOR rec IN
    SELECT *
    FROM (VALUES
      ('b0e00000-0000-4000-8000-000000000101'::uuid, 'rede@demo', 'Gestor Rede Demo'),
      ('b0e00000-0000-4000-8000-000000000201'::uuid, 'teacher@demo', 'Professor Demo'),
      ('b0e00000-0000-4000-8000-000000000202'::uuid, 'coordenador@demo', 'Coordenador Demo'),
      ('b0e00000-0000-4000-8000-000000000203'::uuid, 'owner@demo', 'Diretor Demo'),
      ('b0e00000-0000-4000-8000-000000000204'::uuid, 'admin@demo', 'Administrador Geral Demo')
    ) AS t(id, email, full_name)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = rec.id) THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, recovery_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token,
        phone_change, phone_change_token, reauthentication_token,
        is_sso_user, is_anonymous
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        rec.id, 'authenticated', 'authenticated', rec.email,
        extensions.crypt(demo_password, extensions.gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', rec.full_name),
        now(), now(), '', '', '', '', '', '', '', false, false
      );
    ELSE
      UPDATE auth.users SET
        encrypted_password = extensions.crypt(demo_password, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
      WHERE id = rec.id;
    END IF;

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
$auth$;

-- ---------------------------------------------------------------------------
-- Perfis públicos
-- ---------------------------------------------------------------------------

INSERT INTO public.users (id, email, nome, current_organization_id)
VALUES
  ('b0e00000-0000-4000-8000-000000000101', 'rede@demo', 'Gestor Rede Demo', 'b0e00000-0000-4000-8000-000000000100'),
  ('b0e00000-0000-4000-8000-000000000201', 'teacher@demo', 'Professor Demo', 'b0e00000-0000-4000-8000-000000000110'),
  ('b0e00000-0000-4000-8000-000000000202', 'coordenador@demo', 'Coordenador Demo', 'b0e00000-0000-4000-8000-000000000110'),
  ('b0e00000-0000-4000-8000-000000000203', 'owner@demo', 'Diretor Demo', 'b0e00000-0000-4000-8000-000000000110'),
  ('b0e00000-0000-4000-8000-000000000204', 'admin@demo', 'Administrador Geral Demo', 'b0e00000-0000-4000-8000-000000000110')
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome = EXCLUDED.nome,
      current_organization_id = EXCLUDED.current_organization_id;

-- ---------------------------------------------------------------------------
-- Organizações (rede + escolas fixture)
-- ---------------------------------------------------------------------------

INSERT INTO public.organizations (id, name, slug, is_public, owner_id, config)
VALUES (
  'b0e00000-0000-4000-8000-000000000100',
  'Rede Demo',
  'rede-demo',
  false,
  'b0e00000-0000-4000-8000-000000000203',
  '{"is_demo": true, "mascot_name": "Broto", "primary_color": "#4CAF50"}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      config = EXCLUDED.config;

INSERT INTO public.organizations (id, name, slug, is_public, owner_id, config)
VALUES
  ('b0e00000-0000-4000-8000-000000000110', 'EM Alpha', 'em-alpha-demo', false, 'b0e00000-0000-4000-8000-000000000203', '{"is_demo": true}'::jsonb),
  ('b0e00000-0000-4000-8000-000000000120', 'EM Beta', 'em-beta-demo', false, 'b0e00000-0000-4000-8000-000000000203', '{"is_demo": true}'::jsonb),
  ('b0e00000-0000-4000-8000-000000000130', 'EM Gamma', 'em-gamma-demo', false, 'b0e00000-0000-4000-8000-000000000203', '{"is_demo": true}'::jsonb)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      config = EXCLUDED.config;

-- ---------------------------------------------------------------------------
-- school_units
-- ---------------------------------------------------------------------------

INSERT INTO public.school_units (network_org_id, organization_id, display_name, regional_label, grade_label)
VALUES
  ('b0e00000-0000-4000-8000-000000000100', 'b0e00000-0000-4000-8000-000000000110', 'EM Alpha', 'Norte', '3º ano EM'),
  ('b0e00000-0000-4000-8000-000000000100', 'b0e00000-0000-4000-8000-000000000120', 'EM Beta', 'Sul', '2º ano EM'),
  ('b0e00000-0000-4000-8000-000000000100', 'b0e00000-0000-4000-8000-000000000130', 'EM Gamma', 'Norte', '3º ano EM')
ON CONFLICT (network_org_id, organization_id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      regional_label = EXCLUDED.regional_label,
      grade_label = EXCLUDED.grade_label;

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------

INSERT INTO public.organization_memberships (user_id, organization_id, role, status, joined_at)
SELECT v.user_id, v.organization_id, v.role, 'active', now()
FROM (VALUES
  ('b0e00000-0000-4000-8000-000000000101'::uuid, 'b0e00000-0000-4000-8000-000000000100'::uuid, 'network_admin'),
  ('b0e00000-0000-4000-8000-000000000201'::uuid, 'b0e00000-0000-4000-8000-000000000110'::uuid, 'teacher'),
  ('b0e00000-0000-4000-8000-000000000202'::uuid, 'b0e00000-0000-4000-8000-000000000110'::uuid, 'org_admin'),
  ('b0e00000-0000-4000-8000-000000000203'::uuid, 'b0e00000-0000-4000-8000-000000000110'::uuid, 'owner'),
  ('b0e00000-0000-4000-8000-000000000204'::uuid, 'b0e00000-0000-4000-8000-000000000110'::uuid, 'broto_admin')
) AS v(user_id, organization_id, role)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_memberships om
  WHERE om.user_id = v.user_id
    AND om.organization_id = v.organization_id
    AND om.status = 'active'
);

-- ---------------------------------------------------------------------------
-- Turma demo (professor)
-- ---------------------------------------------------------------------------

INSERT INTO public.classes (id, organization_id, name, access_code, created_by, is_active)
VALUES (
  'b0e00000-0000-4000-8000-000000000211',
  'b0e00000-0000-4000-8000-000000000110',
  '3º A Demo',
  'DEMO3A',
  'b0e00000-0000-4000-8000-000000000201',
  true
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      access_code = EXCLUDED.access_code,
      is_active = true;

-- ---------------------------------------------------------------------------
-- Snapshots org (rede + escola demo)
-- ---------------------------------------------------------------------------

INSERT INTO public.engagement_snapshots_org (
  organization_id, computed_at, total_classes, total_students,
  active_7d_pct, abandonment_risk_index, class_rankings, at_risk_alerts
)
VALUES
  (
    'b0e00000-0000-4000-8000-000000000110', now(), 3, 120, 72.5, 28.0,
    '[{"classId":"b0e00000-0000-4000-8000-000000000211","className":"3º A Demo","active7dPct":75,"totalStudents":40,"missingCount":4}]'::jsonb,
    '[{"userId":"00000000-0000-4000-8000-000000000301","nome":"Aluno Engajado","classId":"b0e00000-0000-4000-8000-000000000211","className":"3º A Demo","engagementState":"engaged","streak":5,"severity":0}]'::jsonb
  ),
  (
    'b0e00000-0000-4000-8000-000000000120', now(), 2, 85, 48.0, 68.5,
    '[{"classId":"00000000-0000-4000-8000-000000000202","className":"2B","active7dPct":48,"totalStudents":42,"missingCount":12}]'::jsonb,
    '[]'::jsonb
  ),
  (
    'b0e00000-0000-4000-8000-000000000130', now(), 4, 150, 61.0, 52.0,
    '[{"classId":"00000000-0000-4000-8000-000000000203","className":"3C","active7dPct":61,"totalStudents":38,"missingCount":8}]'::jsonb,
    '[]'::jsonb
  );
