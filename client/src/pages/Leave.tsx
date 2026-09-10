import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Plus, Clock,
  CheckCircle, XCircle, X,
} from 'lucide-react';
import { hrApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import { useAuthStore } from '../store/auth.store';
import type { LeaveRequest } from '../lib/types';

const LEAVE_TYPES = ['Annual', 'Sick', 'Personal', 'Parental', 'Bereavement', 'Unpaid'];

const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  PENDING: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', icon: Clock, label: 'Pending' },
  APPROVED: { bg: 'var(--success-bg)', text: 'var(--success-text)', icon: CheckCircle, label: 'Approved' },
  REJECTED: { bg: 'var(--error-bg)', text: 'var(--error-text)', icon: XCircle, label: 'Rejected' },
};

export function Leave() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [newLeave, setNewLeave] = useState({
    leaveType: 'Annual',
    startDate: '2026-09-10',
    endDate: '2026-09-14',
    daysCount: 3,
    notes: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user } = useAuthStore();

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => hrApi.getLeaves(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => hrApi.approveLeave(id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast({ title: 'Leave request approved' });
    },
  });

  const denyMutation = useMutation({
    mutationFn: (id: string) => hrApi.denyLeave(id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast({ title: 'Leave request rejected' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) =>
      hrApi.submitLeave({
        employeeId: user?.id,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        daysCount: Number(data.daysCount),
        notes: data.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      addToast({ title: 'Leave application submitted' });
      setShowModal(false);
      setNewLeave({
        leaveType: 'Annual',
        startDate: '2026-09-10',
        endDate: '2026-09-14',
        daysCount: 3,
        notes: '',
      });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to submit leave', description: err.message });
    },
  });

  const filtered = filter === 'ALL' ? leaves : leaves.filter((r: LeaveRequest) => r.status === filter);

  // Dynamic balances
  const balances = [
    { type: 'Annual Leave', total: 20, used: 5, pending: leaves.filter((l: any) => l.status === 'PENDING' && l.leaveType === 'Annual').length, color: '#2563eb' },
    { type: 'Sick Leave', total: 10, used: 2, pending: leaves.filter((l: any) => l.status === 'PENDING' && l.leaveType === 'Sick').length, color: '#16a34a' },
    { type: 'Personal Days', total: 5, used: 1, pending: 0, color: '#7c3aed' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave & Time Off</h1>
          <p className="page-subtitle">
            {leaves.length} total leave requests · {leaves.filter((l: any) => l.status === 'PENDING').length} pending review
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Apply for Leave
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {balances.map((b) => {
          const remaining = b.total - b.used - b.pending;
          const pct = ((b.used + b.pending) / b.total) * 100;
          return (
            <motion.div key={b.type} className="card" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)' }}>{b.type}</span>
                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 650, color: b.color }}>{remaining} days left</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
                <span>Total: {b.total}</span>
                <span>Used: {b.used}</span>
                {b.pending > 0 && <span>Pending: {b.pending}</span>}
              </div>
              <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: b.color, borderRadius: 'var(--radius-full)' }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(st)}
          >
            {st === 'ALL' ? 'All Requests' : statusConfig[st]?.label || st}
            {st === 'PENDING' && (
              <span style={{ marginLeft: 4, opacity: 0.8 }}>
                ({leaves.filter((l: any) => l.status === 'PENDING').length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No leave requests found</h3>
          <p>Submit a request to take time off or view team leave records.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Dates</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: LeaveRequest) => {
                const sc = statusConfig[r.status] || statusConfig.PENDING;
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="avatar avatar-sm"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                        >
                          {r.employee?.firstName?.[0]}
                          {r.employee?.lastName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {r.employee?.firstName} {r.employee?.lastName}
                          </div>
                          {r.notes && (
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>
                              {r.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{r.leaveType}</td>
                    <td style={{ fontWeight: 600 }}>{Number(r.daysCount)} day{Number(r.daysCount) > 1 ? 's' : ''}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                      {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        <sc.icon size={10} /> {sc.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {r.status === 'PENDING' && (
                        <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--success)' }}
                            title="Approve"
                            onClick={() => approveMutation.mutate(r.id)}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--error)' }}
                            title="Deny"
                            onClick={() => denyMutation.mutate(r.id)}
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Leave Modal */}
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
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Apply for Leave</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select
                    className="select"
                    value={newLeave.leaveType}
                    onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value })}
                  >
                    {LEAVE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="input"
                      value={newLeave.startDate}
                      onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="input"
                      value={newLeave.endDate}
                      onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Days Count</label>
                  <input
                    type="number"
                    className="input"
                    value={newLeave.daysCount}
                    onChange={(e) => setNewLeave({ ...newLeave, daysCount: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <textarea
                    className="textarea"
                    placeholder="Describe the reason for your time off..."
                    rows={3}
                    value={newLeave.notes}
                    onChange={(e) => setNewLeave({ ...newLeave, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={submitMutation.isPending}
                  onClick={() => submitMutation.mutate(newLeave)}
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Leave;
