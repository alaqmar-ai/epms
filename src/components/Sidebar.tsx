'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, BarChart3, Target, TrendingUp, Download, LogOut, Menu, X } from 'lucide-react';
import { User } from '@/lib/types';
import { useState } from 'react';

interface SidebarProps {
  user: User;
  projectCount: number;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban, showCount: true },
  { href: '/gantt', label: 'Gantt Chart', icon: BarChart3 },
  { href: '/targets', label: 'Daily Targets', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/export', label: 'Export', icon: Download },
];

export default function Sidebar({ user, projectCount, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex flex-col h-full bg-panel/80 backdrop-blur-xl border-r border-border/50">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/20">
            <span className="text-white text-[10px] font-bold tracking-wider">EP</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary tracking-wide">EPMS</h1>
            <p className="text-[10px] text-text-muted leading-none">Equipment Monitoring</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4" />

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-pointer relative ${
                active
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.03]'
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-blue-400" />
              )}
              <Icon size={17} strokeWidth={active ? 2 : 1.5} />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.showCount && projectCount > 0 && (
                <span className="font-mono text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded-md text-text-muted">
                  {projectCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 mx-3 mb-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-xs font-semibold text-blue-400 border border-blue-500/10">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
            <p className="text-[10px] font-mono text-text-muted">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-red-400 transition-colors cursor-pointer w-full"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 bg-panel/90 backdrop-blur-md border border-border/50 rounded-lg p-2 cursor-pointer"
      >
        {mobileOpen ? <X size={20} className="text-text-primary" /> : <Menu size={20} className="text-text-primary" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed top-0 left-0 z-40 w-[240px] h-full transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-[240px] h-screen fixed left-0 top-0">
        {sidebar}
      </div>
    </>
  );
}
