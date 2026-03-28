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

  const selectClass = "bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:border-eng transition-colors w-full cursor-pointer";
  const inputClass = "bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-eng transition-colors w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-panel border border-border rounded-lg w-full max-w-[900px] mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Project details - 2 column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">PIC</label>
              <input value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Person-In-Charge" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Project Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., CNC Lathe Line 4" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Project Code *</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., EQ-2024-015" className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Equipment Group</label>
              <select value={group} onChange={(e) => setGroup(e.target.value)} className={selectClass}>
                <option value="">Select group</option>
                {EQUIPMENT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
                <option value="">Select source</option>
                {EQUIPMENT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Duration (days)</label>
              <input type="number" value={duration || ''} onChange={(e) => setDuration(Number(e.target.value))} placeholder="0" className={`${inputClass} font-mono`} />
            </div>
          </div>

          {/* Stage schedule */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Stage Schedule</h3>
            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-elevated">
                    <th className="px-2 py-2 text-[10px] text-text-muted uppercase tracking-wider w-8">#</th>
                    <th className="px-2 py-2 text-[10px] text-text-muted uppercase tracking-wider">Stage</th>
                    <th className="px-2 py-2 text-[10px] text-text-muted uppercase tracking-wider">Plan Start</th>
                    <th className="px-2 py-2 text-[10px] text-text-muted uppercase tracking-wider">Plan End</th>
                    <th className="px-2 py-2 text-[10px] text-text-muted uppercase tracking-wider">Actual Start</th>
                    <th className="px-2 py-2 text-[10px] text-text-muted uppercase tracking-wider">Actual End</th>
                    <th className="px-2 py-2 text-[10px] text-text-muted uppercase tracking-wider text-center w-8">&#10003;</th>
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

          {error && <p className="text-xs text-danger">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-md transition-colors cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 text-sm bg-eng hover:bg-sky-600 text-white rounded-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
