-- ============================================================
-- Migration: Cria tabelas users e pets
-- Vinculado ao Supabase Auth (auth.users) via uuid
-- ============================================================

-- Enum para a fase do broto (idempotente: ignora se já existir)
DO $$ BEGIN
    CREATE TYPE pet_fase AS ENUM ('semente', 'muda', 'planta', 'flor', 'especial');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
-- ============================================================
-- Tabela: users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id                          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email                       TEXT        NOT NULL UNIQUE,
    nome                        TEXT        NOT NULL,
    telefone                    TEXT,
    cpf                         TEXT        UNIQUE,
    cidade                      TEXT,
    estado                      TEXT,
    data_nascimento             DATE,
    data_enem                   DATE,
    horas_disponiveis_por_dia   INTEGER     NOT NULL DEFAULT 2,
    image                       TEXT,
    onboarding_done             BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Tabela: pets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pets (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id     UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    nivel       INTEGER     NOT NULL DEFAULT 1,
    xp          INTEGER     NOT NULL DEFAULT 0,
    fase        pet_fase    NOT NULL DEFAULT 'semente',
    humor       INTEGER     NOT NULL DEFAULT 100 CHECK (humor BETWEEN 0 AND 100),
    energia     INTEGER     NOT NULL DEFAULT 100 CHECK (energia BETWEEN 0 AND 100),
    moedas      INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS pets_updated_at ON public.pets;
CREATE TRIGGER pets_updated_at
    BEFORE UPDATE ON public.pets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets  ENABLE ROW LEVEL SECURITY;
-- users: cada usuário lê e edita apenas o próprio registro
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_select_own"  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own"  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"  ON public.users FOR UPDATE USING (auth.uid() = id);
-- pets: cada usuário lê e edita o próprio broto
DROP POLICY IF EXISTS "pets_select_own" ON public.pets;
DROP POLICY IF EXISTS "pets_insert_own" ON public.pets;
DROP POLICY IF EXISTS "pets_update_own" ON public.pets;
CREATE POLICY "pets_select_own"  ON public.pets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pets_insert_own"  ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pets_update_own"  ON public.pets FOR UPDATE USING (auth.uid() = user_id);
-- Service role ignora RLS (Edge Functions com service_role_key têm acesso total);
