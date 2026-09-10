import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, CalendarDays, Receipt, ShoppingCart,
  Key, XCircle,
} from 'lucide-react';
import { approvalsApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { UnifiedApprovalItem } from '../lib/types';

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  leave: { icon: CalendarDays, color: '#2563eb', bg: 'var(--info-bg)', label: 'Leave' },
  expense: { icon: Receipt, color: '#d97706', bg: 'var(--warning-bg)', label: 'Expense' },
  purchase: { icon: ShoppingCart, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', label: 'Purchase Order' },
  access: { icon: Key, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', label: 'Access Request' },
};

export function Approvals() {
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => approvalsApi.getApprovals(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      approvalsApi.approveItem(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      addToast({ title: 'Item approved successfully' });
    },
    onError: (err: any) => {
      addToast({ title: 'Approval failed', description: err.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      approvalsApi.rejectItem(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      addToast({ title: 'Item rejected' });
    },
    onError: (err: any) => {
      addToast({ title: 'Action failed', description: err.message });
    },
  });

  const filtered = filter === 'all' ? approvals : approvals.filter((a: UnifiedApprovalItem) => a.type === filter);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Unified Approval Center</h1>
          <p className="page-subtitle">
            {approvals.length} pending items across HR, Finance, and Procurement requiring authorization
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Items ({approvals.length})
        </button>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
          const count = approvals.filter((a: UnifiedApprovalItem) => a.type === key).length;
          return (
            <button
              key={key}
              className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(key)}
            >
              <cfg.icon size={13} /> {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={40} color="var(--success)" style={{ marginBottom: 12 }} />
          <h3>All caught up!</h3>
          <p>You have zero pending approvals waiting for review.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Request Title</th>
                <th>Requester</th>
                <th>Amount / Details</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: UnifiedApprovalItem) => {
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.leave;
                return (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>
                      <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                        <cfg.icon size={12} /> {cfg.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{item.details}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.requester}</div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{item.dept}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {item.amount || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {new Date(item.submitted).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate({ type: item.type, id: item.id })}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: 'var(--error)' }}
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate({ type: item.type, id: item.id })}
                        >
                          <XCircle size={13} /> Reject
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
    </div>
  );
}
export default Approvals;
