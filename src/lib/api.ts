import { Project, Stage } from './types';
import { CONFIG, STAGES } from './constants';

const API_URL = CONFIG.API_URL;
const isOffline = !API_URL || API_URL === 'YOUR_APPS_SCRIPT_URL_HERE';

// ── Offline demo data (localStorage-backed) ──

const DEMO_USERS = [
  { name: 'Ahmad', role: 'PIC' },
  { name: 'Faiz', role: 'PIC' },
  { name: 'Hidayat', role: 'Lead' },
  { name: 'Admin', role: 'Admin' },
];

const STORAGE_KEY = 'epms_projects';

function loadLocalProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  // Seed with demo projects on first load
  const seed = generateDemoProjects();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveLocalProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function generateDemoProjects(): Project[] {
  const today = new Date();
  const projects: Project[] = [
    makeDemoProject('EQ-2025-001', 'CNC Lathe Line 4', 'Ahmad', 'Machining', 'Import - Japan', 77, -50),
    makeDemoProject('EQ-2025-002', 'Robotic Welding Cell B', 'Faiz', 'Welding', 'Import - Germany', 66, -40),
    makeDemoProject('EQ-2025-003', 'Conveyor System Assy 2', 'Ahmad', 'Assembly', 'Local', 55, -30),
    makeDemoProject('EQ-2025-004', 'Hydraulic Press 500T', 'Hidayat', 'Press', 'Import - China', 77, -55),
    makeDemoProject('EQ-2025-005', 'Paint Booth Upgrade', 'Faiz', 'Paint', 'Local', 44, -20),
    makeDemoProject('EQ-2026-006', 'AGV Material Handler', 'Ahmad', 'Logistics', 'Import - Japan', 55, -5),
  ];
  return projects;

  function makeDemoProject(code: string, name: string, pic: string, group: string, source: string, duration: number, dayOffset: number): Project {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + dayOffset);
    const id = 'prj_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const stages: Stage[] = STAGES.map((stageName, i) => {
      const stageStart = new Date(startDate);
      stageStart.setDate(stageStart.getDate() + i * Math.round(duration / 11));
      const stageEnd = new Date(stageStart);
      stageEnd.setDate(stageEnd.getDate() + Math.round(duration / 11) - 1);
      const isPast = stageEnd < today;
      const isActive = stageStart <= today && stageEnd >= today;
      const actualStart = isPast || isActive ? fmt(new Date(stageStart.getTime() + (Math.random() * 3 - 1) * 86400000)) : '';
      const actualFinish = isPast ? fmt(new Date(stageEnd.getTime() + (Math.random() * 5 - 2) * 86400000)) : '';
      return {
        stageIndex: i,
        stageName,
        planStart: fmt(stageStart),
        planFinish: fmt(stageEnd),
        actualStart,
        actualFinish,
        checked: isPast,
      };
    });
    return { id, pic, name, code, group, source, duration, stages, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  function fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// ── API functions (online or offline) ──

export async function loginUser(name: string, password: string): Promise<{ name: string; role: string }> {
  if (isOffline) {
    const user = DEMO_USERS.find((u) => u.name.toLowerCase() === name.toLowerCase() && name === password);
    if (!user) throw new Error('Invalid credentials');
    return user;
  }
  const res = await fetch(`${API_URL}?action=login&name=${encodeURIComponent(name)}&password=${encodeURIComponent(password)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Invalid credentials');
  return data.user;
}

export async function fetchAllProjects(): Promise<Project[]> {
  if (isOffline) {
    return loadLocalProjects();
  }
  const res = await fetch(`${API_URL}?action=getAll`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.projects;
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  if (isOffline) {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: 'prj_' + Date.now(),
      createdAt: now,
      updatedAt: now,
      stages: project.stages.length === 11
        ? project.stages
        : STAGES.map((name, i) => ({
            stageIndex: i,
            stageName: name,
            planStart: project.stages[i]?.planStart || '',
            planFinish: project.stages[i]?.planFinish || '',
            actualStart: project.stages[i]?.actualStart || '',
            actualFinish: project.stages[i]?.actualFinish || '',
            checked: project.stages[i]?.checked || false,
          })),
    };
    const all = loadLocalProjects();
    all.push(newProject);
    saveLocalProjects(all);
    return newProject;
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'createProject', data: project }),
    redirect: 'follow',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.project;
}

export async function updateProject(project: Project): Promise<Project> {
  if (isOffline) {
    const all = loadLocalProjects();
    const idx = all.findIndex((p) => p.id === project.id);
    if (idx === -1) throw new Error('Project not found');
    all[idx] = { ...project, updatedAt: new Date().toISOString() };
    saveLocalProjects(all);
    return all[idx];
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'updateProject', data: project }),
    redirect: 'follow',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  if (isOffline) {
    const all = loadLocalProjects();
    const filtered = all.filter((p) => p.id !== id);
    saveLocalProjects(filtered);
    return;
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'deleteProject', id }),
    redirect: 'follow',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
}

export async function validateToken(token: string): Promise<boolean> {
  if (isOffline) {
    return token === CONFIG.TEAM_TOKEN;
  }
  const res = await fetch(`${API_URL}?action=validateToken&token=${token}`);
  const data = await res.json();
  return data.valid === true;
}
