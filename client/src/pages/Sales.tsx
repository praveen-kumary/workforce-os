import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, DollarSign, Target, Plus, Building2, X, CheckCircle2,
} from 'lucide-react';
import { crmApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Deal, Customer } from '../lib/types';

const STAGES: Array<{ id: Deal['stage']; label: string; color: string }> = [
  { id: 'NEW', label: 'New', color: '#6366f1' },
  { id: 'QUALIFIED', label: 'Qualified', color: '#2563eb' },
  { id: 'PROPOSAL', label: 'Proposal', color: '#7c3aed' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: '#d97706' },
  { id: 'WON', label: 'Won', color: '#16a34a' },
  { id: 'LOST', label: 'Lost', color: '#dc2626' },
];

export function Sales() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    customerId: '',
    amount: '',
    stage: 'NEW' as Deal['stage'],
    probability: 20,
    closeDate: '2026-09-30',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: pipelineData } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => crmApi.getPipeline(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const deals = pipelineData?.deals || [];

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      crmApi.updateDealStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      addToast({ title: 'Deal stage updated' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      crmApi.createDeal({
        name: data.name,
        customerId: data.customerId,
        amount: Number(data.amount),
        stage: data.stage,
        probability: Number(data.probability),
        closeDate: data.closeDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast({ title: 'Deal created', description: `${newDeal.name} added to pipeline.` });
      setShowModal(false);
      setNewDeal({
        name: '',
        customerId: '',
        amount: '',
        stage: 'NEW',
        probability: 20,
        closeDate: '2026-09-30',
      });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to create deal', description: err.message });
    },
  });

  const totalPipeline = pipelineData?.totalPipeline || 0;
  const weightedPipeline = pipelineData?.weightedPipeline || 0;
  const wonThisMonth = pipelineData?.wonThisMonth || 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Pipeline</h1>
          <p className="page-subtitle">
            {deals.length} active deals · ${(totalPipeline / 1000).toFixed(0)}K total pipeline · ${(weightedPipeline / 1000).toFixed(0)}K weighted
          </p>
        </div>
        <div className="page-actions">
          <div
            className="flex items-center gap-1"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: 2,
              border: '1px solid var(--border)',
            }}
          >
            {(['kanban', 'table'] as const).map((v) => (
              <button
                key={v}
                className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setView(v)}
                style={{ textTransform: 'capitalize' }}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> New Deal
          </button>
        </div>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          {
            label: 'Total Pipeline',
            value: `$${(totalPipeline / 1000).toFixed(0)}K`,
            icon: DollarSign,
            color: '#2563eb',
            bg: 'var(--info-bg)',
          },
          {
            label: 'Weighted Forecast',
            value: `$${(weightedPipeline / 1000).toFixed(0)}K`,
            icon: Target,
            color: '#7c3aed',
            bg: '#f5f3ff',
          },
          {
            label: 'Won Revenue',
            value: `$${(wonThisMonth / 1000).toFixed(0)}K`,
            icon: CheckCircle2,
            color: '#16a34a',
            bg: 'var(--success-bg)',
          },
          {
            label: 'Active Deals',
            value: deals.filter((d: Deal) => d.stage !== 'WON' && d.stage !== 'LOST').length,
            icon: TrendingUp,
            color: '#d97706',
            bg: 'var(--warning-bg)',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="kpi-card"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
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

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${STAGES.length}, minmax(260px, 1fr))`,
            gap: 'var(--space-3)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-4)',
          }}
        >
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d: Deal) => d.stage === stage.id);
            const stageSum = stageDeals.reduce((s: number, d: Deal) => s + Number(d.amount), 0);

            return (
              <div
                key={stage.id}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-light)',
                  padding: 'var(--space-3)',
                  minHeight: 450,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="flex-between" style={{ marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stage.label}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 700,
                        background: 'var(--bg-primary)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-tertiary)' }}>
                    ${(stageSum / 1000).toFixed(0)}K
                  </span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {stageDeals.map((deal: Deal) => (
                    <motion.div
                      key={deal.id}
                      className="card card-interactive"
                      style={{ padding: 'var(--space-3)', cursor: 'grab' }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {deal.name}
                      </div>
                      <div className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                        <Building2 size={12} />
                        <span>{deal.customer?.name || 'Account'}</span>
                      </div>

                      <div className="flex-between" style={{ marginTop: 'var(--space-2)', paddingTop: 6, borderTop: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-heading)' }}>
                          ${Number(deal.amount).toLocaleString()}
                        </span>
                        <select
                          className="input input-sm"
                          value={deal.stage}
                          onChange={(e) => stageMutation.mutate({ id: deal.id, stage: e.target.value })}
                          style={{ fontSize: '0.7rem', padding: '2px 6px', height: 24 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Deal Name</th>
                <th>Company</th>
                <th>Value</th>
                <th>Probability</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal: Deal) => {
                const stageObj = STAGES.find((s) => s.id === deal.stage) || STAGES[0];
                return (
                  <tr key={deal.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{deal.name}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} color="var(--text-tertiary)" />
                        <span>{deal.customer?.name || 'Account'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(deal.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{deal.probability}%</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${stageObj.color}15`, color: stageObj.color }}>
                        {stageObj.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Deal Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 500 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Create New Deal</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Deal Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Acme Corp — Enterprise Migration"
                    value={newDeal.name}
                    onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Associated Customer Account *</label>
                  <select
                    className="select"
                    value={newDeal.customerId}
                    onChange={(e) => setNewDeal({ ...newDeal, customerId: e.target.value })}
                  >
                    <option value="">Select a customer...</option>
                    {customers.map((c: Customer) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Deal Value ($) *</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="50000"
                      value={newDeal.amount}
                      onChange={(e) => setNewDeal({ ...newDeal, amount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Stage</label>
                    <select
                      className="select"
                      value={newDeal.stage}
                      onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value as any })}
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
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
                  disabled={!newDeal.name || !newDeal.customerId || !newDeal.amount || createMutation.isPending}
                  onClick={() => createMutation.mutate(newDeal)}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Sales;
