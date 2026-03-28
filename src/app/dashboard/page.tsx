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

const CHART_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#64748b'];

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

  const statusData = useMemo(() => {
    const map: Record<string, number> = { COMPLETED: 0, 'IN PROGRESS': 0, DELAY: 0, 'NOT STARTED': 0 };
    projects.forEach((p) => { map[getProjectStatus(p)]++; });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [projects]);

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

  const stageCompletion = useMemo(() => {
    if (projects.length === 0) return [];
    return STAGES.map((stageName, i) => {
      const completed = projects.filter((p) => p.stages[i]?.checked).length;
      const pct = Math.round((completed / projects.length) * 100);
      return { name: stageName.length > 16 ? stageName.substring(0, 14) + '...' : stageName, pct, fill: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct > 0 ? '#3b82f6' : '#1e293b' };
    });
  }, [projects]);

  const delayHotspots = useMemo(() => {
    return STAGES.map((stageName, i) => {
      const delayed = projects.filter((p) => {
        const stage = p.stages[i];
        return stage && getStageStatus(stage) === 'DELAY';
      }).length;
      return { name: stageName.length > 16 ? stageName.substring(0, 14) + '...' : stageName, count: delayed };
    });
  }, [projects]);

  const chartTooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(30, 41, 59, 0.6)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  };

  return (
    <div className="p-5 md:p-8 max-w-content mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-text-muted mt-1">{formatFullDate(new Date())}</p>
        </div>
        <button
          onClick={() => router.push('/projects?new=1')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* KPI Cards */}
      {projectsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total Projects', value: stats.total, color: '#3b82f6' },
            { label: 'Completed', value: stats.completed, color: '#10b981', subtitle: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total` },
            { label: 'In Progress', value: stats.inProgress, color: '#06b6d4' },
            { label: 'Delayed', value: stats.delayed, color: '#ef4444' },
            { label: 'Avg Completion', value: `${stats.avgProgress}%`, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className={`animate-in animate-in-${i + 1}`}>
              <StatCard label={s.label} value={s.value} subtitle={s.subtitle} accentColor={s.color} />
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 && !projectsLoading ? (
        <div className="text-center py-20 text-text-muted">
          <p className="text-sm">No projects yet. Create your first project to see dashboard analytics.</p>
        </div>
      ) : (
        <>
          {/* Row 2: Status + Plan vs Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Status Distribution</h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Plan vs Actual (%)</h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={planVsActual} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.4)" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>} />
                    <Bar dataKey="plan" fill="rgba(59,130,246,0.4)" name="Plan" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="actual" fill="rgba(16,185,129,0.6)" name="Actual" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: Stage Completion + Delay Hotspots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Stage Completion Rate</h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stageCompletion} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.3)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={110} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}%`, 'Completion']} />
                    <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                      {stageCompletion.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-card-header">
                <h3>Delay Hotspots</h3>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={delayHotspots} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.3)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={110} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="#ef4444" name="Delayed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
