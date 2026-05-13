'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useUsers } from '@/hooks/useUsers';
import { useMajorProjects } from '@/hooks/useMajorProjects';
import {
  EQUIPMENT_GROUPS,
  SOURCES,
  CATEGORIES,
  type EquipmentGroup,
  type SourceType,
} from '@/lib/constants';
import type { SubProject } from '@/lib/types';
import { createSubProject, updateSubProject } from '@/lib/data/store';
import { planDuration } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: SubProject | null;
  defaultMajorId?: string;
}

export default function SubProjectModal({ open, onClose, onSaved, existing, defaultMajorId }: Props) {
  const { data: users } = useUsers();
  const { data: majors } = useMajorProjects();

  const [name, setName] = useState('');
  const [majorId, setMajorId] = useState('');
  const [group, setGroup] = useState<EquipmentGroup | ''>('');
  const [source, setSource] = useState<SourceType | ''>('');
  const [category, setCategory] = useState('');
  const [picId, setPicId] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setName(existing.projectName);
      setMajorId(existing.majorProjectId);
      setGroup(existing.equipmentGroup);
      setSource(existing.source);
      setCategory(existing.category);
      setPicId(existing.picId);
      setPlannedStart(existing.plannedStart ?? '');
      setPlannedEnd(existing.plannedEnd ?? '');
      setRemarks(existing.remarks ?? '');
    } else {
      setName('');
      setMajorId(defaultMajorId ?? '');
      setGroup('');
      setSource('');
      setCategory('');
      setPicId('');
      setPlannedStart('');
      setPlannedEnd('');
      setRemarks('');
    }
    setError('');
  }, [existing, defaultMajorId, open]);

  const duration = planDuration(plannedStart, plannedEnd);

  const handleSave = async () => {
    if (!name.trim() || !majorId || !group || !source || !category || !picId) {
      setError('All fields are required (except remarks)');
      return;
    }
    if (plannedStart && plannedEnd && plannedEnd < plannedStart) {
      setError('Planned end cannot be before planned start');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateSubProject(existing.id, {
          projectName: name.trim(),
          majorProjectId: majorId,
          equipmentGroup: group,
          source,
          category,
          picId,
          plannedStart: plannedStart || undefined,
          plannedEnd: plannedEnd || undefined,
          remarks: remarks.trim() || undefined,
        });
      } else {
        await createSubProject({
          majorProjectId: majorId,
          projectName: name.trim(),
          equipmentGroup: group,
          source,
          category,
          picId,
          plannedStart: plannedStart || undefined,
          plannedEnd: plannedEnd || undefined,
          remarks: remarks.trim() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Sub Project' : 'New Sub Project'} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Project name
          </label>
          <input className="input-styled" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Major project
          </label>
          <select className="select-styled w-full" value={majorId} onChange={(e) => setMajorId(e.target.value)}>
            <option value="">Select</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.projectName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">PIC</label>
          <select className="select-styled w-full" value={picId} onChange={(e) => setPicId(e.target.value)}>
            <option value="">Select PIC</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Equipment Group
          </label>
          <select
            className="select-styled w-full"
            value={group}
            onChange={(e) => setGroup(e.target.value as EquipmentGroup)}
          >
            <option value="">Select</option>
            {EQUIPMENT_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Source</label>
          <select className="select-styled w-full" value={source} onChange={(e) => setSource(e.target.value as SourceType)}>
            <option value="">Select</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Category
          </label>
          <select className="select-styled w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Planned start
          </label>
          <input
            type="date"
            className="input-styled"
            value={plannedStart}
            onChange={(e) => setPlannedStart(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Planned end
          </label>
          <input type="date" className="input-styled" value={plannedEnd} onChange={(e) => setPlannedEnd(e.target.value)} />
        </div>

        <div className="md:col-span-2 -mt-1">
          <p className="text-xs text-text-muted">
            Planned duration: <span className="font-mono text-text-primary font-semibold">{duration} day{duration === 1 ? '' : 's'}</span> (auto-calculated)
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
            Remarks
          </label>
          <textarea
            className="input-styled min-h-[60px] resize-y"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional"
          />
        </div>

        {error && (
          <div className="md:col-span-2 text-xs text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Create sub project'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
