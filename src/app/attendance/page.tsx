'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import { useUsers } from '@/hooks/useUsers';
import {
  ATTENDANCE_WEEKDAY,
  ATTENDANCE_WEEKEND,
  ATTENDANCE_COLORS,
} from '@/lib/constants';
import {
  listAttendance,
  listHolidays,
  upsertAttendance,
  deleteAttendance,
} from '@/lib/data/store';
import type { AttendanceRecord, Holiday } from '@/lib/types';
import { canEditAttendance } from '@/lib/types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pad(n: number) { return String(n).padStart(2, '0'); }
function isoDate(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export default function AttendancePage() {
  const { user } = useApp();
  const { data: users } = useUsers();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ date: string; userId: string } | null>(null);

  // default selectedUser to current user (or first user for admin)
  useEffect(() => {
    if (!selectedUser && user) {
      setSelectedUser(user.id);
    }
  }, [user, selectedUser]);

  const reload = async () => {
    setLoading(true);
    const [recs, hols] = await Promise.all([
      listAttendance({ year, monthIndex }, selectedUser || undefined),
      listHolidays(),
    ]);
    setRecords(recs);
    setHolidays(hols);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedUser) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, monthIndex, selectedUser]);

  const recordByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach((r) => map.set(r.date, r));
    return map;
  }, [records]);

  const holidayByDate = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  const startWeekday = monthStart.getDay(); // 0=Sun
  const daysInMonth = monthEnd.getDate();

  const cells: Array<{ day?: number; date?: string; weekday?: number }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({});
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, monthIndex, d);
    cells.push({ day: d, date: isoDate(year, monthIndex, d), weekday: dt.getDay() });
  }

  const monthLabel = `${MONTHS[monthIndex]} ${year}`;

  const goPrev = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(year - 1);
    } else setMonthIndex(monthIndex - 1);
  };
  const goNext = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(year + 1);
    } else setMonthIndex(monthIndex + 1);
  };

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    });
    return counts;
  }, [records]);

  const canEdit = canEditAttendance(user);

  return (
    <div className="p-6 md:p-10 max-w-content mx-auto">
      <PageHeader
        title="Attendance Calendar"
        subtitle={canEdit ? 'Admin can edit any day. Click a date to mark attendance.' : 'View your attendance record.'}
      />

      <div className="bg-white border border-border rounded-2xl shadow-card p-5 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="btn-ghost p-2" aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-lg font-bold text-text-primary min-w-[150px] text-center">{monthLabel}</h2>
            <button onClick={goNext} className="btn-ghost p-2" aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
          {canEdit && (
            <select
              className="select-styled"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="skeleton h-20" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-[11px] font-semibold uppercase tracking-wide text-text-muted text-center py-1">
                  {d}
                </div>
              ))}
              {cells.map((c, idx) => {
                if (!c.date) return <div key={idx} />;
                const rec = recordByDate.get(c.date);
                const hol = holidayByDate.get(c.date);
                const isWeekend = c.weekday === 0 || c.weekday === 6;
                const tone = rec ? ATTENDANCE_COLORS[rec.status] : isWeekend ? '#F3F4F6' : hol ? '#FEF9C3' : '#FFFFFF';
                const isToday = c.date === isoDate(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <button
                    key={idx}
                    disabled={!selectedUser}
                    onClick={() => setEditing({ date: c.date!, userId: selectedUser })}
                    className={`relative aspect-square rounded-xl border p-2 text-left transition-all hover:ring-2 hover:ring-primary/30 ${
                      isToday ? 'border-primary' : 'border-border'
                    }`}
                    style={{ background: tone }}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-text-primary'}`}>{c.day}</span>
                      {hol && <span className="text-[8px] font-bold text-amber-700 uppercase">Holiday</span>}
                    </div>
                    {rec && (
                      <p className="text-[10px] text-text-secondary font-medium leading-tight mt-1 line-clamp-2">
                        {rec.status}
                      </p>
                    )}
                    {!rec && isWeekend && <p className="text-[10px] text-text-muted mt-1">Weekend</p>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Summary + legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-border rounded-2xl shadow-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Month summary</h3>
          {Object.keys(summary).length === 0 ? (
            <p className="text-xs text-text-muted">No records this month.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(summary)
                .sort((a, b) => b[1] - a[1])
                .map(([status, n]) => (
                  <div key={status} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: ATTENDANCE_COLORS[status] }}>
                    <span className="font-medium text-text-primary">{status}</span>
                    <span className="font-mono font-bold text-text-primary">{n}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Legend</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[...ATTENDANCE_WEEKDAY, ...ATTENDANCE_WEEKEND].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ background: ATTENDANCE_COLORS[s] }} />
                <span className="text-xs text-text-secondary">{s}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-100" />
              <span className="text-xs text-text-secondary">Public Holiday</span>
            </div>
          </div>
        </div>
      </div>

      <AttendanceEditModal
        editing={editing}
        canEdit={canEdit}
        onClose={() => setEditing(null)}
        onSaved={reload}
        weekday={editing ? new Date(editing.date).getDay() : 0}
        isHoliday={!!editing && holidayByDate.has(editing.date)}
        existing={editing ? recordByDate.get(editing.date) : undefined}
      />
    </div>
  );
}

function AttendanceEditModal({
  editing,
  canEdit,
  onClose,
  onSaved,
  weekday,
  isHoliday,
  existing,
}: {
  editing: { date: string; userId: string } | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
  weekday: number;
  isHoliday: boolean;
  existing?: AttendanceRecord;
}) {
  const { user, addToast } = useApp();
  const [status, setStatus] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(existing?.status ?? '');
    setRemarks(existing?.remarks ?? '');
  }, [editing, existing]);

  if (!editing) return null;

  const isWeekend = weekday === 0 || weekday === 6;
  const options = isWeekend
    ? [...ATTENDANCE_WEEKEND]
    : isHoliday
    ? ['Holiday Job']
    : [...ATTENDANCE_WEEKDAY];

  const save = async () => {
    if (!status || !user) return;
    setBusy(true);
    try {
      await upsertAttendance({
        userId: editing.userId,
        date: editing.date,
        status: status as AttendanceRecord['status'],
        remarks: remarks.trim() || undefined,
        recordedBy: user.id,
      });
      addToast('success', 'Attendance saved');
      onSaved();
      onClose();
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    setBusy(true);
    try {
      await deleteAttendance(existing.id);
      addToast('success', 'Attendance cleared');
      onSaved();
      onClose();
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!editing} onClose={onClose} title={`Attendance — ${editing.date}`} size="sm">
      <div className="space-y-4">
        <div className="text-xs text-text-muted">
          {isWeekend ? 'Weekend day — only "Weekend Job" is allowed.' : isHoliday ? 'Public holiday — only "Holiday Job" is allowed.' : 'Weekday'}
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Status</label>
          <select
            className="select-styled w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={!canEdit}
          >
            <option value="">— None —</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Remarks</label>
          <textarea
            className="input-styled min-h-[60px]"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={!canEdit}
          />
        </div>
        <div className="flex justify-end gap-2">
          {existing && canEdit && (
            <button onClick={remove} disabled={busy} className="inline-flex items-center gap-2 btn-ghost text-danger">
              <Trash2 size={14} /> Clear
            </button>
          )}
          <button onClick={onClose} className="btn-ghost">
            Close
          </button>
          {canEdit && (
            <button onClick={save} disabled={!status || busy} className="btn-primary">
              {busy ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
