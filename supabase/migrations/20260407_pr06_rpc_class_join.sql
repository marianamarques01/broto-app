-- PR-06: Transactional class-join RPC
-- Date: 2026-04-07
-- Scope: Create rpc_class_join function that atomically:
--   1. Validates class (active, valid code, has organization)
--   2. Creates/reactivates organization membership
--   3. Creates/reactivates enrollment
--   4. Updates users.current_organization_id and current_class_id
--
-- GUARANTEES:
--   - Transactional: all-or-nothing (implicit in PL/pgSQL function body)
--   - Idempotent: repeated joins produce the same end state, no duplicates
--   - Serialized: concurrent joins by same user are serialized via FOR UPDATE on users row
--   - Consistent: membership.organization_id == class.organization_id always
--
-- DEPENDS ON:
--   - PR-01: organization_memberships table + partial unique index
--   - PR-01.1: updated_at trigger, joined_at default
--   - PR-02: users.current_organization_id column
--   - PR-03: backfill (not strictly required, but expected to have run)

CREATE OR REPLACE FUNCTION public.rpc_class_join(
  p_user_id UUID,
  p_access_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class RECORD;
  v_membership RECORD;
BEGIN
  -- Input validation
  IF p_access_code IS NULL OR trim(p_access_code) = '' THEN
    RAISE EXCEPTION 'access_code é obrigatório'
      USING HINT = 'INVALID_INPUT';
  END IF;

  -- 1. Lock the user row to serialize concurrent joins by the same user.
  --    Also validates the user exists in public.users (auth trigger creates it on signup).
  PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado'
      USING HINT = 'USER_NOT_FOUND';
  END IF;

  -- 2. Find the class by normalized access code
  SELECT id, name, organization_id, is_active
  INTO v_class
  FROM classes
  WHERE access_code = upper(trim(p_access_code))
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido ou turma inativa'
      USING HINT = 'CLASS_NOT_FOUND';
  END IF;

  IF v_class.organization_id IS NULL THEN
    RAISE EXCEPTION 'Turma sem organização associada'
      USING HINT = 'CLASS_NO_ORG';
  END IF;

  -- 3. Create or reactivate organization membership
  --    Prioritize active membership if one exists; otherwise pick most recent inactive.
  --    Partial unique index (user_id, organization_id) WHERE status='active' prevents duplicates.
  SELECT id, status INTO v_membership
  FROM organization_memberships
  WHERE user_id = p_user_id
    AND organization_id = v_class.organization_id
  ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    -- No membership exists — create new active one
    INSERT INTO organization_memberships (
      user_id, organization_id, role, status, joined_at
    ) VALUES (
      p_user_id, v_class.organization_id, 'student', 'active', now()
    );
  ELSIF v_membership.status != 'active' THEN
    -- Inactive/removed membership exists — reactivate
    UPDATE organization_memberships
    SET status = 'active',
        left_at = NULL,
        updated_at = now()
    WHERE id = v_membership.id;
  END IF;
  -- If already active: do nothing (idempotent)

  -- 4. Create or reactivate enrollment
  --    Unique constraint on (class_id, student_id) handles idempotency.
  --    Preserves original enrolled_at on reactivation.
  INSERT INTO enrollments (class_id, student_id, status, enrolled_at)
  VALUES (v_class.id, p_user_id, 'active', now())
  ON CONFLICT (class_id, student_id)
  DO UPDATE SET status = 'active';

  -- 5. Update user context atomically
  UPDATE users
  SET current_class_id = v_class.id,
      current_organization_id = v_class.organization_id
  WHERE id = p_user_id;

  -- 6. Return class data
  RETURN jsonb_build_object(
    'id', v_class.id,
    'name', v_class.name,
    'organization_id', v_class.organization_id,
    'is_active', v_class.is_active
  );
END;
$$;

-- Security: only service_role (edge functions) can call this RPC.
-- Prevents direct client access via PostgREST which would allow arbitrary p_user_id.
REVOKE EXECUTE ON FUNCTION public.rpc_class_join(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_class_join(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rpc_class_join(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_class_join(UUID, TEXT) TO service_role;
