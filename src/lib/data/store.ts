/**
 * Data adapter — abstracts Supabase vs localStorage fallback.
 *
 * Every UI hook talks to this module, never to Supabase directly.
 * When NEXT_PUBLIC_SUPABASE_URL is set, calls hit Supabase.
 * Otherwise we persist to localStorage so the app stays usable offline.
 */

import { supabaseEnabled, getSupabaseClient } from '@/lib/supabase/client';
import type {
  MajorProject,
  SubProject,
  StageSchedule,
  AttendanceRecord,
  Holiday,
  NotificationItem,
  ActivityLog,
  User,
  Status,
} from '@/lib/types';
import { STAGES } from '@/lib/constants';

// ─── localStorage keys (versioned) ─────────────────────────────────────────

const KEY = {
  users: 'epms_users_v2',
  majors: 'epms_majors_v2',
  subs: 'epms_subs_v2',
  stages: 'epms_stages_v2',
  attendance: 'epms_attendance_v2',
  holidays: 'epms_holidays_v2',
  notifications: 'epms_notifications_v2',
  logs: 'epms_logs_v2',
} as const;

function load<T>(k: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(k: string, v: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k, JSON.stringify(v));
}

function rid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function nowIso() {
  return new Date().toISOString();
}

// ─── Users ─────────────────────────────────────────────────────────────────

const SEED_USERS: User[] = [
  { id: 'u_admin', username: 'admin', name: 'Administrator', role: 'ADMIN', email: 'admin@epms.local' },
  { id: 'u_staff', username: 'staff', name: 'Staff User',    role: 'STAFF', email: 'staff@epms.local' },
  { id: 'u_ahmad', username: 'ahmad', name: 'Ahmad',         role: 'STAFF' },
  { id: 'u_faiz',  username: 'faiz',  name: 'Faiz',          role: 'STAFF' },
  { id: 'u_hidayat', username: 'hidayat', name: 'Hidayat',   role: 'STAFF' },
];

export async function listUsers(): Promise<User[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.from('users').select('*').order('name');
    if (error) throw error;
    return (data ?? []) as User[];
  }
  let users = load<User[]>(KEY.users, []);
  if (users.length === 0) {
    users = SEED_USERS;
    save(KEY.users, users);
  }
  return users;
}

// ─── Major projects ────────────────────────────────────────────────────────

export async function listMajorProjects(): Promise<MajorProject[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.from('major_projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as MajorProject[];
  }
  return load<MajorProject[]>(KEY.majors, []);
}

function actorId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('epms_user_v2');
    if (!raw) return undefined;
    const u = JSON.parse(raw);
    return u?.id;
  } catch {
    return undefined;
  }
}

export async function createMajorProject(
  input: Omit<MajorProject, 'id' | 'createdAt' | 'updatedAt' | 'overallProgress' | 'status'> &
    Partial<Pick<MajorProject, 'status' | 'overallProgress'>>
): Promise<MajorProject> {
  const now = nowIso();
  const mp: MajorProject = {
    id: rid('mp'),
    projectName: input.projectName,
    description: input.description,
    ownerId: input.ownerId,
    status: input.status ?? 'Pending',
    overallProgress: input.overallProgress ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('major_projects')
      .insert({
        project_name: mp.projectName,
        description: mp.description,
        owner_id: mp.ownerId,
        status: mp.status,
        overall_progress: mp.overallProgress,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as MajorProject;
  }
  const all = load<MajorProject[]>(KEY.majors, []);
  all.push(mp);
  save(KEY.majors, all);
  await logActivity({ userId: actorId() ?? '', action: 'create_major_project', refType: 'major_project', refId: mp.id, after: mp });
  return mp;
}

export async function updateMajorProject(id: string, patch: Partial<MajorProject>): Promise<MajorProject> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.from('major_projects').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return data as MajorProject;
  }
  const all = load<MajorProject[]>(KEY.majors, []);
  const i = all.findIndex((m) => m.id === id);
  if (i < 0) throw new Error('Major project not found');
  const before = { ...all[i] };
  all[i] = { ...all[i], ...patch, updatedAt: nowIso() };
  save(KEY.majors, all);
  await logActivity({ userId: actorId() ?? '', action: 'update_major_project', refType: 'major_project', refId: id, before, after: all[i] });
  return all[i];
}

export async function deleteMajorProject(id: string): Promise<void> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { error } = await sb.from('major_projects').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  save(
    KEY.majors,
    load<MajorProject[]>(KEY.majors, []).filter((m) => m.id !== id)
  );
  // cascade
  const subs = load<SubProject[]>(KEY.subs, []);
  const removedSubIds = subs.filter((s) => s.majorProjectId === id).map((s) => s.id);
  save(
    KEY.subs,
    subs.filter((s) => s.majorProjectId !== id)
  );
  save(
    KEY.stages,
    load<StageSchedule[]>(KEY.stages, []).filter((st) => !removedSubIds.includes(st.subProjectId))
  );
  await logActivity({ userId: actorId() ?? '', action: 'delete_major_project', refType: 'major_project', refId: id });
}

