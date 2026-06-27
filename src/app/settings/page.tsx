'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarDays, KeyRound, Wrench } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import PageHeader from '@/components/ui/PageHeader';
import { isAdmin } from '@/lib/types';
import {
  listHolidays,
  createHoliday,
  deleteHoliday,
  listActivity,
  listUsers,
  listInstallationPeriods,
  createInstallationPeriod,
  deleteInstallationPeriod,
} from '@/lib/data/store';
import { changePasswordAction } from '@/app/actions/data';
import type { Holiday, HolidayKind, ActivityLog, User, InstallationPeriod } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function SettingsPage() {
  const { user, addToast } = useApp();
  const admin = isAdmin(user);

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // holiday form
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<HolidayKind>('Public Holiday');
  const [saving, setSaving] = useState(false);

  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [activityUsers, setActivityUsers] = useState<User[]>([]);

  // installation periods
  const [installPeriods, setInstallPeriods] = useState<InstallationPeriod[]>([]);
  const [periodLabel, setPeriodLabel] = useState('');
  const [savingPeriod, setSavingPeriod] = useState(false);

  // change-password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [hs, ac, us, ip] = await Promise.all([
      listHolidays(),
      listActivity(50),
      listUsers(),
      listInstallationPeriods(),
    ]);
    setHolidays(hs);
    setActivity(ac);
    setActivityUsers(us);
    setInstallPeriods(ip);
    setLoading(false);
  };

  useEffect(() => {
    if (admin) reload();
    else setLoading(false);
  }, [admin]);

  const userName = (id?: string) => activityUsers.find((u) => u.id === id)?.name ?? '-';

  const changePassword = async () => {
    if (!user) return;
    if (!currentPw || !newPw) {
      addToast('error', 'Fill in all password fields');
      return;
    }
    if (newPw !== confirmPw) {
      addToast('error', 'New passwords do not match');
      return;
    }
    if (newPw.length < 4) {
      addToast('error', 'New password must be at least 4 characters');
      return;
    }
    setChangingPw(true);
    try {
      const res = await changePasswordAction(user.id, currentPw, newPw);
      if (res.ok) {
        addToast('success', 'Password updated');
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
      } else {
        addToast('error', res.error ?? 'Could not change password');
      }
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setChangingPw(false);
    }
  };

  const add = async () => {
    if (!date || !name.trim()) return;
    setSaving(true);
    try {
      await createHoliday({ date, name: name.trim(), kind });
      setDate('');
      setName('');
      addToast('success', 'Holiday added');
      await reload();
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteHoliday(id);
      addToast('success', 'Holiday removed');
      await reload();
    } catch (e) {
      addToast('error', (e as Error).message);
    }
  };

  const addPeriod = async () => {
    if (!periodLabel.trim()) return;
    setSavingPeriod(true);
    try {
      await createInstallationPeriod(periodLabel.trim());
      setPeriodLabel('');
      addToast('success', 'Installation period added');
      await reload();
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setSavingPeriod(false);
    }
  };

  const removePeriod = async (id: string) => {
    try {
      await deleteInstallationPeriod(id);
      addToast('success', 'Installation period removed');
      await reload();
    } catch (e) {
      addToast('error', (e as Error).message);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-content mx-auto">
      <PageHeader
        title="Settings"
        subtitle={admin ? 'Manage public holidays and system preferences' : 'Manage your account'}
      />

      {/* Change password — available to every user */}
      <div className="bg-white border border-border rounded-2xl shadow-card p-5 mb-6 max-w-md">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <KeyRound size={16} className="text-primary" />
          Change password
        </h3>
        <div className="space-y-3">
          <input
            type="password"
            autoComplete="current-password"
            className="input-styled"
            placeholder="Current password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            className="input-styled"
            placeholder="New password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            className="input-styled"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          <button
            onClick={changePassword}
            disabled={changingPw || !currentPw || !newPw}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <KeyRound size={14} /> {changingPw ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </div>

      {admin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1 bg-white border border-border rounded-2xl shadow-card p-5 h-fit">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                Add holiday
              </h3>
              <div className="space-y-3">
                <input type="date" className="input-styled" value={date} onChange={(e) => setDate(e.target.value)} />
                <input
                  type="text"
                  className="input-styled"
                  placeholder="Name (e.g. Hari Raya)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <select className="select-styled w-full" value={kind} onChange={(e) => setKind(e.target.value as HolidayKind)}>
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Annual Leave Deduction">Annual Leave Deduction</option>
                </select>
                <button onClick={add} disabled={saving || !date || !name.trim()} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                  <Plus size={14} /> {saving ? 'Adding…' : 'Add holiday'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Holiday calendar</h3>
              </div>
              {loading ? (
                <div className="p-5 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-10" />
                  ))}
                </div>
              ) : holidays.length === 0 ? (
                <p className="p-10 text-sm text-text-muted text-center">No holidays defined yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left bg-elevated">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase text-text-secondary">Date</th>
                      <th className="px-3 py-3 text-[11px] font-semibold uppercase text-text-secondary">Name</th>
                      <th className="px-3 py-3 text-[11px] font-semibold uppercase text-text-secondary">Kind</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((h) => (
                      <tr key={h.id} className="border-t border-border">
                        <td className="px-5 py-3 font-mono text-sm">{formatDate(h.date)}</td>
                        <td className="px-3 py-3 text-sm font-medium text-text-primary">{h.name}</td>
                        <td className="px-3 py-3 text-xs">
                          <span className={`pill ${h.kind === 'Public Holiday' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-violet-50 text-violet-700 border border-violet-100'}`}>
                            {h.kind}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => remove(h.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 rounded-lg" aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Installation periods */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1 bg-white border border-border rounded-2xl shadow-card p-5 h-fit">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Wrench size={16} className="text-primary" />
                Add installation period
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  className="input-styled"
                  placeholder="e.g. June 2027"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPeriod()}
                />
                <button onClick={addPeriod} disabled={savingPeriod || !periodLabel.trim()} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                  <Plus size={14} /> {savingPeriod ? 'Adding…' : 'Add period'}
                </button>
                <p className="text-[11px] text-text-muted">Shown in the Installation dropdown when creating sub projects.</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-white border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Installation periods</h3>
              </div>
              {installPeriods.length === 0 ? (
                <p className="p-10 text-sm text-text-muted text-center">No installation periods defined yet.</p>
              ) : (
                <div className="p-4 flex flex-wrap gap-2">
                  {installPeriods.map((p) => (
                    <span key={p.id} className="pill bg-elevated border border-border text-text-primary inline-flex items-center gap-2 pr-1.5">
                      {p.label}
                      <button
                        onClick={() => removePeriod(p.id)}
                        className="p-0.5 text-text-muted hover:text-danger hover:bg-red-50 rounded"
                        aria-label={`Remove ${p.label}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit trail */}
          <div className="mt-6 bg-white border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">Recent activity</h3>
              <p className="text-xs text-text-muted mt-0.5">Last 50 changes across projects, stages and attendance.</p>
            </div>
            {activity.length === 0 ? (
              <p className="p-8 text-sm text-text-muted text-center">No activity recorded yet.</p>
            ) : (
              <table className="w-full">
                <thead className="bg-elevated">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] uppercase tracking-wide text-text-secondary">Time</th>
                    <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wide text-text-secondary">User</th>
                    <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wide text-text-secondary">Action</th>
                    <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wide text-text-secondary">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-5 py-2.5 text-xs font-mono text-text-muted whitespace-nowrap">
                        {formatDateTime(a.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-text-primary">{userName(a.userId)}</td>
                      <td className="px-3 py-2.5 text-xs">
                        <span className="pill bg-primary-light text-primary border border-primary/10">{a.action}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-text-muted font-mono truncate max-w-xs">
                        {a.refType ? `${a.refType}/${(a.refId ?? '').slice(0, 12)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
