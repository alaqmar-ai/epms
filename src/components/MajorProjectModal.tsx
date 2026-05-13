'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useUsers } from '@/hooks/useUsers';
import type { MajorProject } from '@/lib/types';
import { createMajorProject, updateMajorProject } from '@/lib/data/store';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: MajorProject | null;
}

export default function MajorProjectModal({ open, onClose, onSaved, existing }: Props) {
  const { data: users } = useUsers();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setName(existing.projectName);
      setDescription(existing.description ?? '');
      setOwnerId(existing.ownerId);
    } else {
      setName('');
      setDescription('');
      setOwnerId('');
    }
    setError('');
  }, [existing, open]);

  const handleSave = async () => {
    if (!name.trim() || !ownerId) {
      setError('Project name and owner are required');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateMajorProject(existing.id, {
          projectName: name.trim(),
          description: description.trim() || undefined,
          ownerId,
        });
      } else {
        await createMajorProject({
          projectName: name.trim(),
          description: description.trim() || undefined,
          ownerId,
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
    <Modal open={open} onClose={onClose} title={existing ? 'Edit Major Project' : 'New Major Project'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Project name</label>
          <input className="input-styled" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chassis Line 4 Retool" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Description</label>
          <textarea
            className="input-styled min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Owner</label>
          <select className="select-styled w-full" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Select owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
        {error && <div className="text-xs text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
