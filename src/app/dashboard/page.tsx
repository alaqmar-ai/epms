'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useApp } from '@/components/AppProvider';
import StatCard from '@/components/StatCard';
import { StatCardSkeleton } from '@/components/LoadingSpinner';
import { getProjectStatus, getProjectProgress, getStageStatus } from '@/lib/status';
import { formatFullDate } from '@/lib/utils';
import { STAGES, STATUS_COLORS } from '@/lib/constants';

const CHART_COLORS = ['#10b981', '#0ea5e9', '#ef4444', '#475569'];

export default function DashboardPage() {
  const { projects, projectsLoading } = useApp();
  const router = useRouter();

  const stats = useMemo(() => {
    const total = projects.length;
    const statuses = projects.map(getProjectStatus);
    const completed = statuses.filter((s) => s === 'COMPLETED').length;
    const inProgress = statuses.filter((s) => s === 'IN PROGRESS').length;
    const delayed = statuses.filter((s) => s === 'DELAY').length;
    const avgProgress = total > 0 ? Math.round(projects.reduce((acc, p) => acc + getProjectProgress(p), 0) / total) : 0;
    return { total, completed, inProgress, delayed, avgProgress };
  }, [projects]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    const map: Record<string, number> = { COMPLETED: 0, 'IN PROGRESS': 0, DELAY: 0, 'NOT STARTED': 0 };
    projects.forEach((p) => { map[getProjectStatus(p)]++; });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Plan vs Actual bar chart
  const planVsActual = useMemo(() => {
    return projects.slice(0, 15).map((p) => {
      const total = p.stages.length;
      const planDone = p.stages.filter((s) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pf = s.planFinish ? new Date(s.planFinish) : null;
        return pf && pf <= today;
      }).length;
      const actualDone = p.stages.filter((s) => s.checked).length;
      return {
        name: p.code || p.name.substring(0, 12),
        plan: total > 0 ? Math.round((planDone / total) * 100) : 0,
        actual: total > 0 ? Math.round((actualDone / total) * 100) : 0,
      };
    });
  }, [projects]);

  // Stage completion rate
  const stageCompletion = useMemo(() => {
    if (projects.length === 0) return [];
    return STAGES.map((stageName, i) => {
      const completed = projects.filter((p) => p.stages[i]?.checked).length;
      const pct = Math.round((completed / projects.length) * 100);
      return { name: stageName.length > 16 ? stageName.substring(0, 14) + '...' : stageName, pct, fill: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' };
    });
  }, [projects]);

  // Delay hotspots
  const delayHotspots = useMemo(() => {
    return STAGES.map((stageName, i) => {
      const delayed = projects.filter((p) => {
        const stage = p.stages[i];
        return stage && getStageStatus(stage) === 'DELAY';
      }).length;
      return { name: stageName.length > 16 ? stageName.substring(0, 14) + '...' : stageName, count: delayed };
    });
  }, [projects]);

  const chartTooltipStyle = { backgroundColor: '#1a2234', border: '1px solid #1e293b', borderRadius: '6px', color: '#f1f5f9', fontSize: '12px' };

  return (
    <div className="p-4 md:p-6 max-w-content mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-xs font-mono text-text-muted mt-0.5">{formatFullDate(new Date())}</p>
        </div>
        <button
          onClick={() => router.push('/projects?new=1')}
          className="flex items-center gap-2 bg-toyota hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* KPI Cards */}
      {projectsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <StatCard label="Total Projects" value={stats.total} accentColor="#0ea5e9" />
          <StatCard label="Completed" value={stats.completed} subtitle={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total`} accentColor="#10b981" />
          <StatCard label="In Progress" value={stats.inProgress} accentColor="#06b6d4" />
          <StatCard label="Delayed" value={stats.delayed} accentColor="#ef4444" />
          <StatCard label="Avg Completion" value={`${stats.avgProgress}%`} accentColor="#f59e0b" />
        </div>
      )}

      {projects.length === 0 && !projectsLoading ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-sm">No projects yet. Create your first project to see dashboard analytics.</p>
        </div>
      ) : (
        <>
          {/* Row 2: Status Distribution + Plan vs Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Plan vs Actual (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={planVsActual} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                  <Bar dataKey="plan" fill="rgba(14,165,233,0.5)" name="Plan" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="actual" fill="rgba(16,185,129,0.7)" name="Actual" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Stage Completion + Delay Hotspots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Stage Completion Rate</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stageCompletion} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}%`, 'Completion']} />
                  <Bar dataKey="pct" radius={[0, 2, 2, 0]}>
                    {stageCompletion.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Delay Hotspots</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={delayHotspots} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#ef4444" name="Delayed" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
