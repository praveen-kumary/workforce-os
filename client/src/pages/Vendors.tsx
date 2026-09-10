import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, X } from 'lucide-react';
import { procurementApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Vendor } from '../lib/types';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Active' },
  REVIEW: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', label: 'Under Review' },
  INACTIVE: { bg: 'var(--bg-tertiary)', text: 'var(--text-tertiary)', label: 'Inactive' },
};

export function Vendors() {
  const [showModal, setShowModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'Cloud Infrastructure',
    status: 'ACTIVE',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => procurementApi.getVendors(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => procurementApi.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      addToast({ title: 'Vendor created', description: `${newVendor.name} added to approved vendors.` });
      setShowModal(false);
      setNewVendor({ name: '', category: 'Cloud Infrastructure', status: 'ACTIVE' });
    },
  });

  const totalOrders = vendors.reduce((s: number, v: Vendor) => s + (v.purchaseOrders?.length || 0), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendors & Suppliers</h1>
          <p className="page-subtitle">
            {vendors.length} approved corporate vendors · {totalOrders} total purchase orders
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Add Vendor
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <Store size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No vendors registered</h3>
          <p>Add vendor organizations to manage procurement, purchase orders, and software contracts.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Active Purchase Orders</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v: Vendor) => {
                const sc = STATUS_MAP[v.status] || STATUS_MAP.ACTIVE;
                const poCount = v.purchaseOrders?.length || 0;
                return (
                  <tr key={v.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Store size={14} color="var(--text-tertiary)" />
                        </div>
                        <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{v.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{v.category}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{poCount} order{poCount !== 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vendor Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 440 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add Vendor</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Vendor Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Amazon Web Services"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="select"
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Design Tools">Design Tools</option>
                    <option value="Communication">Communication</option>
                    <option value="Dev Tools">Dev Tools</option>
                    <option value="Office Space">Office Space</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newVendor.name || createMutation.isPending}
                  onClick={() => createMutation.mutate(newVendor)}
                >
                  {createMutation.isPending ? 'Saving...' : 'Add Vendor'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Vendors;
