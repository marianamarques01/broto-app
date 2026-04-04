-- Seed: ENEM como organizacao publica
-- UUIDs fixos (hex valido) para facilitar referencia em seeds futuros

-- 1. Inserir organizacao ENEM
insert into public.organizations (id, name, slug, is_public, owner_id, config)
values (
  'a0e00000-0000-4000-8000-000000000001',
  'ENEM',
  'enem',
  true,
  '942397fd-bb75-4af0-b0c0-a0c92447071d',
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
  }'
)
on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      is_public = excluded.is_public,
      owner_id = excluded.owner_id,
      config = excluded.config;

-- 2. Inserir perfil admin para o owner
insert into public.admin_profiles (id, full_name, email, organization_id, role)
values (
  '942397fd-bb75-4af0-b0c0-a0c92447071d',
  'Admin ENEM',
  'teste@gmail.com',
  'a0e00000-0000-4000-8000-000000000001',
  'owner'
)
on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      organization_id = excluded.organization_id,
      role = excluded.role;

-- 2b. Membership de staff (fonte de authz do admin app; PR-10)
insert into public.organization_memberships (user_id, organization_id, role, status, joined_at)
select
  '942397fd-bb75-4af0-b0c0-a0c92447071d'::uuid,
  'a0e00000-0000-4000-8000-000000000001'::uuid,
  'owner',
  'active',
  now()
where not exists (
  select 1
  from public.organization_memberships om
  where om.user_id = '942397fd-bb75-4af0-b0c0-a0c92447071d'
    and om.organization_id = 'a0e00000-0000-4000-8000-000000000001'
    and om.status = 'active'
);

-- 3. Inserir turma ENEM (aberta, acesso publico via codigo)
insert into public.classes (id, organization_id, name, description, access_code, is_active, created_by)
values (
  'b0c00000-0000-4000-8000-000000000001',
  'a0e00000-0000-4000-8000-000000000001',
  'ENEM 2026',
  'Turma aberta para preparação do ENEM. Qualquer aluno pode entrar.',
  'ENEM26',
  true,
  '942397fd-bb75-4af0-b0c0-a0c92447071d'
)
on conflict (id) do update
  set organization_id = excluded.organization_id,
      name = excluded.name,
      description = excluded.description,
      access_code = excluded.access_code,
      is_active = excluded.is_active,
      created_by = excluded.created_by;

-- 4. Matricular alunos existentes na turma ENEM
insert into public.enrollments (class_id, student_id)
select
  'b0c00000-0000-4000-8000-000000000001',
  id
from public.users
where current_class_id is null
on conflict (class_id, student_id) do nothing;

-- 5. Atualizar current_class_id nos users existentes
update public.users
  set current_class_id = 'b0c00000-0000-4000-8000-000000000001'
  where current_class_id is null;
