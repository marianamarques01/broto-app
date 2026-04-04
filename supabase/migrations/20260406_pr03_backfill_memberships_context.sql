-- ============================================================================
-- PR-03: Backfill de dados — memberships + contexto ativo
-- Date: 2026-04-06
-- Scope: Popular organization_memberships e users.current_organization_id
--        a partir de dados existentes (admin_profiles, enrollments, classes)
--
-- REGRAS:
--   1. Idempotente — pode rodar múltiplas vezes sem duplicar dados
--   2. Não sobrescreve current_organization_id se já populado
--   3. Máximo 1 membership ativo por (user_id, organization_id)
--   4. Reativa memberships inativos quando existe vínculo ativo
--
-- ORDEM DE EXECUÇÃO RECOMENDADA:
--   1. Rodar SEÇÃO A (diagnóstico) — analisar resultado
--   2. Rodar SEÇÃO B (backfill) — em transação
--   3. Rodar SEÇÃO C (relatório) — validar resultado
-- ============================================================================


-- ============================================================================
-- SEÇÃO A — DIAGNÓSTICO PRÉ-BACKFILL (somente leitura)
-- Rodar ANTES do backfill para entender o estado dos dados.
-- ============================================================================

-- A.1) Resumo geral do estado atual
-- Contagens para baseline antes do backfill
SELECT 'users_total' AS metrica, count(*) AS valor FROM public.users
UNION ALL
SELECT 'admin_profiles_total', count(*) FROM public.admin_profiles
UNION ALL
SELECT 'admin_profiles_com_org', count(*) FROM public.admin_profiles WHERE organization_id IS NOT NULL
UNION ALL
SELECT 'admin_profiles_sem_org', count(*) FROM public.admin_profiles WHERE organization_id IS NULL
UNION ALL
SELECT 'enrollments_total', count(*) FROM public.enrollments
UNION ALL
SELECT 'enrollments_active', count(*) FROM public.enrollments WHERE status = 'active'
UNION ALL
SELECT 'enrollments_inactive', count(*) FROM public.enrollments WHERE status = 'inactive'
UNION ALL
SELECT 'classes_total', count(*) FROM public.classes
UNION ALL
SELECT 'classes_active', count(*) FROM public.classes WHERE is_active = true
UNION ALL
SELECT 'organizations_total', count(*) FROM public.organizations
UNION ALL
SELECT 'memberships_existentes', count(*) FROM public.organization_memberships
UNION ALL
SELECT 'users_com_current_class', count(*) FROM public.users WHERE current_class_id IS NOT NULL
UNION ALL
SELECT 'users_com_current_org', count(*) FROM public.users WHERE current_organization_id IS NOT NULL;


-- A.2) Usuários sem organização inferível
-- Usuários que NÃO são admin E NÃO têm enrollment ativo → não terão membership
SELECT
  u.id AS user_id,
  u.email,
  u.nome,
  u.created_at
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.id = u.id AND ap.organization_id IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = u.id
      AND c.organization_id IS NOT NULL
  )
ORDER BY u.created_at DESC;


-- A.3) Usuários com múltiplas organizações possíveis
-- Vão ter >1 membership (normal), mas importante mapear para decidir current_organization_id
SELECT
  sub.user_id,
  u.email,
  u.nome,
  sub.org_count,
  sub.sources
FROM (
  SELECT user_id, count(DISTINCT organization_id) AS org_count,
         string_agg(DISTINCT source, ', ') AS sources
  FROM (
    -- Orgs de admin
    SELECT ap.id AS user_id, ap.organization_id, 'admin_profile' AS source
    FROM public.admin_profiles ap
    WHERE ap.organization_id IS NOT NULL
    UNION ALL
    -- Orgs de enrollment
    SELECT e.student_id AS user_id, c.organization_id, 'enrollment' AS source
    FROM public.enrollments e
    JOIN public.classes c ON c.id = e.class_id
    WHERE c.organization_id IS NOT NULL
  ) all_orgs
  GROUP BY user_id
  HAVING count(DISTINCT organization_id) > 1
) sub
JOIN public.users u ON u.id = sub.user_id
ORDER BY sub.org_count DESC;


