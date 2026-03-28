'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/components/AppProvider';
import FilterBar from '@/components/FilterBar';
import { EQUIPMENT_GROUPS } from '@/lib/constants';
import { getStageStatus } from '@/lib/status';
import { TableSkeleton } from '@/components/LoadingSpinner';

export default function GanttPage() {
  const { projects, projectsLoading } = useApp();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPic, setSelectedPic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const pics = useMemo(() => Array.from(new Set(projects.map((p) => p.pic).filter(Boolean))), [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (selectedGroup && p.group !== selectedGroup) return false;
      if (selectedPic && p.pic !== selectedPic) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [projects, selectedGroup, selectedPic, searchQuery]);

  // Calculate date range
  const { days } = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    filtered.forEach((p) => {
      p.stages.forEach((s) => {
        [s.planStart, s.planFinish, s.actualStart, s.actualFinish].forEach((d) => {
          if (d) {
            const dt = new Date(d);
            if (!min || dt < min) min = dt;
            if (!max || dt > max) max = dt;
          }
        });
      });
    });
    if (!min || !max) {
      const today = new Date();
      min = new Date(today);
      max = new Date(today);
      max.setDate(max.getDate() + 30);
    }
    // Pad a few days
    const s = new Date(min!);
    s.setDate(s.getDate() - 2);
    const e = new Date(max!);
    e.setDate(e.getDate() + 2);

    const dayList: Date[] = [];
    const curr = new Date(s);
    while (curr <= e && dayList.length < 150) {
      dayList.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return { startDate: s, endDate: e, days: dayList };
  }, [filtered]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group days by month
  const months = useMemo(() => {
    const m: { label: string; span: number }[] = [];
    let current = '';
    days.forEach((d) => {
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (label !== current) {
        m.push({ label, span: 1 });
        current = label;
      } else {
        m[m.length - 1].span++;
      }
    });
    return m;
  }, [days]);

  const dayAbbr = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const COL_W = 28;

  function isInRange(date: Date, start: string, end: string): boolean {
    if (!start) return false;
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= s && date <= e;
  }

  if (projectsLoading) {
    return (
      <div className="p-4 md:p-6 max-w-content mx-auto">
        <h1 className="text-xl font-semibold text-text-primary mb-4">Gantt Chart</h1>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-content mx-auto">
      <h1 className="text-xl font-semibold text-text-primary mb-4">Gantt Chart</h1>

      <FilterBar
        groups={EQUIPMENT_GROUPS}
        pics={pics}
        selectedGroup={selectedGroup}
        selectedPic={selectedPic}
        searchQuery={searchQuery}
        onGroupChange={setSelectedGroup}
        onPicChange={setSelectedPic}
        onSearchChange={setSearchQuery}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1"><span className="w-4 h-[7px] rounded-sm" style={{ backgroundColor: 'rgba(14,165,233,0.35)' }} /> Plan</span>
        <span className="flex items-center gap-1"><span className="w-4 h-[7px] rounded-sm" style={{ backgroundColor: 'rgba(16,185,129,0.7)' }} /> Actual</span>
        <span className="flex items-center gap-1"><span className="w-4 h-[7px] rounded-sm" style={{ backgroundColor: 'rgba(239,68,68,0.7)' }} /> Delay</span>
        <span className="flex items-center gap-1"><span className="w-4 h-[2px]" style={{ backgroundColor: '#f59e0b' }} /> Today</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted text-sm">
          Add projects with dates to see the Gantt chart
        </div>
      ) : days.length > 120 ? (
        <div className="text-center py-8 text-text-muted text-sm">
          Date range exceeds 120 days. Please filter to narrow the view.
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="border-collapse" style={{ minWidth: 280 + days.length * COL_W }}>
              {/* Month header */}
              <thead>
                <tr className="bg-elevated">
                  <th className="sticky left-0 z-10 bg-elevated px-2 py-1 text-[10px] text-text-muted w-[120px] min-w-[120px] border-r border-border" rowSpan={2}>Code</th>
                  <th className="sticky left-[120px] z-10 bg-elevated px-2 py-1 text-[10px] text-text-muted w-[160px] min-w-[160px] border-r border-border" rowSpan={2}>Stage</th>
                  {months.map((m, i) => (
                    <th key={i} colSpan={m.span} className="px-1 py-1 text-[9px] text-text-muted text-center border-b border-border font-normal">
                      {m.label}
                    </th>
                  ))}
                </tr>
                {/* Day header */}
                <tr className="bg-elevated">
                  {days.map((d, i) => {
                    const isToday = d.toDateString() === today.toDateString();
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th
                        key={i}
                        className="text-center py-1 text-[8px] font-normal border-r border-border/30"
                        style={{
                          width: COL_W,
                          minWidth: COL_W,
                          color: isToday ? '#f59e0b' : '#475569',
                          backgroundColor: isWeekend ? '#0f1729' : undefined,
                        }}
                      >
                        {d.getDate()}<br />{dayAbbr[d.getDay()]}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  project.stages.map((stage, si) => {
                    const stageStatus = getStageStatus(stage);
                    const isDelay = stageStatus === 'DELAY';
                    return (
                      <tr key={`${project.id}-${si}`} className={`${si === 0 ? 'border-t-2 border-border' : 'border-t border-border/30'}`}>
                        <td className="sticky left-0 z-10 bg-panel px-2 py-1 font-mono text-[10px] text-eng border-r border-border whitespace-nowrap">
                          {si === 0 ? project.code : ''}
                        </td>
                        <td className="sticky left-[120px] z-10 bg-panel px-2 py-1 text-[10px] text-text-secondary border-r border-border whitespace-nowrap">
                          {stage.stageName}
                        </td>
                        {days.map((d, di) => {
                          const dateObj = new Date(d);
                          const isToday = dateObj.toDateString() === today.toDateString();
                          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                          const isPlan = isInRange(new Date(d), stage.planStart, stage.planFinish);
                          const isActual = stage.actualStart ? isInRange(new Date(d), stage.actualStart, stage.actualFinish || new Date().toISOString().split('T')[0]) : false;

                          return (
                            <td
                              key={di}
                              className="relative border-r border-border/10"
                              style={{
                                width: COL_W,
                                minWidth: COL_W,
                                height: 24,
                                backgroundColor: isWeekend ? '#0f1729' : undefined,
                              }}
                            >
                              {isToday && <div className="absolute inset-0 border-l-2 border-amber-500/60 z-[1]" />}
                              {isPlan && (
                                <div
                                  className="absolute left-0 right-0 top-[4px] h-[7px] rounded-sm"
                                  style={{ backgroundColor: 'rgba(14,165,233,0.35)' }}
                                />
                              )}
                              {isActual && (
                                <div
                                  className="absolute left-0 right-0 bottom-[4px] h-[7px] rounded-sm"
                                  style={{ backgroundColor: isDelay ? 'rgba(239,68,68,0.7)' : 'rgba(16,185,129,0.7)' }}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
