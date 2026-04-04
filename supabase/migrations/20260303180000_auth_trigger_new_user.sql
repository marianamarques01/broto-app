-- ============================================================
-- Trigger: Cria perfil (users) e pet ao registrar usuário
-- Dispara quando um novo usuário é criado em auth.users
-- ============================================================

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

    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
