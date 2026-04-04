-- PR-07: estado inicial multi-tenant no signup (regra ENEM26)
-- Após criar public.users + pets, aplica o mesmo fluxo transacional de class-join
-- (membership ativo, matrícula ativa, current_organization_id + current_class_id).
-- Falha em qualquer etapa reverte também o INSERT em auth.users (mesma transação).

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

    -- Código canônico da turma pública ENEM (seed-enem.sql). Idempotente via rpc_class_join.
    PERFORM public.rpc_class_join(NEW.id, 'ENEM26');

    RETURN NEW;
END;
$$;
