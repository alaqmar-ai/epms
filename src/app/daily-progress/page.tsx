'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusPill from '@/components/ui/StatusPill';
import { useUsers } from '@/hooks/useUsers';
import { listSubProjects, listStages, listMajorProjects } from '@/lib/data/store';
import type { StageSchedule, SubProject, MajorProject } from '@/lib/types';
import { todayIso, deriveStageStatus } from '@/lib/status';

interface Row {
  stage: StageSchedule;
  sub: SubProject;
  major?: MajorProject;
}

export default function DailyProgressPage() {
  const { data: users } = useUsers();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u.name]));
    return (id: string) => map.get(id) ?? '—';
  }, [users]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = todayIso();
      const [subs, majors] = await Promise.all([listSubProjects(), listMajorProjects()]);
      const majorById = new Map(majors.map((m) => [m.id, m]));
      const collected: Row[] = [];
      for (const sub of subs) {
        const stages = await listStages(sub.id);
        for (const s of stages) {
          if (s.planEnd === today || (s.planStart && s.planStart <= today && s.planEnd && s.planEnd >= today)) {
            collected.push({ stage: s, sub, major: majorById.get(sub.majorProjectId) });
          }
        }
      }
      setRows(collected);
      setLoading(false);
    })();
  }, []);

  const totalDueToday = rows.filter((r) => r.stage.planEnd === todayIso()).length;
  const overdue = rows.filter((r) => {
    const ds = deriveStageStatus({
      status: r.stage.status,
      planEnd: r.stage.planEnd,
      actualEnd: r.stage.actualEnd,
    });
    return ds === 'Delayed';
  }).length;
  const completedToday = rows.filter((r) => r.stage.status === 'Completed').length;

  return (
    <div className="p-6 md:p-10 max-w-content mx-auto">
      <PageHeader
        title="Daily Progress"
        subtitle={`Stages active or due today — ${todayIso()}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatTile label="Due today" value={totalDueToday} icon={<Calendar size={18} />} tone="blue" />
        <StatTile label="Overdue" value={overdue} icon={<AlertCircle size={18} />} tone="red" />
        <StatTile label="Completed" value={completedToday} icon={<CheckCircle2 size={18} />} tone="green" />
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-light text-primary mb-3">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-sm font-medium text-text-primary">Nothing scheduled for today</p>
          <p className="text-xs text-text-muted mt-1">Stages active or due today will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto data-table">
          <table className="w-full">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Sub Project</th>
                <th>Major Project</th>
                <th>PIC</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const derived = deriveStageStatus({
                  status: r.stage.status,
                  planEnd: r.stage.planEnd,
                  actualEnd: r.stage.actualEnd,
                });
                return (
                  <tr key={r.stage.id}>
                    <td className="font-medium text-text-primary whitespace-nowrap">
                      {r.stage.stageIndex + 1}. {r.stage.stageName}
                    </td>
                    <td>
                      <Link href={`/sub-projects/${r.sub.id}`} className="text-primary hover:underline">
                        {r.sub.projectName}
                      </Link>
                    </td>
                    <td className="text-text-secondary">{r.major?.projectName ?? '—'}</td>
                    <td>{userName(r.sub.picId)}</td>
                    <td className="font-mono text-xs">{r.stage.planEnd ?? '—'}</td>
                    <td>
                      <StatusPill status={derived} />
                    </td>
                    <td>
                      <span className="font-mono text-xs text-text-secondary">{Math.round(r.stage.progress ?? 0)}%</span>
                    </td>
                    <td className="text-text-muted text-xs max-w-xs truncate">{r.stage.remarks ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'blue' | 'red' | 'green';
}) {
  const map = {
    blue: 'bg-primary-light text-primary',
    red: 'bg-red-50 text-danger',
    green: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider font-semibold text-text-muted">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${map[tone]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-text-primary font-mono">{value}</p>
    </div>
  );
}
