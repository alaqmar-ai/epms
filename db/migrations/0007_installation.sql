-- ─── installation period ────────────────────────────────────────────────────
-- Sub-projects gain an installation period (a free text label), and an
-- admin-managed list of selectable periods lives in installation_periods.
-- Stored as text (not an enum) so admins can edit the list from Settings
-- without a schema migration. Idempotent.

alter table sub_projects add column if not exists installation text;

create table if not exists installation_periods (
  id uuid primary key default gen_random_uuid(),
  label text unique not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

insert into installation_periods (label, position) values
  ('March 2026', 1),
  ('May 2026', 2),
  ('August 2026', 3),
  ('September 2026', 4),
  ('March 2027', 5),
  ('April 2027', 6),
  ('N/A', 7)
on conflict (label) do nothing;