// ─── Sub projects ──────────────────────────────────────────────────────────

export async function listSubProjects(majorProjectId?: string): Promise<SubProject[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    let q = sb.from('sub_projects').select('*').order('created_at', { ascending: false });
    if (majorProjectId) q = q.eq('major_project_id', majorProjectId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as SubProject[];
  }
  const all = load<SubProject[]>(KEY.subs, []);
  return majorProjectId ? all.filter((s) => s.majorProjectId === majorProjectId) : all;
}

export async function createSubProject(
  input: Omit<SubProject, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'status' | 'actualStart' | 'actualEnd'> &
    Partial<Pick<SubProject, 'status' | 'progress'>>
): Promise<SubProject> {
  const now = nowIso();
  const sub: SubProject = {
    id: rid('sp'),
    majorProjectId: input.majorProjectId,
    projectName: input.projectName,
    equipmentGroup: input.equipmentGroup,
    source: input.source,
    category: input.category,
    picId: input.picId,
    plannedStart: input.plannedStart,
    plannedEnd: input.plannedEnd,
    progress: input.progress ?? 0,
    status: input.status ?? 'Pending',
    remarks: input.remarks,
    createdAt: now,
    updatedAt: now,
  };

  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('sub_projects')
      .insert({
        major_project_id: sub.majorProjectId,
        project_name: sub.projectName,
        equipment_group: sub.equipmentGroup,
        source: sub.source,
        pic_id: sub.picId,
        planned_start: sub.plannedStart,
        planned_end: sub.plannedEnd,
        status: sub.status,
        progress: sub.progress,
        remarks: sub.remarks,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as SubProject;
  }

  const all = load<SubProject[]>(KEY.subs, []);
  all.push(sub);
  save(KEY.subs, all);
  // auto-seed empty stages for new sub-project
  const stages: StageSchedule[] = load<StageSchedule[]>(KEY.stages, []);
  STAGES.forEach((name, idx) => {
    stages.push({
      id: rid('st'),
      subProjectId: sub.id,
      stageIndex: idx,
      stageName: name,
      plannedDurationDays: 0,
      actualDurationDays: 0,
      status: 'Pending',
      progress: 0,
    });
  });
  save(KEY.stages, stages);
  await logActivity({ userId: actorId() ?? '', action: 'create_sub_project', refType: 'sub_project', refId: sub.id, after: sub });
  return sub;
}

export async function updateSubProject(id: string, patch: Partial<SubProject>): Promise<SubProject> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.from('sub_projects').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return data as SubProject;
  }
  const all = load<SubProject[]>(KEY.subs, []);
  const i = all.findIndex((s) => s.id === id);
  if (i < 0) throw new Error('Sub project not found');
  const before = { ...all[i] };
  all[i] = { ...all[i], ...patch, updatedAt: nowIso() };
  save(KEY.subs, all);
  await logActivity({ userId: actorId() ?? '', action: 'update_sub_project', refType: 'sub_project', refId: id, before, after: all[i] });
  return all[i];
}

export async function deleteSubProject(id: string): Promise<void> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { error } = await sb.from('sub_projects').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  save(
    KEY.subs,
    load<SubProject[]>(KEY.subs, []).filter((s) => s.id !== id)
  );
  save(
    KEY.stages,
    load<StageSchedule[]>(KEY.stages, []).filter((st) => st.subProjectId !== id)
  );
  await logActivity({ userId: actorId() ?? '', action: 'delete_sub_project', refType: 'sub_project', refId: id });
}

// ─── Stage schedules ───────────────────────────────────────────────────────

export async function listStages(subProjectId: string): Promise<StageSchedule[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('stage_schedules')
      .select('*')
      .eq('sub_project_id', subProjectId)
      .order('stage_index');
    if (error) throw error;
    return (data ?? []) as StageSchedule[];
  }
  return load<StageSchedule[]>(KEY.stages, [])
    .filter((s) => s.subProjectId === subProjectId)
    .sort((a, b) => a.stageIndex - b.stageIndex);
}

export async function updateStage(id: string, patch: Partial<StageSchedule>): Promise<StageSchedule> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.from('stage_schedules').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return data as StageSchedule;
  }
  const all = load<StageSchedule[]>(KEY.stages, []);
  const i = all.findIndex((s) => s.id === id);
  if (i < 0) throw new Error('Stage not found');
  const before = { ...all[i] };
  all[i] = { ...all[i], ...patch };
  save(KEY.stages, all);
  await logActivity({ userId: actorId() ?? '', action: 'update_stage', refType: 'stage', refId: id, before, after: all[i] });
  return all[i];
}

// ─── Attendance ────────────────────────────────────────────────────────────

