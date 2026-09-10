import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Plus, Users, DollarSign,
  CheckCircle, X,
} from 'lucide-react';
import { projectsApi, crmApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Project, Customer } from '../lib/types';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PLANNING: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', label: 'Planning' },
  ACTIVE: { bg: 'var(--info-bg)', text: 'var(--info-text)', label: 'Active' },
  ON_HOLD: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', label: 'On Hold' },
  COMPLETED: { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Completed' },
};

export function Projects() {
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    customerId: '',
    status: 'ACTIVE',
    budget: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      projectsApi.createProject({
        name: data.name,
        customerId: data.customerId || undefined,
        status: data.status,
        budget: data.budget ? Number(data.budget) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ title: 'Project created', description: `${newProject.name} is now active.` });
      setShowModal(false);
      setNewProject({ name: '', customerId: '', status: 'ACTIVE', budget: '' });
    },
  });

  const filtered = filter === 'ALL' ? projects : projects.filter((p: Project) => p.status === filter);
  const totalBudget = projects.reduce((s: number, p: Project) => s + (Number(p.budget) || 0), 0);
  const activeCount = projects.filter((p: Project) => p.status === 'ACTIVE').length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {projects.length} total projects · {activeCount} active · ${(totalBudget / 1000).toFixed(0)}K total budget
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Active Projects', value: activeCount, icon: Briefcase, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Total Projects', value: projects.length, icon: Users, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Total Allocated Budget', value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Completed Deliverables', value: projects.filter((p: Project) => p.status === 'COMPLETED').length, icon: CheckCircle, color: '#0891b2', bg: '#ecfeff' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} className="kpi-card" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="kpi-card-header">
              <div className="kpi-card-icon" style={{ background: kpi.bg }}>
                <kpi.icon size={18} color={kpi.color} strokeWidth={1.8} />
              </div>
            </div>
            <div className="kpi-card-value">{kpi.value}</div>
            <div className="kpi-card-label">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['ALL', 'ACTIVE', 'PLANNING', 'ON_HOLD', 'COMPLETED'].map((st) => (
          <button
            key={st}
            className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(st)}
          >
            {st === 'ALL' ? 'All Projects' : STATUS_CONFIG[st]?.label || st}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No projects found</h3>
          <p>Create a project to assign tasks, budgets, and track team velocity.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Project
          </button>
        </div>
      ) : (
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filtered.map((proj: Project) => {
            const sc = STATUS_CONFIG[proj.status] || STATUS_CONFIG.ACTIVE;
            const tasksCount = proj.tasks?.length || 0;
            const doneTasks = proj.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
            const progressPct = tasksCount > 0 ? Math.round((doneTasks / tasksCount) * 100) : 0;

            return (
              <motion.div key={proj.id} className="card card-interactive" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                  <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                    {sc.label}
                  </span>
                  {proj.customer && (
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                      {proj.customer.name}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>
                  {proj.name}
                </h3>

                <div className="flex-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  <span>Tasks: {doneTasks}/{tasksCount} completed</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{progressPct}%</span>
                </div>

                <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', borderRadius: 'var(--radius-full)' }} />
                </div>

                <div className="flex-between" style={{ paddingTop: 12, borderTop: '1px solid var(--border-light)', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Budget</span>
                  <span style={{ fontWeight: 750, color: 'var(--text-heading)' }}>
                    {proj.budget ? `$${Number(proj.budget).toLocaleString()}` : 'Uncapped'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 480 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Create New Project</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Project Atlas"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Account</label>
                  <select
                    className="select"
                    value={newProject.customerId}
                    onChange={(e) => setNewProject({ ...newProject, customerId: e.target.value })}
                  >
                    <option value="">Internal / No Client</option>
                    {customers.map((c: Customer) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Budget ($)</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="150000"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="select"
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PLANNING">Planning</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newProject.name || createMutation.isPending}
                  onClick={() => createMutation.mutate(newProject)}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Projects;
