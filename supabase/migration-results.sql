-- =============================================================================
-- MIGRATION: Result Batches + Bikram Sambat dates of birth
-- For Supabase projects created with the OLD flat exam_results table
-- (per-row class / examination_name / academic_year / published columns).
-- Fresh projects should just run supabase/schema.sql instead.
-- Run ONCE in the SQL Editor. Wrapped in a transaction; safe to re-run only
-- if the first run failed before COMMIT.
-- =============================================================================
begin;

-- 1) Allow the Teacher role on staff profiles (no-op if already applied).
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('Super Admin','Content Manager','Admission Manager','Editor','Teacher'));

-- 2) The batches table.
create table if not exists public.result_batches (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  class            text not null,
  examination_name text not null,
  academic_year    text not null,
  description      text not null default '',
  published        boolean not null default false,
  created_by       text not null default '',
  updated_by       text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists result_batches_filters
  on public.result_batches (academic_year, class, published);
create index if not exists result_batches_created
  on public.result_batches (created_at desc);
alter table public.result_batches enable row level security;

-- 3) New columns on exam_results.
alter table public.exam_results add column if not exists batch_id uuid;
alter table public.exam_results add column if not exists date_of_birth_bs text;
alter table public.exam_results add column if not exists date_of_birth_ad text not null default '';

-- 4) One batch per (examination, year, class) group found in the old rows;
--    a group counts as published if any of its rows was published.
insert into public.result_batches (title, class, examination_name, academic_year, published)
select
  r.examination_name || ' Result ' || r.academic_year,
  r.class, r.examination_name, r.academic_year,
  bool_or(r.published)
from public.exam_results r
where r.batch_id is null
group by r.class, r.examination_name, r.academic_year;

update public.exam_results r
set batch_id = b.id
from public.result_batches b
where r.batch_id is null
  and b.class = r.class
  and b.examination_name = r.examination_name
  and b.academic_year = r.academic_year;

-- 5) The old date column held the BS string typed into the CMS.
update public.exam_results
set date_of_birth_bs = to_char(date_of_birth, 'YYYY-MM-DD')
where date_of_birth_bs is null;

-- 6) Drop the moved columns and the old indexes, tighten constraints.
drop index if exists exam_results_identity;
drop index if exists exam_results_search;
drop index if exists exam_results_year;
alter table public.exam_results
  drop column if exists class,
  drop column if exists examination_name,
  drop column if exists academic_year,
  drop column if exists published,
  drop column if exists date_of_birth;
alter table public.exam_results alter column batch_id set not null;
alter table public.exam_results alter column date_of_birth_bs set not null;
alter table public.exam_results
  add constraint exam_results_batch_fk
  foreign key (batch_id) references public.result_batches (id) on delete cascade;

create unique index if not exists exam_results_batch_identity
  on public.exam_results (batch_id, student_name_normalized, date_of_birth_bs);
create index if not exists exam_results_search
  on public.exam_results (student_name_normalized, date_of_birth_bs);
create index if not exists exam_results_batch on public.exam_results (batch_id);

commit;

-- No anon policies on purpose: results are reachable ONLY through the app's
-- own rate-limited server endpoint, never by browser queries.
