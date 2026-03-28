'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { User, Project } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useToast, ToastMessage } from '@/hooks/useToast';
import { validateToken } from '@/lib/api';
import { CONFIG } from '@/lib/constants';
import Sidebar from './Sidebar';
import ToastContainer from './Toast';

interface AppContextValue {
  user: User | null;
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  reloadProjects: () => Promise<void>;
  addToast: (type: 'success' | 'error', message: string) => void;
  toasts: ToastMessage[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();
  const { projects, loading: projectsLoading, error: projectsError, reload } = useProjects();
  const { toasts, addToast, removeToast } = useToast();

  // Token-based auth
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !user) {
      if (token === CONFIG.TEAM_TOKEN) {
        login({ name: 'Guest', role: 'Viewer' });
        router.replace('/dashboard');
      } else {
        validateToken(token).then((valid) => {
          if (valid) {
            login({ name: 'Guest', role: 'Viewer' });
            router.replace('/dashboard');
          }
        }).catch(() => {});
      }
    }
  }, [searchParams, user, login, router]);

  // Auto-login (login page temporarily removed)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      login({ name: 'Admin', role: 'Admin' });
    }
    if (pathname === '/') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, pathname, router, login]);

  const handleLogout = () => {
    // Login temporarily removed — just reload to re-auto-login
    router.replace('/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    );
  }

  const isLoginPage = pathname === '/';
  const showSidebar = user && !isLoginPage;

  return (
    <AppContext.Provider
      value={{ user, projects, projectsLoading, projectsError, reloadProjects: reload, addToast, toasts }}
    >
      {/* Toyota red top accent line */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-toyota z-50" />

      {showSidebar && (
        <Sidebar user={user} projectCount={projects.length} onLogout={handleLogout} />
      )}

      <main className={showSidebar ? 'md:ml-[220px] pt-[2px]' : 'pt-[2px]'}>
        {children}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </AppContext.Provider>
  );
}
