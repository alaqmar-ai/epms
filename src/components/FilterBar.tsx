'use client';

import { Search } from 'lucide-react';

interface FilterBarProps {
  groups: string[];
  pics: string[];
  statuses?: string[];
  selectedGroup: string;
  selectedPic: string;
  selectedStatus?: string;
  searchQuery: string;
  onGroupChange: (v: string) => void;
  onPicChange: (v: string) => void;
  onStatusChange?: (v: string) => void;
  onSearchChange: (v: string) => void;
}

export default function FilterBar({
  groups, pics, statuses, selectedGroup, selectedPic, selectedStatus, searchQuery,
  onGroupChange, onPicChange, onStatusChange, onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-5">
      <select value={selectedGroup} onChange={(e) => onGroupChange(e.target.value)} className="select-styled">
        <option value="">All Groups</option>
        {groups.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <select value={selectedPic} onChange={(e) => onPicChange(e.target.value)} className="select-styled">
        <option value="">All PICs</option>
        {pics.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {statuses && onStatusChange && (
        <select value={selectedStatus || ''} onChange={(e) => onStatusChange(e.target.value)} className="select-styled">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, code, PIC..."
          className="input-styled w-full pl-9 pr-3"
        />
      </div>
    </div>
  );
}
