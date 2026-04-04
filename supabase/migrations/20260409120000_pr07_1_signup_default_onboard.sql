-- PR-07.1: turma default de signup por UUID + config (sem access_code no trigger)
-- - Garante organização/turma ENEM canônicas sem depender de seed manual
-- - signup_defaults.default_class_id = referência estável para onboarding
-- - rpc_onboard_new_user_default_org = mesmo contrato transacional que class-join (sem chamar rpc_class_join)

-- UUIDs canônicos (alinhados a seed-enem.sql; migração é fonte de verdade em ambientes limpos)
-- Org: a0e00000-0000-4000-8000-000000000001
-- Class: b0c00000-0000-4000-8000-000000000001

-- 1) Permitir tenant/turma de sistema sem linha em auth.users (fresh DB)
ALTER TABLE public.organizations
  ALTER COLUMN owner_id DROP NOT NULL;

ALTER TABLE public.classes
  ALTER COLUMN created_by DROP NOT NULL;

-- 2) Organização ENEM pública
INSERT INTO public.organizations (id, name, slug, is_public, owner_id, config)
VALUES (
  'a0e00000-0000-4000-8000-000000000001',
  'ENEM',
  'enem',
  true,
  NULL,
  '{
    "mascot_name": "Broto",
    "primary_color": "#4CAF50",
    "features": {
      "chat": true,
      "flashcards": true,
      "mind_map": true,
      "routine": true,
      "audio_overview": false
    }
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  slug = excluded.slug,
  is_public = excluded.is_public,
  config = excluded.config,
  owner_id = COALESCE(public.organizations.owner_id, excluded.owner_id);

-- 3) Turma default (access_code ENEM26 mantido para join manual / compat)
INSERT INTO public.classes (
  id,
  organization_id,
  name,
  description,
  access_code,
  is_active,
  created_by,
  notebook_status
)
VALUES (
  'b0c00000-0000-4000-8000-000000000001',
  'a0e00000-0000-4000-8000-000000000001',
  'ENEM 2026',
  'Turma aberta para preparação do ENEM. Qualquer aluno pode entrar.',
  'ENEM26',
  true,
  NULL,
  'not_configured'
)
ON CONFLICT (id) DO UPDATE SET
  organization_id = excluded.organization_id,
  name = excluded.name,
  description = excluded.description,
  access_code = excluded.access_code,
  is_active = excluded.is_active,
  notebook_status = excluded.notebook_status,
  created_by = COALESCE(public.classes.created_by, excluded.created_by);

-- 4) Config singleton (não sobrescreve default_class_id se já existir — evita drift em re-run)
CREATE TABLE IF NOT EXISTS public.signup_defaults (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_defaults ENABLE ROW LEVEL SECURITY;

INSERT INTO public.signup_defaults (id, default_class_id)
VALUES (1, 'b0c00000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 5) Onboarding default: membership + enrollment + contexto ativo (espelha rpc_class_join, por class id)
CREATE OR REPLACE FUNCTION public.rpc_onboard_new_user_default_org(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_class RECORD;
  v_membership RECORD;
BEGIN
  SELECT sd.default_class_id
  INTO v_class_id
  FROM public.signup_defaults sd
  WHERE sd.id = 1;

  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Configuração de signup ausente'
      USING HINT = 'SIGNUP_DEFAULTS_MISSING';
  END IF;

  PERFORM 1 FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado'
      USING HINT = 'USER_NOT_FOUND';
  END IF;

  SELECT c.id, c.name, c.organization_id, c.is_active
  INTO v_class
  FROM public.classes c
  WHERE c.id = v_class_id
    AND c.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma padrão inativa ou ausente'
      USING HINT = 'DEFAULT_CLASS_INVALID';
  END IF;

  IF v_class.organization_id IS NULL THEN
    RAISE EXCEPTION 'Turma sem organização associada'
      USING HINT = 'CLASS_NO_ORG';
  END IF;

  SELECT om.id, om.status INTO v_membership
  FROM public.organization_memberships om
  WHERE om.user_id = p_user_id
    AND om.organization_id = v_class.organization_id
  ORDER BY CASE WHEN om.status = 'active' THEN 0 ELSE 1 END
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.organization_memberships (
      user_id, organization_id, role, status, joined_at
    ) VALUES (
      p_user_id, v_class.organization_id, 'student', 'active', now()
    );
  ELSIF v_membership.status != 'active' THEN
    UPDATE public.organization_memberships
    SET status = 'active',
        left_at = NULL,
        updated_at = now()
    WHERE id = v_membership.id;
  END IF;

  INSERT INTO public.enrollments (class_id, student_id, status, enrolled_at)
  VALUES (v_class.id, p_user_id, 'active', now())
  ON CONFLICT (class_id, student_id)
  DO UPDATE SET status = 'active';

  UPDATE public.users
  SET current_class_id = v_class.id,
      current_organization_id = v_class.organization_id
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'id', v_class.id,
    'name', v_class.name,
    'organization_id', v_class.organization_id,
    'is_active', v_class.is_active
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_onboard_new_user_default_org(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_onboard_new_user_default_org(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rpc_onboard_new_user_default_org(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_onboard_new_user_default_org(uuid) TO service_role;

-- 6) Trigger: deixa de depender de access_code / rpc_class_join
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    meta jsonb;
    user_nome text;
BEGIN
    meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    user_nome := COALESCE(
        meta->>'full_name',
        meta->>'name',
        split_part(NEW.email, '@', 1),
        'Usuário'
    );

    INSERT INTO public.users (
        id,
        email,
        nome,
        telefone,
        cpf,
        cidade,
        estado,
        image,
        onboarding_done
    ) VALUES (
        NEW.id,
        NEW.email,
        user_nome,
        NULLIF(meta->>'telefone', ''),
        NULLIF(meta->>'cpf', ''),
        NULLIF(meta->>'cidade', ''),
        NULLIF(meta->>'estado', ''),
        NULLIF(meta->>'image', ''),
        false
    );

    INSERT INTO public.pets (user_id, fase, nivel, xp, humor, energia, moedas)
    VALUES (NEW.id, 'semente', 1, 0, 100, 100, 0);

    PERFORM public.rpc_onboard_new_user_default_org(NEW.id);

    RETURN NEW;
END;
$$;
