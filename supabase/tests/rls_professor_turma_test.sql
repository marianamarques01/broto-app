-- Testes RLS professor → turma → aluno
--
-- PREFERIR o script automatizado (JWT reais, setup/cleanup):
--   deno run --allow-env --allow-net supabase/scripts/rls-professor-turma-test.ts
--
-- Este arquivo SQL exige role com acesso a auth.users (SQL Editor / postgres).
-- Requer migration 20260625140000_chat_logs_rls aplicada.

BEGIN;

-- UUIDs fixos (só existem nesta transação rollback)
DO $setup$
DECLARE
  v_org1 uuid := 'a1000000-0000-4000-8000-000000000001';
  v_org2 uuid := 'a1000000-0000-4000-8000-000000000002';
  v_class1 uuid := 'b2000000-0000-4000-8000-000000000001';
  v_class2 uuid := 'b2000000-0000-4000-8000-000000000002';
  v_aluno_a uuid := 'c3000000-0000-4000-8000-000000000001';
  v_aluno_b uuid := 'c3000000-0000-4000-8000-000000000002';
  v_prof_x uuid := 'd4000000-0000-4000-8000-000000000001';
  v_tp_a uuid := 'e5000000-0000-4000-8000-000000000001';
  v_tp_b uuid := 'e5000000-0000-4000-8000-000000000002';
  v_cl_a uuid := 'f6000000-0000-4000-8000-000000000001';
  v_cl_b uuid := 'f6000000-0000-4000-8000-000000000002';
BEGIN
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES
    (v_aluno_a, 'rls-test-aluno-a@broto.invalid', crypt('test', gen_salt('bf')), now(), now(), now()),
    (v_aluno_b, 'rls-test-aluno-b@broto.invalid', crypt('test', gen_salt('bf')), now(), now(), now()),
    (v_prof_x, 'rls-test-prof-x@broto.invalid', crypt('test', gen_salt('bf')), now(), now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, nome, email)
  VALUES
    (v_aluno_a, 'Aluno A', 'rls-test-aluno-a@broto.invalid'),
    (v_aluno_b, 'Aluno B', 'rls-test-aluno-b@broto.invalid'),
    (v_prof_x, 'Prof X', 'rls-test-prof-x@broto.invalid')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organizations (id, name, slug, owner_id, is_public)
  VALUES
    (v_org1, 'RLS Test Org 1', 'rls-test-org-1', v_prof_x, false),
    (v_org2, 'RLS Test Org 2', 'rls-test-org-2', v_aluno_b, false)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.classes (id, organization_id, name, access_code, created_by, is_active)
  VALUES
    (v_class1, v_org1, 'Turma Org1', 'RLSTEST1', v_prof_x, true),
    (v_class2, v_org2, 'Turma Org2', 'RLSTEST2', v_aluno_b, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organization_memberships (user_id, organization_id, role, status)
  VALUES
    (v_aluno_a, v_org1, 'student', 'active'),
    (v_aluno_b, v_org2, 'student', 'active'),
    (v_prof_x, v_org1, 'teacher', 'active')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.enrollments (class_id, student_id, status)
  VALUES
    (v_class1, v_aluno_a, 'active'),
    (v_class2, v_aluno_b, 'active')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.topic_performance (id, user_id, topico_value, total_answered, total_correct, accuracy_pct)
  VALUES
    (v_tp_a, v_aluno_a, 'rls-test-topico', 10, 7, 70),
    (v_tp_b, v_aluno_b, 'rls-test-topico', 5, 3, 60)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.chat_logs (id, user_id, class_id, session_id, question, answer, turn_index)
  VALUES
    (v_cl_a, v_aluno_a, v_class1::text, 'a0000000-0000-4000-8000-000000000099', 'Pergunta A', 'Resposta A', 0),
    (v_cl_b, v_aluno_b, v_class2::text, 'a0000000-0000-4000-8000-000000000098', 'Pergunta B', 'Resposta B', 0)
  ON CONFLICT (id) DO NOTHING;
END;
$setup$;

CREATE OR REPLACE FUNCTION pg_temp.assert_count(p_label text, p_sql text, p_expected bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_actual bigint;
BEGIN
  EXECUTE p_sql INTO v_actual;
  IF v_actual IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION '[FAIL] %: esperado %, obteve %', p_label, p_expected, v_actual;
  END IF;
  RAISE NOTICE '[PASS] % (count=%)', p_label, p_actual;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.as_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.as_postgres()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
END;
$$;

-- === topic_performance ===

SELECT pg_temp.as_user('d4000000-0000-4000-8000-000000000001'); -- prof_x
SELECT pg_temp.assert_count(
  'prof_x lê topic_performance de aluno_a',
  $$SELECT count(*)::bigint FROM public.topic_performance WHERE user_id = 'c3000000-0000-4000-8000-000000000001'$$,
  1
);

SELECT pg_temp.assert_count(
  'prof_x NÃO lê topic_performance de aluno_b',
  $$SELECT count(*)::bigint FROM public.topic_performance WHERE user_id = 'c3000000-0000-4000-8000-000000000002'$$,
  0
);

SELECT pg_temp.as_user('c3000000-0000-4000-8000-000000000001'); -- aluno_a
SELECT pg_temp.assert_count(
  'aluno_a lê próprio topic_performance',
  $$SELECT count(*)::bigint FROM public.topic_performance WHERE user_id = 'c3000000-0000-4000-8000-000000000001'$$,
  1
);

SELECT pg_temp.assert_count(
  'aluno_a NÃO lê topic_performance de aluno_b',
  $$SELECT count(*)::bigint FROM public.topic_performance WHERE user_id = 'c3000000-0000-4000-8000-000000000002'$$,
  0
);

-- === chat_logs (requer migration 20260625140000_chat_logs_rls) ===

SELECT pg_temp.as_user('d4000000-0000-4000-8000-000000000001'); -- prof_x
SELECT pg_temp.assert_count(
  'prof_x lê chat_logs de aluno_a',
  $$SELECT count(*)::bigint FROM public.chat_logs WHERE user_id = 'c3000000-0000-4000-8000-000000000001'$$,
  1
);

SELECT pg_temp.assert_count(
  'prof_x NÃO lê chat_logs de aluno_b',
  $$SELECT count(*)::bigint FROM public.chat_logs WHERE user_id = 'c3000000-0000-4000-8000-000000000002'$$,
  0
);

SELECT pg_temp.as_user('c3000000-0000-4000-8000-000000000001'); -- aluno_a
SELECT pg_temp.assert_count(
  'aluno_a lê próprio chat_logs',
  $$SELECT count(*)::bigint FROM public.chat_logs WHERE user_id = 'c3000000-0000-4000-8000-000000000001'$$,
  1
);

SELECT pg_temp.assert_count(
  'aluno_a NÃO lê chat_logs de aluno_b',
  $$SELECT count(*)::bigint FROM public.chat_logs WHERE user_id = 'c3000000-0000-4000-8000-000000000002'$$,
  0
);

SELECT pg_temp.as_postgres();
DO $finish$ BEGIN RAISE NOTICE 'Todos os testes RLS professor→turma passaram.'; END $finish$;

ROLLBACK;