-- A.4) Conflitos entre admin_profiles e enrollments
-- Usuários que são admin numa org E aluno na MESMA org
-- (não é necessariamente erro, mas o backfill deve preservar o role de maior privilégio)
SELECT
  ap.id AS user_id,
  u.email,
  ap.organization_id,
  ap.role AS admin_role,
  count(e.id) AS enrollment_count
FROM public.admin_profiles ap
JOIN public.users u ON u.id = ap.id
JOIN public.classes c ON c.organization_id = ap.organization_id
JOIN public.enrollments e ON e.class_id = c.id AND e.student_id = ap.id
WHERE ap.organization_id IS NOT NULL
GROUP BY ap.id, u.email, ap.organization_id, ap.role;


-- A.5) Enrollments em turmas inativas ou sem organização válida
SELECT
  e.id AS enrollment_id,
  e.student_id,
  e.class_id,
  e.status AS enrollment_status,
  c.is_active AS class_active,
  c.organization_id,
  CASE
    WHEN c.organization_id IS NULL THEN 'SEM_ORG'
    WHEN c.is_active = false THEN 'TURMA_INATIVA'
    ELSE 'OK'
  END AS situacao
FROM public.enrollments e
JOIN public.classes c ON c.id = e.class_id
WHERE c.organization_id IS NULL OR c.is_active = false;


-- A.6) users.current_class_id apontando para turma inexistente ou inativa
SELECT
  u.id AS user_id,
  u.email,
  u.current_class_id,
  c.id IS NOT NULL AS turma_existe,
  c.is_active AS turma_ativa,
  c.organization_id
FROM public.users u
LEFT JOIN public.classes c ON c.id = u.current_class_id
WHERE u.current_class_id IS NOT NULL
  AND (c.id IS NULL OR c.is_active = false);


-- ============================================================================
-- SEÇÃO B — BACKFILL (executar em transação)
-- IMPORTANTE: Rodar diagnóstico (Seção A) antes. Só executar após aprovação.
-- ============================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- B.1) Backfill memberships a partir de admin_profiles
--
-- Lógica:
--   - admin_profiles.role ('owner','teacher') → membership.role (mesmo valor)
--   - Status = 'active' para todos os admins com org válida
--   - joined_at = admin_profiles.created_at (preserva data original)
--   - ON CONFLICT: se já existe membership ativo para esse (user, org),
--     não faz nada (idempotência)
--
-- Segurança:
--   - Filtra admin_profiles sem organization_id (dados inválidos)
--   - Usa subquery NOT EXISTS para evitar conflito com partial unique index
-- -----------------------------------------------------------------------

INSERT INTO public.organization_memberships (
  user_id,
  organization_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
)
SELECT
  ap.id,
  ap.organization_id,
  ap.role,            -- 'owner' ou 'teacher' (mapeamento direto)
  'active',
  COALESCE(ap.created_at, now()),
  now(),
  now()
FROM public.admin_profiles ap
WHERE ap.organization_id IS NOT NULL
  -- Não inserir se já existe membership (ativo ou não) para esse par
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = ap.id
      AND om.organization_id = ap.organization_id
  );

-- Reativar memberships inativos de admins (para idempotência em re-execução)
UPDATE public.organization_memberships om
SET
  status = 'active',
  role = ap.role,
  left_at = NULL,
  updated_at = now()
FROM public.admin_profiles ap
WHERE om.user_id = ap.id
  AND om.organization_id = ap.organization_id
  AND om.status IN ('inactive', 'removed')
  AND ap.organization_id IS NOT NULL;


-- -----------------------------------------------------------------------
-- B.2) Backfill memberships a partir de enrollments (alunos)
--
-- Lógica:
--   - Agrupa por (student_id, organization_id) para evitar duplicatas
--   - Só cria membership se NÃO existe um para esse (user, org)
--     (preserva role de admin se o usuário já tem membership como admin)
--   - Status segue a matrícula mais favorável:
--     se ao menos 1 enrollment é 'active' → membership 'active'
--   - joined_at = data da matrícula mais antiga naquela org
--
-- Segurança:
--   - Filtra classes sem organization_id
--   - Não sobrescreve memberships de admins (NOT EXISTS garante)
-- -----------------------------------------------------------------------

INSERT INTO public.organization_memberships (
  user_id,
  organization_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
)
SELECT
  student_data.student_id,
  student_data.organization_id,
  'student',
  -- Se tem ao menos 1 enrollment ativo nessa org → membership ativo
  CASE
    WHEN student_data.has_active_enrollment THEN 'active'
    ELSE 'inactive'
  END,
  student_data.earliest_enrollment,
  now(),
  now()
