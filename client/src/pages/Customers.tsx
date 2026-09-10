import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Search, Plus, X,
} from 'lucide-react';
import { crmApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Customer } from '../lib/types';

export function Customers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    website: '',
    industry: 'Enterprise SaaS',
    status: 'ACTIVE',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
    contactTitle: 'VP of Procurement',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      crmApi.createCustomer({
        name: data.name,
        website: data.website,
        industry: data.industry,
        status: data.status,
        contact: data.contactFirstName
          ? {
              firstName: data.contactFirstName,
              lastName: data.contactLastName || '',
              email: data.contactEmail || '',
              phone: data.contactPhone || '',
              roleTitle: data.contactTitle || '',
            }
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      addToast({ title: 'Customer added', description: `${newCustomer.name} has been added to accounts.` });
      setShowModal(false);
      setNewCustomer({
        name: '',
        website: '',
        industry: 'Enterprise SaaS',
        status: 'ACTIVE',
        contactFirstName: '',
        contactLastName: '',
        contactEmail: '',
        contactPhone: '',
        contactTitle: 'VP of Procurement',
      });
    },
    onError: (err: any) => {
      addToast({ title: 'Failed to add customer', description: err.message });
    },
  });

  const filtered = customers.filter((c: Customer) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = customers.reduce((sum, c) => {
    const dealsTotal = c.deals?.reduce((dSum, d) => dSum + Number(d.amount), 0) || 0;
    return sum + dealsTotal;
  }, 0);

  const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
    LEAD: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
    CHURNED: { bg: 'var(--bg-tertiary)', text: 'var(--text-tertiary)' },
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers & Accounts</h1>
          <p className="page-subtitle">
            {customers.length} total corporate accounts · ${(totalValue / 1000).toFixed(0)}K associated contract value
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
          />
          <input
            className="input"
            placeholder="Search customers by name or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          className="input"
          style={{ width: 150 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="LEAD">Lead</option>
          <option value="CHURNED">Churned</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No customers found</h3>
          <p>Create your first customer account to begin managing deals and contracts.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Customer
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Primary Contact</th>
                <th>Active Deals</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: Customer) => {
                const primaryContact = c.contacts?.find((ct) => ct.isPrimary) || c.contacts?.[0];
                const activeDeals = c.deals || [];
                const sc = statusColors[c.status] || { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)' };

                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                          }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{c.name}</div>
                          {c.website && (
                            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>
                              {c.website.replace('https://', '')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{c.industry || 'Enterprise'}</span>
                    </td>
                    <td>
                      {primaryContact ? (
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {primaryContact.firstName} {primaryContact.lastName}
                          </div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                            {primaryContact.roleTitle || primaryContact.email}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-quaternary)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
                        {activeDeals.length} deal{activeDeals.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 520 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add New Customer</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Acme Corporation"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      className="input"
                      placeholder="https://example.com"
                      value={newCustomer.website}
                      onChange={(e) => setNewCustomer({ ...newCustomer, website: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <select
                      className="select"
                      value={newCustomer.industry}
                      onChange={(e) => setNewCustomer({ ...newCustomer, industry: e.target.value })}
                    >
                      <option value="Enterprise SaaS">Enterprise SaaS</option>
                      <option value="Financial Services">Financial Services</option>
                      <option value="Healthcare & Bio">Healthcare & Bio</option>
                      <option value="Aerospace & Defense">Aerospace & Defense</option>
                      <option value="Logistics & Retail">Logistics & Retail</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    PRIMARY CONTACT PERSON
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        className="input"
                        placeholder="Sarah"
                        value={newCustomer.contactFirstName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, contactFirstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        className="input"
                        placeholder="Jenkins"
                        value={newCustomer.contactLastName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, contactLastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Email</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="sarah@example.com"
                      value={newCustomer.contactEmail}
                      onChange={(e) => setNewCustomer({ ...newCustomer, contactEmail: e.target.value })}
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
                  disabled={!newCustomer.name || createMutation.isPending}
                  onClick={() => createMutation.mutate(newCustomer)}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Customers;
