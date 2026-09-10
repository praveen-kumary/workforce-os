import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Plus, DollarSign, Clock, CheckCircle,
  XCircle, X,
} from 'lucide-react';
import { financeApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import { useAuthStore } from '../store/auth.store';
import type { Expense } from '../lib/types';

const STATUS_MAP: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  DRAFT: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', icon: Clock, label: 'Draft' },
  SUBMITTED: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', icon: Clock, label: 'Pending' },
  APPROVED: { bg: 'var(--success-bg)', text: 'var(--success-text)', icon: CheckCircle, label: 'Approved' },
  REJECTED: { bg: 'var(--error-bg)', text: 'var(--error-text)', icon: XCircle, label: 'Rejected' },
  REIMBURSED: { bg: 'var(--info-bg)', text: 'var(--info-text)', icon: DollarSign, label: 'Reimbursed' },
};

const CATEGORIES = ['Travel', 'Software', 'Meals', 'Equipment', 'Office', 'Wellness', 'Training'];

export function Expenses() {
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'Travel',
    description: '',
    amount: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user } = useAuthStore();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => financeApi.getExpenses(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => financeApi.approveExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast({ title: 'Expense approved' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => financeApi.rejectExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast({ title: 'Expense rejected' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) =>
      financeApi.submitExpense({
        employeeId: user?.id,
        category: data.category,
        description: data.description,
        amount: Number(data.amount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      addToast({ title: 'Expense submitted for reimbursement' });
      setShowModal(false);
      setNewExpense({ category: 'Travel', description: '', amount: '' });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to submit expense', description: err.message });
    },
  });

  const filtered = filter === 'ALL' ? expenses : expenses.filter((e: Expense) => e.status === filter);
  const totalAmount = expenses.reduce((s: number, e: Expense) => s + Number(e.amount), 0);
  const pendingAmount = expenses
    .filter((e: Expense) => e.status === 'SUBMITTED' || e.status === 'DRAFT')
    .reduce((s: number, e: Expense) => s + Number(e.amount), 0);
  const approvedAmount = expenses
    .filter((e: Expense) => e.status === 'APPROVED' || e.status === 'REIMBURSED')
    .reduce((s: number, e: Expense) => s + Number(e.amount), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses & Reimbursements</h1>
          <p className="page-subtitle">
            {expenses.length} claims · ${totalAmount.toLocaleString()} total submitted
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Submit Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Pending Approval', value: `$${pendingAmount.toLocaleString()}`, icon: Clock, color: '#d97706', bg: 'var(--warning-bg)' },
          { label: 'Approved Claims', value: `$${approvedAmount.toLocaleString()}`, icon: CheckCircle, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Total Submitted', value: `$${totalAmount.toLocaleString()}`, icon: DollarSign, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Total Claims', value: expenses.length, icon: Receipt, color: '#7c3aed', bg: '#f5f3ff' },
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
        {['ALL', 'SUBMITTED', 'APPROVED', 'REIMBURSED', 'REJECTED'].map((st) => (
          <button
            key={st}
            className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(st)}
          >
            {st === 'ALL' ? 'All Claims' : STATUS_MAP[st]?.label || st}
            {st === 'SUBMITTED' && (
              <span style={{ marginLeft: 4, opacity: 0.8 }}>
                ({expenses.filter((e: any) => e.status === 'SUBMITTED').length})
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
          <Receipt size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No expense claims found</h3>
          <p>Submit travel, software, or equipment expenses for approval.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: Expense) => {
                const sc = STATUS_MAP[e.status] || STATUS_MAP.SUBMITTED;
                const isPending = e.status === 'SUBMITTED' || e.status === 'DRAFT';

                return (
                  <tr key={e.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="avatar avatar-sm"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                        >
                          {e.employee?.firstName?.[0] || 'U'}
                          {e.employee?.lastName?.[0] || 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {e.employee?.firstName} {e.employee?.lastName}
                          </div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                            {e.employee?.department || 'Department'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{e.category}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', maxWidth: 280 }}>
                        {e.description}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(e.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        <sc.icon size={10} /> {sc.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isPending && (
                        <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--success)' }}
                            title="Approve"
                            onClick={() => approveMutation.mutate(e.id)}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--error)' }}
                            title="Reject"
                            onClick={() => rejectMutation.mutate(e.id)}
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

      {/* Submit Expense Modal */}
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
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Submit Expense Claim</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="select"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input
                    className="input"
                    placeholder="e.g. Flight ticket to SF Tech Conference"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($) *</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="250.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newExpense.description || !newExpense.amount || submitMutation.isPending}
                  onClick={() => submitMutation.mutate(newExpense)}
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Expenses;
