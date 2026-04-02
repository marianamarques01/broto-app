-- Migration: Indexes, FK fixes, RLS hardening, triggers
-- Date: 2026-03-23
-- Addresses: B1 (indexes), B3 (ON DELETE SET NULL), B5 (inactive classes),
--            B6 (materials org_id consistency), B7 (enrollments updated_at)

-- ============================================================
-- 1) INDEXES for RLS performance (B1)
-- ============================================================

create index if not exists idx_enrollments_class_id
  on public.enrollments(class_id);

create index if not exists idx_enrollments_student_id
  on public.enrollments(student_id);

create index if not exists idx_enrollments_class_student
  on public.enrollments(class_id, student_id);

create index if not exists idx_enrollments_status
  on public.enrollments(status);

create index if not exists idx_classes_organization_id
  on public.classes(organization_id);

create index if not exists idx_classes_access_code
  on public.classes(access_code);

create index if not exists idx_classes_created_by
  on public.classes(created_by);

create index if not exists idx_materials_class_id
  on public.materials(class_id);

create index if not exists idx_materials_organization_id
  on public.materials(organization_id);

create index if not exists idx_materials_index_status
  on public.materials(index_status);

create index if not exists idx_admin_profiles_organization_id
  on public.admin_profiles(organization_id);

create index if not exists idx_organizations_owner_id
  on public.organizations(owner_id);

create index if not exists idx_user_question_answers_user_id
  on public.user_question_answers(user_id);

create index if not exists idx_user_question_answers_user_created
  on public.user_question_answers(user_id, created_at desc);

create index if not exists idx_topic_performance_user_id
  on public.topic_performance(user_id);

-- ============================================================
-- 2) FK fix: users.current_class_id ON DELETE SET NULL (B3)
-- ============================================================

-- Drop existing FK and re-add with ON DELETE SET NULL
do $$
begin
  -- Find and drop the existing constraint
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'users'
      and constraint_type = 'FOREIGN KEY'
      and constraint_name in (
        select constraint_name from information_schema.constraint_column_usage
        where table_schema = 'public' and table_name = 'classes' and column_name = 'id'
      )
  ) then
    execute (
      select 'alter table public.users drop constraint ' || quote_ident(tc.constraint_name)
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
        and tc.table_schema = kcu.table_schema
      where tc.table_schema = 'public'
        and tc.table_name = 'users'
        and tc.constraint_type = 'FOREIGN KEY'
        and kcu.column_name = 'current_class_id'
      limit 1
    );
  end if;
end $$;

alter table public.users
  add constraint fk_users_current_class
  foreign key (current_class_id)
  references public.classes(id)
  on delete set null;

-- ============================================================
-- 3) RLS fix: students cannot see inactive classes (B5)
-- ============================================================

drop policy if exists "aluno vê própria turma" on public.classes;
create policy "aluno vê própria turma"
  on public.classes for select
  using (
    is_active = true
    and id in (
      select class_id from public.enrollments
      where student_id = (select auth.uid()) and status = 'active'
    )
  );

-- ============================================================
-- 4) Trigger: enforce materials.organization_id consistency (B6)
-- ============================================================

create or replace function public.fn_materials_set_org_id()
returns trigger
language plpgsql
security definer
as $$
begin
  select organization_id into new.organization_id
    from public.classes
    where id = new.class_id;

  if new.organization_id is null then
    raise exception 'Class % not found or has no organization', new.class_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_materials_set_org_id on public.materials;
create trigger trg_materials_set_org_id
  before insert or update of class_id on public.materials
  for each row
  execute function public.fn_materials_set_org_id();

-- ============================================================
-- 5) Add updated_at to enrollments (B7)
-- ============================================================

alter table public.enrollments
  add column if not exists updated_at timestamptz default now();

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_enrollments_updated_at on public.enrollments;
create trigger trg_enrollments_updated_at
  before update on public.enrollments
  for each row
  execute function public.fn_set_updated_at();

-- ============================================================
-- 6) Admin SELECT policy for user_question_answers (F3 hardening)
-- ============================================================

drop policy if exists "admin vê respostas dos alunos" on public.user_question_answers;
create policy "admin vê respostas dos alunos"
  on public.user_question_answers for select
  to authenticated
  using (
    user_id in (
      select e.student_id from public.enrollments e
      join public.classes c on c.id = e.class_id
      where c.organization_id in (
        select organization_id from public.admin_profiles where id = (select auth.uid())
      )
    )
  );

drop policy if exists "admin vê performance dos alunos" on public.topic_performance;
create policy "admin vê performance dos alunos"
  on public.topic_performance for select
  to authenticated
  using (
    user_id in (
      select e.student_id from public.enrollments e
      join public.classes c on c.id = e.class_id
      where c.organization_id in (
        select organization_id from public.admin_profiles where id = (select auth.uid())
      )
    )
  );
