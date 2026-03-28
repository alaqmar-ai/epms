'use client';

import { useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { useApp } from '@/components/AppProvider';
import StatCard from '@/components/StatCard';
import { StatCardSkeleton } from '@/components/LoadingSpinner';
import { getProjectStatus, getProjectProgress, getStageStatus } from '@/lib/status';
import { STAGES, STATUS_COLORS } from '@/lib/constants';

const GROUP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#64748b'];
const chartTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(30, 41, 59, 0.6)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

export default function AnalyticsPage() {
  const { projects, projectsLoading } = useApp();

  const stats = useMemo(() => {
    const totalStages = projects.length * 11;
    const completedStages = projects.reduce((acc, p) => acc + p.stages.filter((s) => s.checked).length, 0);
    const avgProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + getProjectProgress(p), 0) / projects.length) : 0;
    const delayedStages = projects.reduce((acc, p) => acc + p.stages.filter((s) => getStageStatus(s) === 'DELAY').length, 0);
    return { total: projects.length, totalStages, completedStages, avgProgress, delayedStages };
  }, [projects]);

  const radarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return STAGES.map((name, i) => {
      const planDone = projects.filter((p) => {
        const s = p.stages[i];
        if (!s || !s.planFinish) return false;
        const pf = new Date(s.planFinish);
        pf.setHours(0, 0, 0, 0);
        return pf <= today;
      }).length;
      const actualDone = projects.filter((p) => p.stages[i]?.checked).length;
      return { stage: name.length > 12 ? name.substring(0, 10) + '..' : name, plan: planDone, actual: actualDone };
    });
  }, [projects]);

  const progressData = useMemo(() => {
    return [...projects]
      .map((p) => ({
        name: p.code || p.name.substring(0, 15),
        progress: getProjectProgress(p),
        fill: STATUS_COLORS[getProjectStatus(p)] || '#64748b',
      }))
      .sort((a, b) => b.progress - a.progress);
  }, [projects]);

  const groupData = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach((p) => { map[p.group] = (map[p.group] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const picData = useMemo(() => {
    const map: Record<string, number> = {};
    projects.forEach((p) => { map[p.pic] = (map[p.pic] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [projects]);

  const trendData = useMemo(() => {
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const year = d.getFullYear();
      const month = d.getMonth();
      let count = 0;
      projects.forEach((p) => {
        p.stages.forEach((s) => {
          if (s.actualFinish) {
            const af = new Date(s.actualFinish);
            if (af.getFullYear() === year && af.getMonth() === month) count++;
          }
        });
      });
      months.push({ label, count });
    }
    return months;
  }, [projects]);

  if (projectsLoading) {
    return (
      <div className="p-5 md:p-8 max-w-content mx-auto">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-8">Analytics & Performance</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-5 md:p-8 max-w-content mx-auto">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-8">Analytics & Performance</h1>
        <div className="text-center py-20 text-text-muted text-sm">Add projects to see analytics</div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-content mx-auto">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-8">Analytics & Performance</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Projects" value={stats.total} accentColor="#3b82f6" />
        <StatCard label="Stages Completed" value={`${stats.completedStages} / ${stats.totalStages}`} accentColor="#10b981" />
        <StatCard label="Average Progress" value={`${stats.avgProgress}%`} accentColor="#f59e0b" />
        <StatCard label="Delayed Stages" value={stats.delayedStages} accentColor="#ef4444" />
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="chart-card">
          <div className="chart-card-header"><h3>Plan vs Actual by Stage</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(30, 41, 59, 0.5)" />
                <PolarAngleAxis dataKey="stage" tick={{ fill: '#64748b', fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 9 }} />
                <Radar name="Plan" dataKey="plan" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" strokeWidth={1.5} />
                <Radar name="Actual" dataKey="actual" stroke="#10b981" fill="rgba(16,185,129,0.15)" strokeWidth={1.5} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '11px' }}>{v}</span>} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header"><h3>Project Progress Overview</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={progressData} layout="vertical" margin={{ left: 5, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.3)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} width={90} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v}%`, 'Progress']} />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                  {progressData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="chart-card">
          <div className="chart-card-header"><h3>Equipment Group Distribution</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={groupData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0} label={({ name, value }) => `${name} (${value})`}>
                  {groupData.map((_, i) => <Cell key={i} fill={GROUP_COLORS[i % GROUP_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header"><h3>PIC Workload</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={picData} margin={{ left: 5, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.3)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="#3b82f6" name="Projects" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="chart-card">
        <div className="chart-card-header"><h3>Monthly Completion Trend</h3></div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.3)" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#trendGrad)" name="Stages Completed" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
