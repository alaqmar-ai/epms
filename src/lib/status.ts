import { Stage, Project, StageStatus, ProjectStatus } from './types';
import type { Status } from './constants';

// ─── New status helpers (Phase 3+) ─────────────────────────────────────────

export function statusBg(status: Status | string): string {
  const map: Record<string, string> = {
    Pending: 'bg-slate-50 text-slate-700 border border-slate-200',
    'In Progress': 'bg-blue-50 text-blue-700 border border-blue-100',
    Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    Cancelled: 'bg-zinc-100 text-zinc-600 border border-zinc-200 line-through',
    'Not Completed': 'bg-amber-50 text-amber-700 border border-amber-100',
    Delayed: 'bg-red-50 text-red-700 border border-red-100',
  };
  return map[status] ?? 'bg-slate-50 text-slate-700 border border-slate-200';
}

export type Traffic = 'green' | 'yellow' | 'red';

export function trafficFor(progress: number, dueInDays: number): Traffic {
  if (dueInDays < 0 && progress < 100) return 'red';
  if (dueInDays <= 3 && progress < 80) return 'yellow';
  return 'green';
}

export function progressOfSubProject(stages: { status: Status; progress?: number }[]): number {
  if (!stages.length) return 0;
  const total = stages.reduce((acc, s) => {
    if (s.status === 'Completed') return acc + 100;
    if (s.status === 'Cancelled') return acc + 0;
    return acc + (s.progress ?? 0);
  }, 0);
  return Math.round(total / stages.length);
}

export function progressOfMajor(subs: { progress: number; status: Status }[]): number {
  if (!subs.length) return 0;
  const active = subs.filter((s) => s.status !== 'Cancelled');
  if (!active.length) return 0;
  return Math.round(active.reduce((a, s) => a + s.progress, 0) / active.length);
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysUntil(targetIso?: string): number {
  if (!targetIso) return Infinity;
  const today = new Date(todayIso());
  const target = new Date(targetIso);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function deriveStageStatus(stage: {
  status: Status;
  planEnd?: string;
  actualEnd?: string;
}): Status {
  if (stage.status === 'Completed' || stage.status === 'Cancelled') return stage.status;
  if (stage.planEnd && !stage.actualEnd) {
    const due = daysUntil(stage.planEnd);
    if (due < 0) return 'Delayed';
  }
  return stage.status;
}

// ─── Legacy helpers (kept for old /projects, /gantt, /export pages until rewritten) ──

export function getStageStatus(stage: Stage): StageStatus {
  if (stage.checked) return 'COMPLETED';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const planStart = stage.planStart ? new Date(stage.planStart) : null;
  const planFinish = stage.planFinish ? new Date(stage.planFinish) : null;
  const actualStart = stage.actualStart ? new Date(stage.actualStart) : null;
  const actualFinish = stage.actualFinish ? new Date(stage.actualFinish) : null;

  if (planStart) planStart.setHours(0, 0, 0, 0);
  if (planFinish) planFinish.setHours(0, 0, 0, 0);
  if (actualStart) actualStart.setHours(0, 0, 0, 0);
  if (actualFinish) actualFinish.setHours(0, 0, 0, 0);

  if (actualStart && !actualFinish && planFinish && today <= planFinish) return 'IN PROGRESS';
  if (planFinish && today > planFinish && !actualFinish) return 'DELAY';
  if (planStart && today > planStart && !actualStart) return 'DELAY';
  if (planStart && planStart > today) return 'UPCOMING';

  return 'NOT STARTED';
}

export function getProjectStatus(project: Project): ProjectStatus {
  if (!project.stages || project.stages.length === 0) return 'NOT STARTED';

  const allChecked = project.stages.every((s) => s.checked);
  if (allChecked) return 'COMPLETED';

  const statuses = project.stages.map(getStageStatus);
  if (statuses.includes('DELAY')) return 'DELAY';
  if (statuses.includes('IN PROGRESS') || statuses.includes('COMPLETED')) return 'IN PROGRESS';

  return 'NOT STARTED';
}

export function getProjectProgress(project: Project): number {
  if (!project.stages || project.stages.length === 0) return 0;
  const completed = project.stages.filter((s) => s.checked).length;
  return Math.round((completed / project.stages.length) * 100);
}

export function getCurrentStage(project: Project): string {
  if (!project.stages || project.stages.length === 0) return '-';
  for (let i = project.stages.length - 1; i >= 0; i--) {
    if (project.stages[i].checked) {
      if (i < project.stages.length - 1) return project.stages[i + 1].stageName;
      return 'Completed';
    }
  }
  const inProgress = project.stages.find((s) => {
    const status = getStageStatus(s);
    return status === 'IN PROGRESS' || status === 'DELAY';
  });
  return inProgress ? inProgress.stageName : project.stages[0].stageName;
}
