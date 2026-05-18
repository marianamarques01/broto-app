-- PR: handle_new_user resiliente — nunca deixa usuário órfão em public.users
--
-- Problema original: rpc_onboard_new_user_default_org() pode lançar exceção
-- se signup_defaults estiver vazio ou a turma ENEM estiver inativa. O Supabase/GoTrue
-- preserva o INSERT em auth.users mas reverte o INSERT em public.users, gerando
-- usuários "órfãos" que travam em PGRST116 ao fazer login.
--
-- Correção: wrapa a chamada de class-join num bloco BEGIN...EXCEPTION para que
-- falhas de enrolment nunca revertam a criação do perfil e do pet.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    meta      jsonb;
    user_nome text;
BEGIN
    meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    user_nome := COALESCE(
        meta->>'full_name',
        meta->>'name',
        split_part(NEW.email, '@', 1),
        'Usuário'
    );

    -- Passo 1: criar perfil em public.users — SEMPRE executado
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

    -- Passo 2: criar pet — SEMPRE executado
    INSERT INTO public.pets (user_id, fase, nivel, xp, humor, energia, moedas)
    VALUES (NEW.id, 'semente', 1, 0, 100, 100, 0);

    -- Passo 3: matricular na turma padrão (best-effort)
    -- Falhas aqui são logadas como WARNING e nunca revertem os passos 1 e 2.
    BEGIN
        PERFORM public.rpc_onboard_new_user_default_org(NEW.id);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[handle_new_user] class enrollment failed for user % — %: % (SQLSTATE: %)',
            NEW.id, NEW.email, SQLERRM, SQLSTATE;
        -- Não re-raise: criação de perfil deve sempre ser bem-sucedida.
    END;

    RETURN NEW;
END;
$$;

-- Garantir que o trigger está instalado (idem ao original, idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