FROM (
  SELECT
    e.student_id,
    c.organization_id,
    bool_or(e.status = 'active') AS has_active_enrollment,
    min(e.enrolled_at) AS earliest_enrollment
  FROM public.enrollments e
  JOIN public.classes c ON c.id = e.class_id
  WHERE c.organization_id IS NOT NULL
  GROUP BY e.student_id, c.organization_id
) student_data
-- Não inserir se já existe QUALQUER membership para esse (user, org)
-- Isso preserva memberships de admin sem sobrescrever com 'student'
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_memberships om
  WHERE om.user_id = student_data.student_id
    AND om.organization_id = student_data.organization_id
);

-- Reativar memberships inativos de alunos que têm enrollment ativo
-- (para idempotência em re-execução)
UPDATE public.organization_memberships om
SET
  status = 'active',
  left_at = NULL,
  updated_at = now()
FROM (
  SELECT
    e.student_id,
    c.organization_id
  FROM public.enrollments e
  JOIN public.classes c ON c.id = e.class_id
  WHERE e.status = 'active'
    AND c.organization_id IS NOT NULL
  GROUP BY e.student_id, c.organization_id
) active_students
WHERE om.user_id = active_students.student_id
  AND om.organization_id = active_students.organization_id
  AND om.status IN ('inactive', 'removed')
  AND om.role = 'student';


-- -----------------------------------------------------------------------
-- B.3) Preencher users.current_organization_id
--
-- Lógica:
--   - Deriva a partir de current_class_id → classes.organization_id
--   - SÓ preenche se current_organization_id IS NULL (não sobrescreve)
--   - Valida que a classe existe e tem organization_id
--
-- Segurança:
--   - Não sobrescreve valores existentes
--   - Só usa classes com organization_id válido
-- -----------------------------------------------------------------------

UPDATE public.users u
SET
  current_organization_id = c.organization_id
FROM public.classes c
WHERE u.current_class_id = c.id
  AND u.current_organization_id IS NULL      -- NÃO sobrescrever
  AND c.organization_id IS NOT NULL;         -- Só se org válida


COMMIT;


-- ============================================================================
-- SEÇÃO C — RELATÓRIO PÓS-BACKFILL (somente leitura)
-- Rodar DEPOIS do backfill para validar resultado.
-- ============================================================================

-- C.1) Totais de memberships por tipo
SELECT
  'memberships_total' AS metrica, count(*) AS valor
FROM public.organization_memberships
UNION ALL
SELECT 'memberships_active', count(*)
FROM public.organization_memberships WHERE status = 'active'
UNION ALL
SELECT 'memberships_inactive', count(*)
FROM public.organization_memberships WHERE status = 'inactive'
UNION ALL
SELECT 'memberships_owner', count(*)
FROM public.organization_memberships WHERE role = 'owner' AND status = 'active'
UNION ALL
SELECT 'memberships_teacher', count(*)
FROM public.organization_memberships WHERE role = 'teacher' AND status = 'active'
UNION ALL
SELECT 'memberships_student', count(*)
FROM public.organization_memberships WHERE role = 'student' AND status = 'active';


-- C.2) Validação: duplicidade de membership ativo (DEVE retornar 0 linhas)
SELECT
  user_id,
  organization_id,
  count(*) AS duplicatas
FROM public.organization_memberships
WHERE status = 'active'
GROUP BY user_id, organization_id
HAVING count(*) > 1;


-- C.3) Cobertura de current_organization_id
SELECT
  'users_com_current_org' AS metrica, count(*) AS valor
FROM public.users WHERE current_organization_id IS NOT NULL
UNION ALL
SELECT 'users_com_current_class_sem_current_org', count(*)
FROM public.users
WHERE current_class_id IS NOT NULL AND current_organization_id IS NULL
UNION ALL
SELECT 'users_sem_current_org_e_sem_class', count(*)
FROM public.users
WHERE current_class_id IS NULL AND current_organization_id IS NULL;


-- C.4) Coerência: current_organization_id bate com a org da current_class
-- (DEVE retornar 0 linhas — se retornar, há inconsistência)
SELECT
  u.id AS user_id,
  u.email,
  u.current_class_id,
  u.current_organization_id,
  c.organization_id AS org_da_classe,
  'INCONSISTENTE: current_org != org da current_class' AS problema
