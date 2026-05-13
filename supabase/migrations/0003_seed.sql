-- ============================================================================
-- EPMS — Seed data (idempotent)
-- ============================================================================

insert into categories (name) values
  ('New Model'),('Replacement'),('Upgrade'),('Kaizen'),('Safety'),('Cost-down')
on conflict (name) do nothing;

-- Admin + staff demo accounts (auth_id null → linked when real auth is set up)
insert into users (username, name, role, email) values
  ('admin', 'Administrator', 'ADMIN', 'admin@epms.local'),
  ('staff', 'Staff User',    'STAFF', 'staff@epms.local'),
  ('ahmad', 'Ahmad',         'STAFF', null),
  ('faiz',  'Faiz',          'STAFF', null),
  ('hidayat','Hidayat',      'STAFF', null)
on conflict (username) do nothing;
