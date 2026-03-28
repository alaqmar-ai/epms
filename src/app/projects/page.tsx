'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import FilterBar from '@/components/FilterBar';
import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import ProjectModal from '@/components/ProjectModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/LoadingSpinner';
import { getProjectStatus, getProjectProgress, getCurrentStage } from '@/lib/status';
import { createProject, updateProject, deleteProject } from '@/lib/api';
import { EQUIPMENT_GROUPS } from '@/lib/constants';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const { projects, projectsLoading, reloadProjects, addToast } = useApp();
  const searchParams = useSearchParams();

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPic, setSelectedPic] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditProject(null);
      setModalOpen(true);
    }
  }, [searchParams]);

  const pics = useMemo(() => Array.from(new Set(projects.map((p) => p.pic).filter(Boolean))), [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (selectedGroup && p.group !== selectedGroup) return false;
      if (selectedPic && p.pic !== selectedPic) return false;
      if (selectedStatus) {
        const status = getProjectStatus(p);
        if (status !== selectedStatus) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q) && !p.pic.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [projects, selectedGroup, selectedPic, selectedStatus, searchQuery]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (data: any) => {
    if (data.id) {
      await updateProject({ ...data, createdAt: '', updatedAt: '' } as Project);
      addToast('success', 'Project updated successfully');
    } else {
      await createProject(data);
      addToast('success', 'Project created successfully');
    }
    await reloadProjects();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      addToast('success', `Deleted "${deleteTarget.name}"`);
      await reloadProjects();
    } catch {
      addToast('error', 'Failed to delete project');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-content mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Projects</h1>
        <button
          onClick={() => { setEditProject(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer shadow-lg shadow-blue-900/20"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        groups={EQUIPMENT_GROUPS}
        pics={pics}
        statuses={['COMPLETED', 'IN PROGRESS', 'DELAY', 'NOT STARTED']}
        selectedGroup={selectedGroup}
        selectedPic={selectedPic}
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        onGroupChange={setSelectedGroup}
        onPicChange={setSelectedPic}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearchQuery}
      />

      {/* Table */}
      {projectsLoading ? (
        <TableSkeleton rows={5} cols={9} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={40} className="mx-auto text-text-muted/50 mb-3" />
          <p className="text-sm text-text-muted">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => { setEditProject(null); setModalOpen(true); }}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="data-table overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[120px]">Code</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider">Project Name</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[90px]">PIC</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[100px]">Group</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[110px]">Source</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[140px]">Stage</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[120px]">Status</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[130px]">Progress</th>
                <th className="px-4 py-3 text-[11px] text-text-muted font-medium uppercase tracking-wider w-[80px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = getProjectStatus(p);
                const progress = getProjectProgress(p);
                const stage = getCurrentStage(p);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{p.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{p.name}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{p.pic}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{p.group}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{p.source}</td>
                    <td className="px-4 py-3 text-[13px] text-text-muted">{stage}</td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3"><ProgressBar value={progress} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => { setEditProject(p); setModalOpen(true); }}
                          className="p-2 text-text-muted hover:text-blue-400 transition-colors cursor-pointer rounded-md hover:bg-white/[0.04]"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-2 text-text-muted hover:text-red-400 transition-colors cursor-pointer rounded-md hover:bg-white/[0.04]"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ProjectModal
        open={modalOpen}
        project={editProject}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.name || ''}?`}
        message="This will permanently remove the project and all its stage data."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
