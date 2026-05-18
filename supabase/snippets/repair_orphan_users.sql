-- REPAIR: cria registros ausentes em public.users para usuários órfãos
--
-- Contexto: o trigger handle_new_user() pode ter falhado silenciosamente
-- em algum momento, deixando rows em auth.users sem correspondência em
-- public.users. Esses usuários ficam presos num loop de redirecionamento
-- /login porque a query em ClassContext (e AuthContext) não encontra perfil.
--
-- Como usar:
--   1. Acesse o Supabase Dashboard → SQL Editor
--   2. Execute este script com o role de serviço (service_role)
--   3. Verifique o output de cada etapa antes de confirmar
--
-- SEGURO: todas as operações usam ON CONFLICT DO NOTHING / IF NOT EXISTS.
-- Pode ser re-executado sem risco de duplicatas.

-- ─────────────────────────────────────────────────────────────────────────────
-- Etapa 1: Diagnóstico — quantos órfãos existem?
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    COUNT(*) AS total_orphan_auth_users
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
  AND au.deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Etapa 2: Criar public.users para cada órfão
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.users (id, email, nome, onboarding_done, created_at)
SELECT
    au.id,
    au.email,
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'full_name', ''),
        NULLIF(au.raw_user_meta_data->>'name', ''),
        split_part(au.email, '@', 1),
        'Usuário'
    ) AS nome,
    false  AS onboarding_done,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
  AND au.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Etapa 3: Criar public.pets para usuários sem pet
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.pets (user_id, fase, nivel, xp, humor, energia, moedas)
SELECT u.id, 'semente', 1, 0, 100, 100, 0
FROM public.users u
LEFT JOIN public.pets p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Etapa 4: Matricular órfãos recém-criados na turma padrão ENEM26
-- (somente se signup_defaults e a turma existirem)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    v_user RECORD;
    v_default_class_id uuid;
BEGIN
    SELECT default_class_id INTO v_default_class_id
    FROM public.signup_defaults
    WHERE id = 1;

    IF v_default_class_id IS NULL THEN
        RAISE WARNING 'signup_defaults sem entrada — pulando matrícula na turma padrão';
        RETURN;
    END IF;

    FOR v_user IN
        SELECT u.id
        FROM public.users u
        WHERE u.current_class_id IS NULL
          AND u.onboarding_done = false
    LOOP
        BEGIN
            PERFORM public.rpc_onboard_new_user_default_org(v_user.id);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'rpc_onboard_new_user_default_org falhou para %: %', v_user.id, SQLERRM;
        END;
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Etapa 5: Verificação final
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
    COUNT(*) FILTER (WHERE pu.id IS NULL) AS still_orphan,
    COUNT(*) FILTER (WHERE pu.id IS NOT NULL AND p.user_id IS NULL) AS missing_pet,
    COUNT(*) FILTER (WHERE pu.id IS NOT NULL AND pu.current_class_id IS NULL) AS no_class
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
LEFT JOIN public.pets p ON p.user_id = pu.id
WHERE au.deleted_at IS NULL;
