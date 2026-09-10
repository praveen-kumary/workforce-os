import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Circle, CheckCircle2, Clock,
  AlertCircle, X,
} from 'lucide-react';
import { projectsApi, coreApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Task, Project, Employee } from '../lib/types';

const STATUS_ICONS: Record<string, { label: string; color: string; icon: any }> = {
  TODO: { label: 'To Do', color: 'var(--text-quaternary)', icon: Circle },
  IN_PROGRESS: { label: 'In Progress', color: 'var(--accent)', icon: Clock },
  REVIEW: { label: 'In Review', color: 'var(--warning)', icon: AlertCircle },
  DONE: { label: 'Done', color: 'var(--success)', icon: CheckCircle2 },
};

export function Tasks() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'TODO',
    assigneeId: '',
    dueDate: '2026-09-15',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', filterStatus],
    queryFn: () => projectsApi.getTasks({ status: filterStatus }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees-short'],
    queryFn: () => coreApi.getEmployees({ pageSize: 50 }),
  });
  const employees = employeesResponse?.data || [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      projectsApi.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ title: 'Task updated' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      projectsApi.createTask({
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        status: data.status,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ title: 'Task created', description: `${newTask.title} added.` });
      setShowModal(false);
      setNewTask({
        title: '',
        description: '',
        projectId: projects[0]?.id || '',
        status: 'TODO',
        assigneeId: '',
        dueDate: '2026-09-15',
      });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to create task', description: err.message });
    },
  });

  const doneCount = tasks.filter((t: Task) => t.status === 'DONE').length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks & Deliverables</h1>
          <p className="page-subtitle">
            {tasks.length} total tasks · {doneCount} completed · {tasks.length - doneCount} active
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (projects.length > 0 && !newTask.projectId) {
              setNewTask({ ...newTask, projectId: projects[0].id });
            }
            setShowModal(true);
          }}
        >
          <Plus size={15} /> New Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((st) => (
          <button
            key={st}
            className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(st)}
          >
            {st === 'ALL' ? 'All Tasks' : STATUS_ICONS[st]?.label || st}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No tasks found</h3>
          <p>Create a task to assign work and track delivery across projects.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: Task) => {
                const isDone = task.status === 'DONE';

                return (
                  <tr key={task.id}>
                    <td>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          color: isDone ? 'var(--success)' : 'var(--text-quaternary)',
                          padding: 0,
                        }}
                        onClick={() =>
                          statusMutation.mutate({
                            id: task.id,
                            status: isDone ? 'TODO' : 'DONE',
                          })
                        }
                      >
                        {isDone ? (
                          <CheckCircle2 size={18} color="var(--success)" />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 550 }}>
                        {task.project?.name || 'Project'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="input input-sm"
                        value={task.status}
                        onChange={(e) => statusMutation.mutate({ id: task.id, status: e.target.value })}
                        style={{ fontSize: '0.75rem', height: 26, width: 120 }}
                      >
                        {Object.entries(STATUS_ICONS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Task Modal */}
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
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Create New Task</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    className="input"
                    placeholder="e.g. Design multi-cloud onboarding UI"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project *</label>
                  <select
                    className="select"
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                  >
                    {projects.map((p: Project) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select
                      className="select"
                      value={newTask.assigneeId}
                      onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp: Employee) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      className="input"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newTask.title || !newTask.projectId || createMutation.isPending}
                  onClick={() => createMutation.mutate(newTask)}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Tasks;
