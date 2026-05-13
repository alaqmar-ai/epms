'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import {
  listMajorProjects,
  listSubProjects,
  listStages,
  listAttendance,
  listUsers,
} from '@/lib/data/store';
import type { SubProject, StageSchedule, User, AttendanceRecord } from '@/lib/types';
import { deriveStageStatus } from '@/lib/status';

const PALETTE = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

export default function AnalyticsPage() {
  const [subs, setSubs] = useState<SubProject[]>([]);
  const [stages, setStages] = useState<StageSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [sp, us] = await Promise.all([listSubProjects(), listUsers()]);
      await listMajorProjects();
      setSubs(sp);
      setUsers(us);
      const all: StageSchedule[] = [];
      for (const s of sp) all.push(...(await listStages(s.id)));
      setStages(all);
      const today = new Date();
      setAttendance(await listAttendance({ year: today.getFullYear(), monthIndex: today.getMonth() }));
      setLoading(false);
    })();
  }, []);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const byPic = useMemo(() => {
    const map: Record<string, { name: string; assigned: number; completed: number; delayed: number; avgProgress: number; _sum: number }> = {};
    subs.forEach((s) => {
      const u = userById.get(s.picId);
      const k = u?.name ?? '—';
      const bucket = (map[k] = map[k] ?? { name: k, assigned: 0, completed: 0, delayed: 0, avgProgress: 0, _sum: 0 });
      bucket.assigned++;
      if (s.status === 'Completed') bucket.completed++;
      if (s.status === 'Delayed') bucket.delayed++;
      bucket._sum += s.progress;
    });
    return Object.values(map).map((b) => ({
      name: b.name,
      assigned: b.assigned,
      completed: b.completed,
      delayed: b.delayed,
      avgProgress: Math.round(b._sum / b.assigned),
    }));
  }, [subs, userById]);

  const byGroup = useMemo(() => bucketBy(subs, (s) => s.equipmentGroup), [subs]);
  const bySource = useMemo(() => bucketBy(subs, (s) => s.source), [subs]);
  const byCategory = useMemo(() => bucketBy(subs, (s) => s.category), [subs]);

  const delayCounts = useMemo(() => {
    let onTrack = 0;
    let delayed = 0;
    stages.forEach((st) => {
      const d = deriveStageStatus({ status: st.status, planEnd: st.planEnd, actualEnd: st.actualEnd });
      if (d === 'Delayed') delayed++;
      else onTrack++;
    });
    return [
      { name: 'On Track', value: onTrack },
      { name: 'Delayed', value: delayed },
    ];
  }, [stages]);

  const attendanceCounts = useMemo(() => {
    const map: Record<string, number> = {};
    attendance.forEach((a) => (map[a.status] = (map[a.status] ?? 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [attendance]);

  return (
    <div className="p-6 md:p-10 max-w-content mx-auto">
      <PageHeader title="Analytics" subtitle="Breakdowns across projects, PICs, attendance and delays" />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Sub projects by PIC">
            {byPic.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byPic}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assigned" name="Assigned" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="delayed" name="Delayed" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="By equipment group">
            {byGroup.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byGroup}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avg" name="Avg progress %" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="By source">
            {bySource.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={bySource} dataKey="count" nameKey="name" outerRadius={100} innerRadius={50}>
                    {bySource.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="By category">
            {byCategory.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Delay analytics (stages)">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={delayCounts} dataKey="value" outerRadius={100} innerRadius={50} label>
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Attendance (current month)">
            {attendanceCounts.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={attendanceCounts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06B6D4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function bucketBy(subs: SubProject[], key: (s: SubProject) => string) {
  const map: Record<string, { name: string; count: number; _sum: number }> = {};
  subs.forEach((s) => {
    const k = key(s);
    const b = (map[k] = map[k] ?? { name: k, count: 0, _sum: 0 });
    b.count++;
    b._sum += s.progress;
  });
  return Object.values(map).map((b) => ({ name: b.name, count: b.count, avg: Math.round(b._sum / b.count) }));
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-card">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return <p className="text-xs text-text-muted text-center py-20">No data yet</p>;
}
