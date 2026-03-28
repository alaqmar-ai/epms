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

  // Auto-open modal if ?new=1
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
    <div className="p-4 md:p-6 max-w-content mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-text-primary">Projects</h1>
        <button
          onClick={() => { setEditProject(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-toyota hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors cursor-pointer"
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
        <div className="text-center py-16">
          <FolderOpen size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => { setEditProject(null); setModalOpen(true); }}
              className="mt-3 text-sm text-eng hover:underline cursor-pointer"
            >
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-elevated">
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[120px]">Code</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider">Project Name</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[100px]">PIC</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[100px]">Group</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[110px]">Source</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[140px]">Stage</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[110px]">Status</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[120px]">Progress</th>
                <th className="px-3 py-2.5 text-[10px] text-text-muted uppercase tracking-wider w-[80px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = getProjectStatus(p);
                const progress = getProjectProgress(p);
                const stage = getCurrentStage(p);
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-surface-hover transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-eng">{p.code}</td>
                    <td className="px-3 py-2 text-sm font-medium text-text-primary">{p.name}</td>
                    <td className="px-3 py-2 text-xs text-text-secondary">{p.pic}</td>
                    <td className="px-3 py-2 text-xs text-text-secondary">{p.group}</td>
                    <td className="px-3 py-2 text-xs text-text-secondary">{p.source}</td>
                    <td className="px-3 py-2 text-xs text-text-muted">{stage}</td>
                    <td className="px-3 py-2"><StatusBadge status={status} /></td>
                    <td className="px-3 py-2"><ProgressBar value={progress} /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditProject(p); setModalOpen(true); }}
                          className="p-1.5 text-text-muted hover:text-eng transition-colors cursor-pointer rounded hover:bg-card"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-text-muted hover:text-danger transition-colors cursor-pointer rounded hover:bg-card"
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
