import { Stage, Project, StageStatus, ProjectStatus } from './types';

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
