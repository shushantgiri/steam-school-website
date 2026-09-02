-- =============================================================================
-- Marksheet upgrade — run ONCE in the Supabase SQL Editor on a project that
-- already has result_batches / exam_results. Safe to re-run (IF NOT EXISTS).
--
-- Adds the per-batch marks scheme and per-student marksheet fields:
--   result_batches.subjects       jsonb  [{name, full_marks, pass_marks}, ...]
--   result_batches.issue_date_bs  text   "Date of Issue" printed on marksheets
--   exam_results.roll_number      text
--   exam_results.section          text
--   exam_results.attendance_present / attendance_total   integer, nullable
--   exam_results.marks            jsonb  {"Mathematics": 78, "Science": null}
-- Existing rows keep working as GPA-only results (empty scheme, empty marks).
-- =============================================================================

alter table public.result_batches
  add column if not exists subjects      jsonb not null default '[]'::jsonb,
  add column if not exists issue_date_bs text  not null default '';

alter table public.exam_results
  add column if not exists roll_number        text    not null default '',
  add column if not exists section            text    not null default '',
  add column if not exists attendance_present integer,
  add column if not exists attendance_total   integer,
  add column if not exists marks              jsonb   not null default '{}'::jsonb;

alter table public.exam_results
  drop constraint if exists exam_results_attendance_check,
  add constraint exam_results_attendance_check check (
    (attendance_present is null and attendance_total is null)
    or (attendance_present >= 0 and attendance_total > 0 and attendance_present <= attendance_total)
  );

-- Refresh the API schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