FROM public.users u
JOIN public.classes c ON c.id = u.current_class_id
WHERE u.current_organization_id IS NOT NULL
  AND u.current_organization_id != c.organization_id;


-- C.5) Usuários com enrollment ativo mas SEM membership ativo
-- (DEVE retornar 0 linhas após backfill)
SELECT
  e.student_id AS user_id,
  u.email,
  c.organization_id,
  count(e.id) AS enrollments_ativos
FROM public.enrollments e
JOIN public.classes c ON c.id = e.class_id
JOIN public.users u ON u.id = e.student_id
WHERE e.status = 'active'
  AND c.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = e.student_id
      AND om.organization_id = c.organization_id
      AND om.status = 'active'
  )
GROUP BY e.student_id, u.email, c.organization_id;


-- C.6) Admins sem membership (DEVE retornar 0 linhas)
SELECT
  ap.id AS user_id,
  ap.email,
  ap.organization_id,
  ap.role AS admin_role
FROM public.admin_profiles ap
WHERE ap.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = ap.id
      AND om.organization_id = ap.organization_id
      AND om.status = 'active'
  );


-- C.7) Usuários que precisam de intervenção manual
-- Casos: current_class_id aponta para turma sem org, ou turma inexistente
SELECT
  u.id AS user_id,
  u.email,
  u.current_class_id,
  CASE
    WHEN c.id IS NULL THEN 'TURMA_NAO_EXISTE'
    WHEN c.organization_id IS NULL THEN 'TURMA_SEM_ORG'
    WHEN c.is_active = false THEN 'TURMA_INATIVA'
    ELSE 'OUTRO'
  END AS tipo_problema,
  'Requer intervenção: limpar current_class_id ou associar org manualmente' AS acao
FROM public.users u
LEFT JOIN public.classes c ON c.id = u.current_class_id
WHERE u.current_class_id IS NOT NULL
  AND (c.id IS NULL OR c.organization_id IS NULL);


-- C.8) Resumo final consolidado
SELECT '=== RELATÓRIO FINAL PR-03 ===' AS info
UNION ALL
SELECT '  Memberships criados: ' || (SELECT count(*) FROM public.organization_memberships)::text
UNION ALL
SELECT '    → owners ativos: ' || (SELECT count(*) FROM public.organization_memberships WHERE role = 'owner' AND status = 'active')::text
UNION ALL
SELECT '    → teachers ativos: ' || (SELECT count(*) FROM public.organization_memberships WHERE role = 'teacher' AND status = 'active')::text
UNION ALL
SELECT '    → students ativos: ' || (SELECT count(*) FROM public.organization_memberships WHERE role = 'student' AND status = 'active')::text
UNION ALL
SELECT '    → inativos: ' || (SELECT count(*) FROM public.organization_memberships WHERE status = 'inactive')::text
UNION ALL
SELECT '  Users com current_organization_id: ' || (SELECT count(*) FROM public.users WHERE current_organization_id IS NOT NULL)::text
UNION ALL
SELECT '  Duplicatas ativas (DEVE SER 0): ' || (
  SELECT count(*) FROM (
    SELECT user_id, organization_id FROM public.organization_memberships
    WHERE status = 'active' GROUP BY user_id, organization_id HAVING count(*) > 1
  ) d
)::text
UNION ALL
SELECT '  Inconsistências org/class (DEVE SER 0): ' || (
  SELECT count(*) FROM public.users u
  JOIN public.classes c ON c.id = u.current_class_id
  WHERE u.current_organization_id IS NOT NULL AND u.current_organization_id != c.organization_id
)::text
UNION ALL
SELECT '  Admins sem membership (DEVE SER 0): ' || (
  SELECT count(*) FROM public.admin_profiles ap
  WHERE ap.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = ap.id AND om.organization_id = ap.organization_id AND om.status = 'active'
    )
)::text
UNION ALL
SELECT '  Alunos ativos sem membership (DEVE SER 0): ' || (
  SELECT count(DISTINCT (e.student_id, c.organization_id)) FROM public.enrollments e
  JOIN public.classes c ON c.id = e.class_id
  WHERE e.status = 'active' AND c.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = e.student_id AND om.organization_id = c.organization_id AND om.status = 'active'
    )
)::text;
