'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import PageHeader from '@/components/ui/PageHeader';
import StatusPill from '@/components/ui/StatusPill';
import { listSubProjects, listStages, listMajorProjects } from '@/lib/data/store';
import type { StageSchedule, SubProject, MajorProject } from '@/lib/types';
import { deriveStageStatus } from '@/lib/status';

interface Row {
  stage: StageSchedule;
  sub: SubProject;
  major?: MajorProject;
}

export default function MyTasksPage() {
  const { user } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [allSubs, majors] = await Promise.all([listSubProjects(), listMajorProjects()]);
      const mine = allSubs.filter((s) => s.picId === user.id);
      const majorById = new Map(majors.map((m) => [m.id, m]));
      const collected: Row[] = [];
      for (const sub of mine) {
        const stages = await listStages(sub.id);
        stages.forEach((st) =>
          collected.push({ stage: st, sub, major: majorById.get(sub.majorProjectId) })
        );
      }
      setRows(collected);
      setLoading(false);
    })();
  }, [user]);

  const open = useMemo(
    () => rows.filter((r) => r.stage.status !== 'Completed' && r.stage.status !== 'Cancelled'),
    [rows]
  );

  return (
    <div className="p-6 md:p-10 max-w-content mx-auto">
      <PageHeader title="My Tasks" subtitle={`Stages assigned to ${user?.name ?? 'you'}`} />

      {loading ? (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : open.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-light text-primary mb-3">
            <ClipboardList size={22} />
          </div>
          <p className="text-sm font-medium text-text-primary">No open tasks</p>
          <p className="text-xs text-text-muted mt-1">Sub-projects assigned to you will populate this list.</p>
        </div>
      ) : (
        <div className="overflow-x-auto data-table">
          <table className="w-full">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Sub Project</th>
                <th>Major Project</th>
                <th>Plan End</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {open.map((r) => {
                const derived = deriveStageStatus({
                  status: r.stage.status,
                  planEnd: r.stage.planEnd,
                  actualEnd: r.stage.actualEnd,
                });
                return (
                  <tr key={r.stage.id}>
                    <td className="font-medium">
                      {r.stage.stageIndex + 1}. {r.stage.stageName}
                    </td>
                    <td>
                      <Link href={`/sub-projects/${r.sub.id}`} className="text-primary hover:underline">
                        {r.sub.projectName}
                      </Link>
                    </td>
                    <td className="text-text-secondary">{r.major?.projectName ?? '—'}</td>
                    <td className="font-mono text-xs">{r.stage.planEnd ?? '—'}</td>
                    <td>
                      <StatusPill status={derived} />
                    </td>
                    <td>
                      <span className="font-mono text-xs text-text-secondary">{Math.round(r.stage.progress ?? 0)}%</span>
                    </td>
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
