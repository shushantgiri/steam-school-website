-- =============================================================================
-- The School of STEAM Education — Supabase schema
-- Run this once in the Supabase SQL editor (Database → SQL → New query).
-- Safe to re-run: everything is IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- ---------- CMS content documents (news, notices, events, settings, gallery) --
-- Each key holds one JSON document, written only by the server (service role).
create table if not exists public.cms_documents (
  key         text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------- Admission applications (public site inserts via the server) ------
create table if not exists public.applications (
  id               text primary key,
  student          text not null,
  grade            text not null,
  dob              text not null default '',
  previous_school  text not null default '',
  parent           text not null,
  phone            text not null,
  email            text not null default '',
  address          text not null default '',
  documents        jsonb not null default '[]'::jsonb,
  status           text not null default 'New'
                   check (status in ('New','Reviewing','Accepted','Rejected','Waitlisted')),
  notes            text not null default '',
  assigned_to      text not null default '',
  created_at       timestamptz not null default now()
);
-- Safe upgrade for databases created before assigned_to existed:
alter table public.applications add column if not exists assigned_to text not null default '';
create index if not exists applications_created_idx on public.applications (created_at desc);

-- ---------- Contact messages -------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key,
  name        text not null,
  email       text not null default '',
  phone       text not null default '',
  subject     text not null default 'Website enquiry',
  body        text not null,
  status      text not null default 'Unread'
              check (status in ('Unread','Read','Replied','Archived')),
  created_at  timestamptz not null default now()
);
create index if not exists messages_created_idx on public.messages (created_at desc);

-- ---------- Admin activity log ----------------------------------------------
create table if not exists public.activity (
  id          uuid primary key,
  actor       text not null,
  action      text not null,
  type        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists activity_created_idx on public.activity (created_at desc);

-- ---------- Admin roles (used with Supabase Auth users) ----------------------
-- One row per admin account; role powers future per-role permissions.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  role        text not null default 'Editor'
              check (role in ('Super Admin','Content Manager','Admission Manager','Editor','Teacher')),
  status      text not null default 'Active' check (status in ('Active','Disabled')),
  created_at  timestamptz not null default now()
);

-- Invitations issued from the CMS (create via supabase.auth.admin.inviteUserByEmail).
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        text not null default 'Editor',
  status      text not null default 'Pending' check (status in ('Pending','Accepted','Expired')),
  invited_by  text not null default '',
  created_at  timestamptz not null default now()
);

-- ==========

-- Examination results (see supabase/migration-results.sql when upgrading an
-- existing project from the pre-batch results table).
--
-- Results are grouped into BATCHES: one class + examination + academic year,
-- with a human title like "Annual Examination Result 2082". Publishing is a
-- batch-level switch; per-row dates of birth are Bikram Sambat strings with
-- an AD mirror for reliable date handling.

create table if not exists public.result_batches (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  class            text not null,
  examination_name text not null,
  academic_year    text not null,
  description      text not null default '',
  subjects         jsonb not null default '[]'::jsonb,   -- marks scheme [{name, full_marks, pass_marks}]
  issue_date_bs    text not null default '',             -- marksheet "Date of Issue" (BS)
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

create table if not exists public.exam_results (
  id                      uuid primary key default gen_random_uuid(),
  batch_id                uuid not null references public.result_batches (id) on delete cascade,
  student_name            text not null,
  student_name_normalized text not null,
  date_of_birth_bs        text not null,           -- "2068-04-15" (Bikram Sambat)
  date_of_birth_ad        text not null default '',-- same day in AD (ISO), may be empty
  gpa                     numeric(3,2) not null check (gpa >= 0 and gpa <= 4),
  result_status           text not null default 'Passed'
                          check (result_status in ('Passed','Failed','Withheld')),
  remarks                 text not null default '',
  created_by              text not null default '',
  updated_by              text not null default '',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- One student appears once per batch (the duplicate rule the importer relies on).
create unique index if not exists exam_results_batch_identity
  on public.exam_results (batch_id, student_name_normalized, date_of_birth_bs);

-- The public search path: name + BS dob (batch join supplies class/year/published).
create index if not exists exam_results_search
  on public.exam_results (student_name_normalized, date_of_birth_bs);
create index if not exists exam_results_batch on public.exam_results (batch_id);

-- =============================================================================
-- Row Level Security
-- The app talks to these tables ONLY through server code holding the service
-- role key (which bypasses RLS). Locking the tables down with RLS + no anon
-- policies means the anon/browser key can read or write NOTHING directly —
-- so a leaked anon key exposes no admissions data, no messages, no content
-- writes. Public content reaches browsers through the app's own pages/APIs.
-- =============================================================================
alter table public.cms_documents enable row level security;
alter table public.exam_results   enable row level security;
alter table public.result_batches enable row level security;
alter table public.applications  enable row level security;
alter table public.messages      enable row level security;
alter table public.activity      enable row level security;
alter table public.profiles      enable row level security;
alter table public.invitations   enable row level security;

-- Signed-in admins may read their own profile (used once Supabase Auth manages staff).
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

-- =============================================================================
-- Storage
-- Create these buckets (Storage → New bucket), or run the inserts below:
--   school-media      PUBLIC   — gallery photos, page images
--   school-documents  PRIVATE  — admission documents, internal PDFs
-- =============================================================================
insert into storage.buckets (id, name, public)
  values ('school-media', 'school-media', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('school-documents', 'school-documents', false)
  on conflict (id) do nothing;