export async function listAttendance(month?: { year: number; monthIndex: number }, userId?: string): Promise<AttendanceRecord[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    let q = sb.from('attendance_records').select('*');
    if (userId) q = q.eq('user_id', userId);
    if (month) {
      const first = new Date(month.year, month.monthIndex, 1).toISOString().slice(0, 10);
      const last = new Date(month.year, month.monthIndex + 1, 0).toISOString().slice(0, 10);
      q = q.gte('date', first).lte('date', last);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as AttendanceRecord[];
  }
  let recs = load<AttendanceRecord[]>(KEY.attendance, []);
  if (userId) recs = recs.filter((r) => r.userId === userId);
  if (month) {
    const m = String(month.monthIndex + 1).padStart(2, '0');
    const pref = `${month.year}-${m}`;
    recs = recs.filter((r) => r.date.startsWith(pref));
  }
  return recs;
}

export async function upsertAttendance(rec: Omit<AttendanceRecord, 'id' | 'createdAt'>): Promise<AttendanceRecord> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('attendance_records')
      .upsert(
        {
          user_id: rec.userId,
          date: rec.date,
          status: rec.status,
          remarks: rec.remarks,
          recorded_by: rec.recordedBy,
        },
        { onConflict: 'user_id,date' }
      )
      .select('*')
      .single();
    if (error) throw error;
    return data as AttendanceRecord;
  }
  const all = load<AttendanceRecord[]>(KEY.attendance, []);
  const i = all.findIndex((r) => r.userId === rec.userId && r.date === rec.date);
  if (i >= 0) {
    all[i] = { ...all[i], ...rec };
  } else {
    all.push({ ...rec, id: rid('att'), createdAt: nowIso() });
  }
  save(KEY.attendance, all);
  return all[i >= 0 ? i : all.length - 1];
}

export async function deleteAttendance(id: string): Promise<void> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { error } = await sb.from('attendance_records').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  save(
    KEY.attendance,
    load<AttendanceRecord[]>(KEY.attendance, []).filter((r) => r.id !== id)
  );
}

// ─── Holidays ──────────────────────────────────────────────────────────────

export async function listHolidays(): Promise<Holiday[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb.from('holiday_calendar').select('*').order('date');
    if (error) throw error;
    return (data ?? []) as Holiday[];
  }
  return load<Holiday[]>(KEY.holidays, []).sort((a, b) => a.date.localeCompare(b.date));
}

export async function createHoliday(input: Omit<Holiday, 'id' | 'createdAt'>): Promise<Holiday> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('holiday_calendar')
      .insert({ date: input.date, name: input.name, kind: input.kind })
      .select('*')
      .single();
    if (error) throw error;
    return data as Holiday;
  }
  const h: Holiday = { ...input, id: rid('h'), createdAt: nowIso() };
  const all = load<Holiday[]>(KEY.holidays, []);
  const i = all.findIndex((x) => x.date === input.date);
  if (i >= 0) all[i] = h;
  else all.push(h);
  save(KEY.holidays, all);
  return h;
}

export async function deleteHoliday(id: string): Promise<void> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { error } = await sb.from('holiday_calendar').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  save(
    KEY.holidays,
    load<Holiday[]>(KEY.holidays, []).filter((h) => h.id !== id)
  );
}

// ─── Notifications ─────────────────────────────────────────────────────────

export async function listNotifications(userId: string): Promise<NotificationItem[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as NotificationItem[];
  }
  return load<NotificationItem[]>(KEY.notifications, [])
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createNotification(n: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>): Promise<NotificationItem> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('notifications')
      .insert({
        user_id: n.userId,
        kind: n.kind,
        title: n.title,
        body: n.body,
        ref_type: n.refType,
        ref_id: n.refId,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as NotificationItem;
  }
  const item: NotificationItem = { ...n, id: rid('nt'), isRead: false, createdAt: nowIso() };
  const all = load<NotificationItem[]>(KEY.notifications, []);
  all.push(item);
  save(KEY.notifications, all);
  return item;
}

export async function markNotificationRead(id: string): Promise<void> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { error } = await sb.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
    return;
  }
  const all = load<NotificationItem[]>(KEY.notifications, []);
  const i = all.findIndex((n) => n.id === id);
  if (i >= 0) {
    all[i].isRead = true;
    save(KEY.notifications, all);
  }
}

// ─── Activity log ──────────────────────────────────────────────────────────

export async function logActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    await sb.from('activity_logs').insert({
      user_id: entry.userId,
      action: entry.action,
      ref_type: entry.refType,
      ref_id: entry.refId,
      before: entry.before,
      after: entry.after,
    });
    return;
  }
  const all = load<ActivityLog[]>(KEY.logs, []);
  all.push({ ...entry, id: rid('log'), createdAt: nowIso() });
  save(KEY.logs, all);
}

export async function listActivity(limit = 100): Promise<ActivityLog[]> {
  if (supabaseEnabled) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ActivityLog[];
  }
  return load<ActivityLog[]>(KEY.logs, [])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// ─── Aggregations / derived fields ─────────────────────────────────────────

export function statusFor(
  todayIso: string,
  planEnd: string | undefined,
  current: Status
): Status {
  if (current === 'Completed' || current === 'Cancelled') return current;
  if (planEnd && todayIso > planEnd) return 'Delayed';
  return current;
}
