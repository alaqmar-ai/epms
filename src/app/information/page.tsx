'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LogIn,
  LayoutDashboard,
  ClipboardList,
  CalendarRange,
  CalendarCheck,
  CalendarDays,
  BarChart3,
  FileBarChart,
  FolderKanban,
  Layers,
  Users as UsersIcon,
  Settings as SettingsIcon,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import PageHeader from '@/components/ui/PageHeader';
import { isAdmin } from '@/lib/types';

interface Section {
  icon: LucideIcon;
  title: string;
  intro?: string;
  items: string[];
}

// ── What every user (including admins) can do ──
const STAFF_GUIDE: Section[] = [
  {
    icon: LogIn,
    title: 'Signing in & your account',
    items: [
      'Log in with the username and password given to you (the username is not case-sensitive).',
      'Change your password anytime from the Account page — you’ll need your current password, and the new one must be at least 4 characters.',
      'Use “Sign Out” at the bottom of the sidebar when you’re done.',
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    intro: 'Your landing page — everything here is scoped to the sub-projects you’re the PIC of.',
    items: [
      'See your upcoming stage deadlines at a glance.',
      'Track status charts and the progress of the major projects you contribute to.',
      'Jump straight into any of your sub-projects from here.',
    ],
  },
  {
    icon: ClipboardList,
    title: 'My Tasks',
    items: [
      'A single list of your open stages across all your sub-projects, sorted by the nearest deadline.',
      'You only see your own tasks — nothing from other people.',
      'Click a task to open its sub-project.',
    ],
  },
  {
    icon: CalendarRange,
    title: 'Your sub-projects & schedule',
    intro: 'You fully manage the sub-projects where you’re the assigned PIC. Open one from the Dashboard, My Tasks, or Analytics.',
    items: [
      'Detailed Schedule: draw each of the 11 stages on the calendar. Drag across an empty row to create a bar, drag a bar’s ends to stretch it, or its middle to move it.',
      'Submit: locks your plan in as the baseline. You must fill a start and end for all 11 stages before you can submit.',
      'Edit Plan: after submitting you can still change the plan — but doing so notifies your schedule overseer that the plan moved.',
      'Update Actual: lay the green “actual” bars on top as work really happens. Updating actuals never notifies anyone. If an actual runs past its plan, the overrun shows in red.',
      'The faint hatched “original plan” bar appears only where your plan has drifted from what you first submitted.',
      'You can also set each stage’s status, add remarks, and tick off its checkpoints.',
      'On sub-projects you don’t own, you can look but not edit.',
    ],
  },
  {
    icon: CalendarCheck,
    title: 'Daily Progress',
    items: [
      'Your own weekly to-do checklist.',
      'Add items, tick them off, and reorder — it’s personal to you.',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Attendance',
    items: [
      'View your own attendance record on the calendar.',
      'This is read-only for you — only admins record attendance.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    items: [
      'Charts covering your own sub-projects and your own attendance.',
    ],
  },
  {
    icon: FileBarChart,
    title: 'Reports',
    items: [
      'Export your Project Status, Delay Analysis, and Attendance reports.',
      'Download as CSV, Excel, or PDF. Reports cover only your own work.',
    ],
  },
];

// ── Admin-only powers (shown in addition to everything above) ──
const ADMIN_GUIDE: Section[] = [
  {
    icon: ShieldCheck,
    title: 'You can do everything staff can — plus more',
    intro: 'As an admin, everything in the Staff guide applies to you too, but your view is plant-wide (all projects and all people) instead of just your own. The sections below are the extra powers only admins have.',
    items: [
      'Switch to the “Staff Guide” tab above to see exactly what your team members can do.',
    ],
  },
  {
    icon: FolderKanban,
    title: 'Major Projects',
    items: [
      'Create, edit, and delete major projects.',
      'Progress rolls up automatically from each project’s sub-projects.',
    ],
  },
  {
    icon: Layers,
    title: 'Sub Projects',
    items: [
      'Create, edit, and delete sub-projects.',
      'Set the PIC, equipment group, source, category, installation period, and planned dates.',
      'Edit ANY sub-project’s schedule — not just ones you own: draw, submit, edit the plan, and update actuals.',
    ],
  },
  {
    icon: UsersIcon,
    title: 'User Management',
    items: [
      'Create, edit, and delete users.',
      'Set each user’s role (Admin or Staff).',
      'You can’t delete your own account.',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Attendance (full control)',
    items: [
      'Record attendance for anyone — pick any user and edit any day.',
      'Use “Mark today” to bulk-fill attendance for the whole team at once.',
      'Weekend and public-holiday days are limited to the right status options automatically.',
    ],
  },
  {
    icon: ClipboardList,
    title: 'My Tasks — All Tasks view',
    items: [
      'Toggle to the “All Tasks” master list to see every open stage across the whole team, plant-wide.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports (full)',
    items: [
      'Plant-wide analytics with cascading Major project → Stage → PIC filters.',
      'All six reports, including the admin-only Manpower Analytics, Category Analytics, and Activity Log.',
    ],
  },
  {
    icon: SettingsIcon,
    title: 'Settings & system',
    items: [
      'Add and remove public holidays and installation periods.',
      'Review the “Recent activity” audit trail of recent changes.',
    ],
  },
  {
    icon: Bell,
    title: 'Schedule oversight',
    items: [
      'When a PIC amends a plan they already submitted, the schedule overseer (Faris — or all admins if that account isn’t set) gets a notification.',
      'When you edit someone else’s plan, that sub-project’s PIC is notified instead. Whoever makes the change is never notified about their own edit.',
      'Routine “actual” progress updates never generate notifications.',
    ],
  },
];

export default function InformationPage() {
  const { user } = useApp();
  const admin = isAdmin(user);
  const [view, setView] = useState<'admin' | 'staff'>('admin');

  const sections = admin && view === 'admin' ? ADMIN_GUIDE : STAFF_GUIDE;

  const note = !admin
    ? 'Here’s what you can do on the platform.'
    : view === 'admin'
    ? 'These are your admin powers. You can also do everything in the Staff guide.'
    : 'This is exactly what your Staff members see.';

  return (
    <div className="p-6 md:p-10 max-w-content mx-auto">
      <PageHeader
        title="Information"
        subtitle="What you can do on this platform"
        action={
          admin ? (
            <div className="inline-flex rounded-xl border border-border bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  view === 'admin' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Admin Guide
              </button>
              <button
                type="button"
                onClick={() => setView('staff')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  view === 'staff' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Staff Guide
              </button>
            </div>
          ) : undefined
        }
      />

      <p className="text-sm text-text-muted mb-6 -mt-2">{note}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <SectionCard key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: Section }) {
  const Icon = section.icon;
  return (
    <div className="bg-white border border-border rounded-2xl shadow-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
          <Icon size={18} />
        </div>
        <h3 className="text-sm font-semibold text-text-primary">{section.title}</h3>
      </div>
      {section.intro && <p className="text-xs text-text-muted mb-3 leading-relaxed">{section.intro}</p>}
      <ul className="space-y-1.5">
        {section.items.map((item, i) => (
          <li key={i} className="text-[13px] text-text-secondary flex gap-2 leading-relaxed">
            <span className="text-primary mt-[2px] flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
