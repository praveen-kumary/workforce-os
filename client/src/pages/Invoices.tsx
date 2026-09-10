import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Clock, CheckCircle, XCircle,
  Building2, TrendingUp, X,
} from 'lucide-react';
import { procurementApi, crmApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Invoice, Customer } from '../lib/types';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', label: 'Draft' },
  SENT: { bg: 'var(--info-bg)', text: 'var(--info-text)', label: 'Sent' },
  PAID: { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Paid' },
  OVERDUE: { bg: 'var(--error-bg)', text: 'var(--error-text)', label: 'Overdue' },
  VOID: { bg: 'var(--bg-tertiary)', text: 'var(--text-quaternary)', label: 'Void' },
};

export function Invoices() {
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customerId: '',
    amount: '',
    status: 'SENT',
    dueDate: '2026-09-30',
    itemDescription: 'Unified Workforce Platform Enterprise Subscription',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => procurementApi.getInvoices(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      procurementApi.updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addToast({ title: 'Invoice status updated' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      procurementApi.createInvoice({
        customerId: data.customerId,
        amount: Number(data.amount),
        status: data.status,
        dueDate: data.dueDate,
        items: [
          {
            description: data.itemDescription,
            quantity: 1,
            unitPrice: Number(data.amount),
          },
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addToast({ title: 'Invoice created successfully' });
      setShowModal(false);
      setNewInvoice({
        customerId: '',
        amount: '',
        status: 'SENT',
        dueDate: '2026-09-30',
        itemDescription: 'Unified Workforce Platform Enterprise Subscription',
      });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to create invoice', description: err.message });
    },
  });

  const filtered = filter === 'ALL' ? invoices : invoices.filter((i: Invoice) => i.status === filter);
  const totalOutstanding = invoices
    .filter((i: Invoice) => i.status === 'SENT' || i.status === 'OVERDUE')
    .reduce((s: number, i: Invoice) => s + Number(i.amount), 0);
  const totalPaid = invoices
    .filter((i: Invoice) => i.status === 'PAID')
    .reduce((s: number, i: Invoice) => s + Number(i.amount), 0);
  const totalOverdue = invoices
    .filter((i: Invoice) => i.status === 'OVERDUE')
    .reduce((s: number, i: Invoice) => s + Number(i.amount), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">
            {invoices.length} invoices · ${(totalOutstanding / 1000).toFixed(0)}K total outstanding
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              if (customers.length > 0 && !newInvoice.customerId) {
                setNewInvoice({ ...newInvoice, customerId: customers[0].id });
              }
              setShowModal(true);
            }}
          >
            <Plus size={15} /> Create Invoice
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Outstanding Balance', value: `$${(totalOutstanding / 1000).toFixed(0)}K`, icon: Clock, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Collected Revenue', value: `$${(totalPaid / 1000).toFixed(0)}K`, icon: CheckCircle, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Overdue Amount', value: `$${(totalOverdue / 1000).toFixed(0)}K`, icon: XCircle, color: '#dc2626', bg: 'var(--error-bg)' },
          { label: 'Total Invoices', value: invoices.length, icon: TrendingUp, color: '#7c3aed', bg: '#f5f3ff' },
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
        {['ALL', 'SENT', 'PAID', 'OVERDUE', 'DRAFT'].map((st) => (
          <button
            key={st}
            className={`btn btn-sm ${filter === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(st)}
          >
            {st === 'ALL' ? 'All Invoices' : STATUS_MAP[st]?.label || st}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No invoices found</h3>
          <p>Generate customer invoices with automated line item breakdowns.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv: Invoice) => {
                return (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>
                        {inv.invoiceNum}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 size={14} color="var(--text-tertiary)" />
                        <span style={{ fontWeight: 600 }}>{inv.customer?.name || 'Account'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(inv.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <select
                        className="input input-sm"
                        value={inv.status}
                        onChange={(e) => statusMutation.mutate({ id: inv.id, status: e.target.value })}
                        style={{ fontSize: '0.75rem', height: 26, width: 110 }}
                      >
                        {Object.entries(STATUS_MAP).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Invoice Modal */}
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
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Create Invoice</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer Account *</label>
                  <select
                    className="select"
                    value={newInvoice.customerId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                  >
                    {customers.map((c: Customer) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Amount ($) *</label>
                    <input
                      className="input"
                      type="number"
                      placeholder="25000"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input
                      className="input"
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Line Item Description</label>
                  <input
                    className="input"
                    value={newInvoice.itemDescription}
                    onChange={(e) => setNewInvoice({ ...newInvoice, itemDescription: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newInvoice.customerId || !newInvoice.amount || createMutation.isPending}
                  onClick={() => createMutation.mutate(newInvoice)}
                >
                  {createMutation.isPending ? 'Generating...' : 'Create Invoice'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Invoices;
