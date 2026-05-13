'use client';

import { useCallback, useEffect, useState } from 'react';
import { Shield, User as UserIcon, Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import PageHeader from '@/components/ui/PageHeader';
import UserModal from '@/components/UserModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { listSubProjects, listUsers, deleteUser } from '@/lib/data/store';
import { isAdmin } from '@/lib/types';
import type { User } from '@/lib/types';

export default function UserManagementPage() {
  const { user, addToast } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [us, subs] = await Promise.all([listUsers(), listSubProjects()]);
    setUsers(us);
    const c: Record<string, number> = {};
    subs.forEach((s) => (c[s.picId] = (c[s.picId] ?? 0) + 1));
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      addToast('success', 'User deleted');
      setDeleteTarget(null);
      await reload();
    } catch (e) {
      addToast('error', (e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin(user)) {
    return (
      <div className="p-6 md:p-10 max-w-content mx-auto">
        <PageHeader title="User Management" />
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <p className="text-sm text-text-muted">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-content mx-auto">
      <PageHeader
        title="User Management"
        subtitle="All registered users and their assigned workload"
        action={
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} /> New User
          </button>
        }
      />

      {loading ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-elevated text-text-muted items-center justify-center mb-3">
            <UserIcon size={22} />
          </div>
          <p className="text-sm font-medium text-text-primary">No users yet</p>
          <p className="text-xs text-text-muted mt-1">Click &quot;New User&quot; to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-border rounded-2xl shadow-card p-5 relative group">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base ${u.role === 'ADMIN' ? 'bg-primary-light text-primary' : 'bg-elevated text-text-secondary'}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{u.name}</p>
                  <p className="text-xs text-text-muted font-mono">{u.username}</p>
                </div>
                <span className={`pill ${u.role === 'ADMIN' ? 'bg-primary-light text-primary border border-primary/20' : 'bg-elevated text-text-secondary border border-border'}`}>
                  {u.role === 'ADMIN' ? <Shield size={11} /> : <UserIcon size={11} />}
                  {u.role}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Assigned sub-projects</span>
                <span className="font-mono font-bold text-text-primary">{counts[u.id] ?? 0}</span>
              </div>
              {u.email && <p className="text-xs text-text-muted mt-2 truncate">{u.email}</p>}

              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditing(u); setModalOpen(true); }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light"
                  aria-label="Edit user"
                >
                  <Pencil size={14} />
                </button>
                {u.id !== user?.id && (
                  <button
                    onClick={() => setDeleteTarget(u)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50"
                    aria-label="Delete user"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          reload();
          addToast('success', editing ? 'User updated' : 'User created');
        }}
        existing={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete user?"
        message={`"${deleteTarget?.name}" will be permanently removed. Any sub-projects assigned to them keep their PIC reference but the user will no longer exist.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
