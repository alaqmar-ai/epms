'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Project, Stage } from '@/lib/types';
import { STAGES, EQUIPMENT_GROUPS, EQUIPMENT_SOURCES } from '@/lib/constants';
import StageRow from './StageRow';

interface ProjectModalProps {
  open: boolean;
  project?: Project | null;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

function emptyStages(): Stage[] {
  return STAGES.map((name, i) => ({
    stageIndex: i,
    stageName: name,
    planStart: '',
    planFinish: '',
    actualStart: '',
    actualFinish: '',
    checked: false,
  }));
}

export default function ProjectModal({ open, project, onSave, onClose }: ProjectModalProps) {
  const [pic, setPic] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [group, setGroup] = useState('');
  const [source, setSource] = useState('');
  const [duration, setDuration] = useState(0);
  const [stages, setStages] = useState<Stage[]>(emptyStages());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setPic(project.pic);
      setName(project.name);
      setCode(project.code);
      setGroup(project.group);
      setSource(project.source);
      setDuration(project.duration);
      setStages(
        project.stages.length === 11
          ? project.stages
          : emptyStages().map((s, i) => (project.stages[i] ? { ...s, ...project.stages[i] } : s))
      );
    } else {
      setPic('');
      setName('');
      setCode('');
      setGroup('');
      setSource('');
      setDuration(0);
      setStages(emptyStages());
    }
    setError('');
  }, [project, open]);

  const handleStageChange = (index: number, stage: Stage) => {
    const updated = [...stages];
    updated[index] = stage;
    setStages(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Project name is required'); return; }
    if (!code.trim()) { setError('Project code is required'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...(project ? { id: project.id } : {}),
        pic, name: name.trim(), code: code.trim(), group, source, duration, stages,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div
        className="w-full max-w-[900px] mx-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(6, 10, 19, 0.98) 100%)',
          border: '1px solid rgba(30, 41, 59, 0.5)',
          borderRadius: '14px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold text-text-primary">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer transition-colors p-1 rounded-md hover:bg-white/[0.04]">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Project details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">PIC</label>
              <input value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Person-In-Charge" className="input-styled w-full" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Project Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., CNC Lathe Line 4" className="input-styled w-full" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Project Code *</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., EQ-2024-015" className="input-styled w-full font-mono" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Equipment Group</label>
              <select value={group} onChange={(e) => setGroup(e.target.value)} className="select-styled w-full">
                <option value="">Select group</option>
                {EQUIPMENT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="select-styled w-full">
                <option value="">Select source</option>
                {EQUIPMENT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1.5">Duration (days)</label>
              <input type="number" value={duration || ''} onChange={(e) => setDuration(Number(e.target.value))} placeholder="0" className="input-styled w-full font-mono" />
            </div>
          </div>

          {/* Stage schedule */}
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Stage Schedule</h3>
            <div className="data-table overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2.5 text-[10px] text-text-muted font-medium uppercase tracking-wider w-8">#</th>
                    <th className="px-3 py-2.5 text-[10px] text-text-muted font-medium uppercase tracking-wider">Stage</th>
                    <th className="px-3 py-2.5 text-[10px] text-text-muted font-medium uppercase tracking-wider">Plan Start</th>
                    <th className="px-3 py-2.5 text-[10px] text-text-muted font-medium uppercase tracking-wider">Plan End</th>
                    <th className="px-3 py-2.5 text-[10px] text-text-muted font-medium uppercase tracking-wider">Actual Start</th>
                    <th className="px-3 py-2.5 text-[10px] text-text-muted font-medium uppercase tracking-wider">Actual End</th>
                    <th className="px-3 py-2.5 text-[10px] text-text-muted font-medium uppercase tracking-wider text-center w-8">&#10003;</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage, i) => (
                    <StageRow key={i} index={i} stage={stage} onChange={(s) => handleStageChange(i, s)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-text-muted hover:text-text-primary border border-white/[0.08] rounded-lg transition-colors cursor-pointer hover:bg-white/[0.03]">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 font-medium"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
