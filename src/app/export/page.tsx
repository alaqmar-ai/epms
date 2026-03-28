'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Users, Boxes, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '@/components/AppProvider';
import { EQUIPMENT_GROUPS } from '@/lib/constants';
import { getProjectStatus, getProjectProgress, getCurrentStage, getStageStatus } from '@/lib/status';
import { Project } from '@/lib/types';

export default function ExportPage() {
  const { projects, projectsLoading, addToast } = useApp();
  const [exportGroup, setExportGroup] = useState('');
  const [exportPic, setExportPic] = useState('');
  const [exporting, setExporting] = useState('');

  const pics = Array.from(new Set(projects.map((p) => p.pic).filter(Boolean)));

  const generateExcel = (filtered: Project[], filterLabel: string) => {
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toISOString().split('T')[0];

      const summaryData = filtered.map((p) => ({
        'Project Code': p.code,
        'Project Name': p.name,
        'PIC': p.pic,
        'Equipment Group': p.group,
        'Source': p.source,
        'Duration (days)': p.duration,
        'Status': getProjectStatus(p),
        'Progress %': getProjectProgress(p),
        'Current Stage': getCurrentStage(p),
      }));
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      const stageData: Record<string, string | number | boolean>[] = [];
      filtered.forEach((p) => {
        p.stages.forEach((s, i) => {
          stageData.push({
            'Project Code': p.code,
            'Project Name': p.name,
            'Stage #': i + 1,
            'Stage Name': s.stageName,
            'Plan Start': s.planStart,
            'Plan Finish': s.planFinish,
            'Actual Start': s.actualStart,
            'Actual Finish': s.actualFinish,
            'Completed': s.checked ? 'Yes' : 'No',
            'Status': getStageStatus(s),
          });
        });
      });
      const ws2 = XLSX.utils.json_to_sheet(stageData);
      ws2['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 8 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Stage Details');

      let minDate: Date | null = null;
      let maxDate: Date | null = null;
      filtered.forEach((p) => {
        p.stages.forEach((s) => {
          [s.planStart, s.planFinish, s.actualStart, s.actualFinish].forEach((d) => {
            if (d) {
              const dt = new Date(d);
              if (!minDate || dt < minDate) minDate = dt;
              if (!maxDate || dt > maxDate) maxDate = dt;
            }
          });
        });
      });

      if (minDate && maxDate) {
        const ganttRows: (string | number)[][] = [];
        const header: (string | number)[] = ['Project Code', 'Stage'];
        const days: Date[] = [];
        const endD = maxDate as Date;
        const cur = new Date(minDate as Date);
        while (cur <= endD && days.length < 120) {
          days.push(new Date(cur));
          header.push(cur.toISOString().split('T')[0]);
          cur.setDate(cur.getDate() + 1);
        }
        ganttRows.push(header);

        filtered.forEach((p) => {
          p.stages.forEach((s, i) => {
            const row: (string | number)[] = [p.code, `${i + 1}. ${s.stageName}`];
            days.forEach((d) => {
              const ds = d.getTime();
              const ps = s.planStart ? new Date(s.planStart).getTime() : null;
              const pf = s.planFinish ? new Date(s.planFinish).getTime() : null;
              const as2 = s.actualStart ? new Date(s.actualStart).getTime() : null;
              const af = s.actualFinish ? new Date(s.actualFinish).getTime() : null;
              const isPlan = ps && pf && ds >= ps && ds <= pf;
              const isActual = as2 && (af ? ds >= as2 && ds <= af : ds >= as2 && ds <= Date.now());
              if (isPlan && isActual) row.push('P+A');
              else if (isPlan) row.push('P');
              else if (isActual) row.push('A');
              else row.push('');
            });
            ganttRows.push(row);
          });
        });

        const ws3 = XLSX.utils.aoa_to_sheet(ganttRows);
        ws3['!cols'] = [{ wch: 14 }, { wch: 22 }, ...days.map(() => ({ wch: 5 }))];
        XLSX.utils.book_append_sheet(wb, ws3, 'Gantt Schedule');
      }

      const delayData: Record<string, string | number>[] = [];
      filtered.forEach((p) => {
        p.stages.forEach((s) => {
          if (getStageStatus(s) === 'DELAY' && s.planFinish) {
            const daysOver = Math.ceil((Date.now() - new Date(s.planFinish).getTime()) / (1000 * 60 * 60 * 24));
            delayData.push({
              'Project Code': p.code,
              'Project Name': p.name,
              'PIC': p.pic,
              'Stage': s.stageName,
              'Plan Finish': s.planFinish,
              'Days Overdue': daysOver,
            });
          }
        });
      });
      const ws4 = XLSX.utils.json_to_sheet(delayData.length > 0 ? delayData : [{ 'Info': 'No delayed stages' }]);
      ws4['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws4, 'Delay Report');

      const fileName = `EPMS_Export_${filterLabel}_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);
      addToast('success', `Exported ${fileName}`);
    } catch {
      addToast('error', 'Failed to generate export');
    }
  };

  const handleExport = (type: 'all' | 'group' | 'pic') => {
    setExporting(type);
    setTimeout(() => {
      let filtered = projects;
      let label = 'All';
      if (type === 'group' && exportGroup) {
        filtered = projects.filter((p) => p.group === exportGroup);
        label = exportGroup;
      } else if (type === 'pic' && exportPic) {
        filtered = projects.filter((p) => p.pic === exportPic);
        label = exportPic;
      }
      generateExcel(filtered, label);
      setExporting('');
    }, 100);
  };

  return (
    <div className="p-5 md:p-8 max-w-content mx-auto">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-8">Export Data</h1>

      {/* Export Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => handleExport('all')}
          disabled={projectsLoading || !!exporting}
          className="card p-5 text-left cursor-pointer disabled:opacity-50 group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-transparent" />
          <FileSpreadsheet size={22} className="text-blue-400 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">Overall Export</h3>
          <p className="text-[13px] text-text-muted">Export all projects with full schedule</p>
          {exporting === 'all' && <Loader2 size={14} className="animate-spin text-blue-400 mt-3" />}
        </button>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-transparent" />
          <Boxes size={22} className="text-emerald-400 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">By Equipment Group</h3>
          <p className="text-[13px] text-text-muted mb-3">Filter and export by equipment group</p>
          <div className="flex gap-2">
            <select value={exportGroup} onChange={(e) => setExportGroup(e.target.value)} className="select-styled flex-1">
              <option value="">Select group</option>
              {EQUIPMENT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <button
              onClick={() => handleExport('group')}
              disabled={!exportGroup || !!exporting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {exporting === 'group' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            </button>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
          <Users size={22} className="text-cyan-400 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">By PIC</h3>
          <p className="text-[13px] text-text-muted mb-3">Filter and export by Person-In-Charge</p>
          <div className="flex gap-2">
            <select value={exportPic} onChange={(e) => setExportPic(e.target.value)} className="select-styled flex-1">
              <option value="">Select PIC</option>
              {pics.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              onClick={() => handleExport('pic')}
              disabled={!exportPic || !!exporting}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {exporting === 'pic' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* Custom export */}
      <div className="chart-card">
        <div className="chart-card-header"><h3>Custom Export</h3></div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Group</label>
              <select value={exportGroup} onChange={(e) => setExportGroup(e.target.value)} className="select-styled">
                <option value="">All Groups</option>
                {EQUIPMENT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">PIC</label>
              <select value={exportPic} onChange={(e) => setExportPic(e.target.value)} className="select-styled">
                <option value="">All PICs</option>
                {pics.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button
              onClick={() => {
                let filtered = projects;
                let label = 'All';
                if (exportGroup) { filtered = filtered.filter((p) => p.group === exportGroup); label = exportGroup; }
                if (exportPic) { filtered = filtered.filter((p) => p.pic === exportPic); label += `_${exportPic}`; }
                generateExcel(filtered, label);
              }}
              disabled={projectsLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
