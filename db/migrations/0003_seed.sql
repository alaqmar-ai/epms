-- ============================================================================
-- Project Digital Transformation — Seed data (idempotent). Demo users only — sample projects are
-- generated client-side from src/lib/data/seed.ts on first browser load.
-- ============================================================================

-- Bootstrap accounts for a BRAND-NEW database only. The migrate runner replays
-- every file on each run, so this must not resurrect users that were later
-- deleted — guard on an empty users table (real deployments add their own team
-- at runtime and are left untouched).
do $seed$
begin
  if not exists (select 1 from users) then
    insert into users (username, name, role, email) values
      ('admin',   'Administrator', 'ADMIN', 'admin@epms.local'),
      ('staff',   'Staff User',    'STAFF', 'staff@epms.local'),
      ('ahmad',   'Ahmad',         'STAFF', null),
      ('faiz',    'Faiz',          'STAFF', null),
      ('hidayat', 'Hidayat',       'STAFF', null);
  end if;
end $seed$;
