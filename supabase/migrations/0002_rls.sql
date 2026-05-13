-- ============================================================================
-- EPMS — Row Level Security
--
-- Policy summary:
--   ADMIN   → full read/write across all tables
--   STAFF   → read all project data, write only to own assignments
--             attendance read self + all (analytics); write only via admin
--             notifications read/update own only
-- ============================================================================

-- helper: resolve current app user
create or replace function current_app_user() returns users
language sql stable as $$
  select * from users where auth_id = auth.uid() limit 1;
$$;

create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce((select role = 'ADMIN' from current_app_user()), false);
$$;

create or replace function current_user_id() returns uuid
language sql stable as $$
  select id from current_app_user();
$$;

alter table users              enable row level security;
alter table categories         enable row level security;
alter table major_projects     enable row level security;
alter table sub_projects       enable row level security;
alter table stage_schedules    enable row level security;
alter table attendance_records enable row level security;
alter table holiday_calendar   enable row level security;
alter table notifications      enable row level security;
alter table activity_logs      enable row level security;

-- ─── users ──────────────────────────────────────────────────────────────────
drop policy if exists users_read on users;
create policy users_read on users for select using (true);

drop policy if exists users_admin_write on users;
create policy users_admin_write on users for all
  using (is_admin()) with check (is_admin());

-- ─── categories ─────────────────────────────────────────────────────────────
drop policy if exists categories_read on categories;
create policy categories_read on categories for select using (true);

drop policy if exists categories_admin_write on categories;
create policy categories_admin_write on categories for all
  using (is_admin()) with check (is_admin());

-- ─── major_projects ─────────────────────────────────────────────────────────
drop policy if exists majors_read on major_projects;
create policy majors_read on major_projects for select using (true);

drop policy if exists majors_admin_write on major_projects;
create policy majors_admin_write on major_projects for all
  using (is_admin()) with check (is_admin());

-- ─── sub_projects ───────────────────────────────────────────────────────────
drop policy if exists subs_read on sub_projects;
create policy subs_read on sub_projects for select using (true);

drop policy if exists subs_admin_write on sub_projects;
create policy subs_admin_write on sub_projects for all
  using (is_admin()) with check (is_admin());

drop policy if exists subs_pic_update on sub_projects;
create policy subs_pic_update on sub_projects for update
  using (pic_id = current_user_id())
  with check (pic_id = current_user_id());

-- ─── stage_schedules ────────────────────────────────────────────────────────
drop policy if exists stages_read on stage_schedules;
create policy stages_read on stage_schedules for select using (true);

drop policy if exists stages_admin_write on stage_schedules;
create policy stages_admin_write on stage_schedules for all
  using (is_admin()) with check (is_admin());

drop policy if exists stages_pic_update on stage_schedules;
create policy stages_pic_update on stage_schedules for update
  using (
    exists (select 1 from sub_projects sp
            where sp.id = stage_schedules.sub_project_id
              and sp.pic_id = current_user_id())
  )
  with check (
    exists (select 1 from sub_projects sp
            where sp.id = stage_schedules.sub_project_id
              and sp.pic_id = current_user_id())
  );

-- ─── attendance_records ─────────────────────────────────────────────────────
drop policy if exists attendance_read on attendance_records;
create policy attendance_read on attendance_records for select using (true);

drop policy if exists attendance_admin_write on attendance_records;
create policy attendance_admin_write on attendance_records for all
  using (is_admin()) with check (is_admin());

-- ─── holiday_calendar ───────────────────────────────────────────────────────
drop policy if exists holidays_read on holiday_calendar;
create policy holidays_read on holiday_calendar for select using (true);

drop policy if exists holidays_admin_write on holiday_calendar;
create policy holidays_admin_write on holiday_calendar for all
  using (is_admin()) with check (is_admin());

-- ─── notifications ──────────────────────────────────────────────────────────
drop policy if exists notif_read_own on notifications;
create policy notif_read_own on notifications for select
  using (user_id = current_user_id() or is_admin());

drop policy if exists notif_update_own on notifications;
create policy notif_update_own on notifications for update
  using (user_id = current_user_id() or is_admin())
  with check (user_id = current_user_id() or is_admin());

drop policy if exists notif_admin_insert on notifications;
create policy notif_admin_insert on notifications for insert
  with check (is_admin());

-- ─── activity_logs ──────────────────────────────────────────────────────────
drop policy if exists logs_read on activity_logs;
create policy logs_read on activity_logs for select
  using (is_admin() or user_id = current_user_id());

drop policy if exists logs_insert on activity_logs;
create policy logs_insert on activity_logs for insert with check (true);
