import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Circle, CheckCircle2, CheckCircle,
} from 'lucide-react';
import { projectsApi, approvalsApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Task, UnifiedApprovalItem } from '../lib/types';

export function MyWork() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'my-work'],
    queryFn: () => projectsApi.getTasks(),
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => approvalsApi.getApprovals(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      projectsApi.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast({ title: 'Task updated' });
    },
  });

  const myTasks = tasks.slice(0, 8);
  const pendingTasks = myTasks.filter((t: Task) => t.status !== 'DONE');

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Workspace</h1>
          <p className="page-subtitle">
            Personal overview of your pending tasks, approvals, and upcoming schedule
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--space-5)' }}>
        {/* Assigned Tasks */}
        <div className="card card-flush">
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Assigned Tasks ({pendingTasks.length})
            </h3>
          </div>
          <div style={{ padding: 'var(--space-2)' }}>
            {myTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <CheckCircle2 size={32} color="var(--success)" />
                <p style={{ marginTop: 8 }}>No assigned tasks</p>
              </div>
            ) : (
              myTasks.map((task: Task) => {
                const isDone = task.status === 'DONE';
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
                        <Circle size={18} color="var(--text-quaternary)" />
                      )}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 550,
                          color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {task.project?.name || 'Project'} · Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Soon'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="card card-flush">
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Pending Authorization ({approvals.length})
            </h3>
          </div>
          <div style={{ padding: 'var(--space-2)' }}>
            {approvals.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <CheckCircle size={32} color="var(--success)" />
                <p style={{ marginTop: 8 }}>Zero pending approvals</p>
              </div>
            ) : (
              approvals.slice(0, 5).map((app: UnifiedApprovalItem) => (
                <div
                  key={`${app.type}-${app.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {app.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {app.requester} ({app.dept})
                    </div>
                  </div>
                  {app.amount && (
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{app.amount}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default MyWork;
