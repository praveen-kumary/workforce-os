import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Clock, CheckCircle, XCircle,
  DollarSign, Store, X,
} from 'lucide-react';
import { procurementApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { PurchaseOrder, Vendor } from '../lib/types';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_APPROVAL: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', label: 'Pending' },
  APPROVED: { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Approved' },
  SENT: { bg: 'var(--info-bg)', text: 'var(--info-text)', label: 'Sent' },
  RECEIVED: { bg: 'var(--workflow-subtle)', text: 'var(--workflow-text)', label: 'Received' },
  REJECTED: { bg: 'var(--error-bg)', text: 'var(--error-text)', label: 'Rejected' },
};

export function Procurement() {
  const [showModal, setShowModal] = useState(false);
  const [newPO, setNewPO] = useState({
    vendorId: '',
    amount: '',
    requesterId: 'Executive',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => procurementApi.getPurchaseOrders(),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => procurementApi.getVendors(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => procurementApi.approvePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast({ title: 'Purchase order approved' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => procurementApi.rejectPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      addToast({ title: 'Purchase order rejected' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      procurementApi.createPurchaseOrder({
        vendorId: data.vendorId,
        amount: Number(data.amount),
        requesterId: data.requesterId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      addToast({ title: 'Purchase Order created' });
      setShowModal(false);
      setNewPO({ vendorId: '', amount: '', requesterId: 'Executive' });
    },
  });

  const totalSpend = purchaseOrders.reduce((s: number, p: PurchaseOrder) => s + Number(p.amount), 0);
  const pendingSpend = purchaseOrders
    .filter((p: PurchaseOrder) => p.status === 'PENDING_APPROVAL')
    .reduce((s: number, p: PurchaseOrder) => s + Number(p.amount), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement & POs</h1>
          <p className="page-subtitle">
            {purchaseOrders.length} purchase orders · ${(totalSpend / 1000).toFixed(0)}K total commitment
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (vendors.length > 0 && !newPO.vendorId) {
              setNewPO({ ...newPO, vendorId: vendors[0].id });
            }
            setShowModal(true);
          }}
        >
          <Plus size={15} /> New Purchase Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Pending Approval', value: `$${(pendingSpend / 1000).toFixed(0)}K`, icon: Clock, color: '#d97706', bg: 'var(--warning-bg)' },
          { label: 'Approved Orders', value: purchaseOrders.filter((p: PurchaseOrder) => p.status === 'APPROVED').length, icon: CheckCircle, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Total Orders', value: purchaseOrders.length, icon: ShoppingCart, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Total Spend', value: `$${(totalSpend / 1000).toFixed(0)}K`, icon: DollarSign, color: '#7c3aed', bg: '#f5f3ff' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} className="kpi-card" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="kpi-card-header">
              <div className="kpi-card-icon" style={{ background: kpi.bg }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
            </div>
            <div className="kpi-card-value">{kpi.value}</div>
            <div className="kpi-card-label">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : purchaseOrders.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No purchase orders found</h3>
          <p>Create purchase orders to authorize corporate software, hardware, and services.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po: PurchaseOrder) => {
                const sc = STATUS_MAP[po.status] || STATUS_MAP.PENDING_APPROVAL;
                return (
                  <tr key={po.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>
                        {po.poNumber}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Store size={14} color="var(--text-tertiary)" />
                        <span style={{ fontWeight: 600 }}>{po.vendor?.name || 'Vendor'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(po.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {po.status === 'PENDING_APPROVAL' && (
                        <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--success)' }}
                            title="Approve"
                            onClick={() => approveMutation.mutate(po.id)}
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--error)' }}
                            title="Reject"
                            onClick={() => rejectMutation.mutate(po.id)}
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

      {/* New Purchase Order Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 460 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>New Purchase Order</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Vendor *</label>
                  <select
                    className="select"
                    value={newPO.vendorId}
                    onChange={(e) => setNewPO({ ...newPO, vendorId: e.target.value })}
                  >
                    {vendors.map((v: Vendor) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">PO Amount ($) *</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="12000"
                    value={newPO.amount}
                    onChange={(e) => setNewPO({ ...newPO, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newPO.vendorId || !newPO.amount || createMutation.isPending}
                  onClick={() => createMutation.mutate(newPO)}
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit PO'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Procurement;
