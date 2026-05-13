'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createUser, updateUser } from '@/lib/data/store';
import type { User, Role } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  existing?: User | null;
}

export default function UserModal({ open, onClose, onSaved, existing }: Props) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('STAFF');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setUsername(existing.username);
      setName(existing.name);
      setEmail(existing.email ?? '');
      setRole(existing.role);
    } else {
      setUsername('');
      setName('');
      setEmail('');
      setRole('STAFF');
    }
    setError('');
  }, [existing, open]);

  const save = async () => {
    if (!username.trim() || !name.trim()) {
      setError('Username and name are required');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await updateUser(existing.id, {
          username: username.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          role,
        });
      } else {
        await createUser({
          username: username.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          role,
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
    <Modal open={open} onClose={onClose} title={existing ? 'Edit user' : 'New user'} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Username</label>
          <input
            className="input-styled font-mono"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
            placeholder="e.g. jane"
            disabled={!!existing}
          />
          {existing && <p className="text-[10px] text-text-muted mt-1">Username cannot be changed after creation.</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Full name</label>
          <input
            className="input-styled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Email</label>
          <input
            type="email"
            className="input-styled"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="optional"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Role</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('STAFF')}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${role === 'STAFF' ? 'bg-primary-light border-primary text-primary' : 'border-border bg-white text-text-secondary hover:border-primary/40'}`}
            >
              <p className="text-xs font-bold uppercase tracking-wider">Staff</p>
              <p className="text-[10.5px] mt-0.5">View, update own assignments</p>
            </button>
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${role === 'ADMIN' ? 'bg-primary-light border-primary text-primary' : 'border-border bg-white text-text-secondary hover:border-primary/40'}`}
            >
              <p className="text-xs font-bold uppercase tracking-wider">Admin</p>
              <p className="text-[10.5px] mt-0.5">Full access incl. user mgmt</p>
            </button>
          </div>
        </div>

        {error && <div className="text-xs text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost" type="button">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary" type="button">
            {saving ? 'Saving…' : existing ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
