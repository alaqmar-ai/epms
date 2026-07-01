-- ============================================================================
-- Project Digital Transformation — Schedule submit-lock + plan baseline.
--
-- Additive & idempotent (safe to re-run; the migrate runner replays every file):
--   • sub_projects   : schedule_status (draft/submitted) + who/when submitted
--   • stage_schedules: baseline_start/end — snapshot of the plan taken on the
--                      first Submit, drives the "original plan" ghost bar
--   • notification_kind_enum: add 'schedule_changed'
-- No data is dropped.
-- ============================================================================

alter table sub_projects
  add column if not exists schedule_status text not null default 'draft',
  add column if not exists schedule_submitted_at timestamptz,
  add column if not exists schedule_submitted_by uuid references users(id) on delete set null;

alter table stage_schedules
  add column if not exists baseline_start date,
  add column if not exists baseline_end   date;

-- ADD VALUE is permitted inside the runner's transaction on PG12+ as long as the
-- new label is not used in the same transaction (it isn't).
alter type notification_kind_enum add value if not exists 'schedule_changed';
