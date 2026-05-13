'use client';

import { useEffect, useState } from 'react';
import { Shield, User as UserIcon } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import PageHeader from '@/components/ui/PageHeader';
import { useUsers } from '@/hooks/useUsers';
import { listSubProjects } from '@/lib/data/store';
import { isAdmin } from '@/lib/types';

export default function UserManagementPage() {
  const { user } = useApp();
  const { data: users, loading } = useUsers();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const subs = await listSubProjects();
      const c: Record<string, number> = {};
      subs.forEach((s) => (c[s.picId] = (c[s.picId] ?? 0) + 1));
      setCounts(c);
    })();
  }, []);

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
      />

      {loading ? (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-border rounded-2xl shadow-card p-5">
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
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        Note: user creation, edit and password management activate once Supabase Auth credentials are configured in <span className="font-mono">.env.local</span>. Currently the system ships with seeded demo users (<span className="font-mono">admin / admin</span> and <span className="font-mono">staff / staff</span>).
      </div>
    </div>
  );
}
