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
    <div className="flex flex-col h-full bg-panel border-r border-border">
      {/* Brand */}
      <div className="p-4">
        <h1 className="text-base font-bold text-text-primary tracking-wide">EPMS</h1>
        <p className="text-[10px] text-text-muted mt-0.5">Equipment Project Monitoring</p>
      </div>
      <div className="h-[2px] bg-toyota mx-4" />

      {/* Nav */}
      <nav className="flex-1 py-3 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 mb-0.5 cursor-pointer ${
                active
                  ? 'bg-card text-eng border-l-[3px] border-eng'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.showCount && projectCount > 0 && (
                <span className="font-mono text-[10px] bg-elevated px-1.5 py-0.5 rounded text-text-muted">
                  {projectCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-xs font-semibold text-text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{user.name}</p>
            <p className="text-[10px] font-mono text-text-muted uppercase">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-danger transition-colors cursor-pointer w-full"
        >
          <LogOut size={14} />
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
        className="md:hidden fixed top-3 left-3 z-50 bg-panel border border-border rounded-md p-2 cursor-pointer"
      >
        {mobileOpen ? <X size={20} className="text-text-primary" /> : <Menu size={20} className="text-text-primary" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed top-0 left-0 z-40 w-[220px] h-full transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-[220px] h-screen fixed left-0 top-0">
        {sidebar}
      </div>
    </>
  );
}
