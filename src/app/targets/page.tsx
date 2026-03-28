'use client';

import { useMemo } from 'react';
import { useApp } from '@/components/AppProvider';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { StatCardSkeleton } from '@/components/LoadingSpinner';
import { getStageStatus } from '@/lib/status';
import { formatFullDate, formatDate, daysFromToday } from '@/lib/utils';

interface TargetItem {
  projectName: string;
  projectCode: string;
  pic: string;
  stageIndex: number;
  stageName: string;
  planStart: string;
  planFinish: string;
  status: string;
  priority: 'overdue' | 'due-soon' | 'active';
  daysLabel: string;
}

export default function TargetsPage() {
  const { projects, projectsLoading } = useApp();

  const targets = useMemo(() => {
    const items: TargetItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    projects.forEach((project) => {
      project.stages.forEach((stage, i) => {
        const status = getStageStatus(stage);
        if (status === 'COMPLETED' || status === 'NOT STARTED' || status === 'UPCOMING') return;

        if (status === 'DELAY') {
          const daysOver = stage.planFinish ? -daysFromToday(stage.planFinish) : 0;
          items.push({
            projectName: project.name,
            projectCode: project.code,
            pic: project.pic,
            stageIndex: i,
            stageName: stage.stageName,
            planStart: stage.planStart,
            planFinish: stage.planFinish,
            status,
            priority: 'overdue',
            daysLabel: `${daysOver}d overdue`,
          });
        } else if (status === 'IN PROGRESS') {
          const daysLeft = stage.planFinish ? daysFromToday(stage.planFinish) : 999;
          if (daysLeft <= 3) {
            items.push({
              projectName: project.name,
              projectCode: project.code,
              pic: project.pic,
              stageIndex: i,
              stageName: stage.stageName,
              planStart: stage.planStart,
              planFinish: stage.planFinish,
              status,
              priority: 'due-soon',
              daysLabel: daysLeft <= 0 ? 'Due today' : `${daysLeft}d remaining`,
            });
          } else {
            items.push({
              projectName: project.name,
              projectCode: project.code,
              pic: project.pic,
              stageIndex: i,
              stageName: stage.stageName,
              planStart: stage.planStart,
              planFinish: stage.planFinish,
              status,
              priority: 'active',
              daysLabel: 'Active',
            });
          }
        }
      });
    });

    // Sort: overdue first, then due-soon, then active
    const order = { overdue: 0, 'due-soon': 1, active: 2 };
    return items.sort((a, b) => order[a.priority] - order[b.priority]);
  }, [projects]);

  const stats = useMemo(() => ({
    active: targets.filter((t) => t.priority === 'active').length,
    dueSoon: targets.filter((t) => t.priority === 'due-soon').length,
    overdue: targets.filter((t) => t.priority === 'overdue').length,
  }), [targets]);

  const borderColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return '#ef4444';
      case 'due-soon': return '#f59e0b';
      default: return '#0ea5e9';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-content mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Daily Targets</h1>
        <p className="text-xs font-mono text-text-muted mt-0.5">{formatFullDate(new Date())}</p>
      </div>

      {/* KPI Cards */}
      {projectsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <StatCard label="Active Today" value={stats.active} accentColor="#0ea5e9" />
          <StatCard label="Due Within 3 Days" value={stats.dueSoon} accentColor="#f59e0b" />
          <StatCard label="Overdue" value={stats.overdue} accentColor="#ef4444" />
        </div>
      )}

      {/* Target Cards */}
      {targets.length === 0 && !projectsLoading ? (
        <div className="text-center py-16 text-text-muted text-sm">
          No active targets today — all on track
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {targets.map((t, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-md p-3 transition-colors hover:bg-elevated"
              style={{ borderLeftWidth: '3px', borderLeftColor: borderColor(t.priority) }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{t.projectName}</p>
                  <p className="font-mono text-[10px] text-text-muted">{t.projectCode}</p>
                </div>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    color: borderColor(t.priority),
                    backgroundColor: `${borderColor(t.priority)}15`,
                  }}
                >
                  {t.daysLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">
                    Stage {t.stageIndex + 1}: {t.stageName}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted mt-0.5">
                    {formatDate(t.planStart)} → {formatDate(t.planFinish)}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-[10px] text-text-muted mt-2">PIC: {t.pic}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
