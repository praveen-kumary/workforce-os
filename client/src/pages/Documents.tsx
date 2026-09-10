import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Plus, X } from 'lucide-react';
import { hrApi, coreApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { Employee } from '../lib/types';

export function Documents() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'OFFER_LETTER',
    employeeId: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => hrApi.getDocuments(),
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees-short'],
    queryFn: () => coreApi.getEmployees({ pageSize: 50 }),
  });
  const employees = employeesResponse?.data || [];

  const signMutation = useMutation({
    mutationFn: (id: string) => hrApi.signDocument(id, 'Signed by Employee'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ title: 'Document e-signed successfully' });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      hrApi.createDocument({
        title: data.title,
        category: data.category,
        employeeId: data.employeeId,
        status: 'PENDING_SIGNATURE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addToast({ title: 'Document issued' });
      setShowModal(false);
      setNewDoc({ title: '', category: 'OFFER_LETTER', employeeId: '' });
    },
  });

  const filtered = documents.filter((d: any) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.employee && `${d.employee.firstName} ${d.employee.lastName}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents & Compliance</h1>
          <p className="page-subtitle">
            {documents.length} legal documents · E-Signatures and tax compliance forms
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (employees.length > 0 && !newDoc.employeeId) {
              setNewDoc({ ...newDoc, employeeId: employees[0].id });
            }
            setShowModal(true);
          }}
        >
          <Plus size={15} /> Issue Document
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          className="input"
          placeholder="Search documents by title or employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No documents found</h3>
          <p>Issue offer letters, NDAs, or W4 forms for electronic signature.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Recipient</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc: any) => {
                const isSigned = doc.status === 'SIGNED';
                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={16} color="var(--accent)" />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                        {doc.category?.toLowerCase().replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : 'General'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: isSigned ? 'var(--success-bg)' : 'var(--warning-bg)',
                          color: isSigned ? 'var(--success-text)' : 'var(--warning-text)',
                        }}
                      >
                        {isSigned ? 'Signed' : 'Pending Signature'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!isSigned && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => signMutation.mutate(doc.id)}
                        >
                          <Check size={13} /> Sign Document
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue Document Modal */}
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
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Issue Document</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input
                    className="input"
                    placeholder="e.g. Employee Confidentiality Agreement"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="select"
                    value={newDoc.category}
                    onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                  >
                    <option value="OFFER_LETTER">Offer Letter</option>
                    <option value="NDA">NDA Agreement</option>
                    <option value="W4_TAX">W-4 Tax Withholding</option>
                    <option value="HANDBOOK">Employee Handbook</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Recipient *</label>
                  <select
                    className="select"
                    value={newDoc.employeeId}
                    onChange={(e) => setNewDoc({ ...newDoc, employeeId: e.target.value })}
                  >
                    {employees.map((emp: Employee) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newDoc.title || !newDoc.employeeId || createMutation.isPending}
                  onClick={() => createMutation.mutate(newDoc)}
                >
                  {createMutation.isPending ? 'Issuing...' : 'Issue Document'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Documents;
