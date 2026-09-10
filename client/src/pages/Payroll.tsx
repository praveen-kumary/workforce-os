import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Users, FileText, Play,
  CheckCircle, Eye, X,
} from 'lucide-react';
import { financeApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { PayrollRun } from '../lib/types';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', label: 'Draft' },
  PROCESSING: { bg: 'var(--info-bg)', text: 'var(--info-text)', label: 'Processing' },
  COMPLETED: { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Completed' },
  FAILED: { bg: 'var(--error-bg)', text: 'var(--error-text)', label: 'Failed' },
};

export function Payroll() {
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: () => financeApi.getPayrollRuns(),
  });

  const runPayrollMutation = useMutation({
    mutationFn: () =>
      financeApi.executePayrollRun(
        `Q3 — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      addToast({ title: 'Payroll execution completed', description: 'Calculated payslips and taxes for all active employees.' });
    },
    onError: (err: any) => {
      addToast({ title: 'Payroll execution failed', description: err.message });
    },
  });

  const latestRun = runs[0];
  const totalAnnualGross = runs.reduce((s: number, r: PayrollRun) => s + Number(r.totalGross), 0);
  const totalTaxDisbursed = runs.reduce((s: number, r: PayrollRun) => s + Number(r.totalTax), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">
            {runs.length} processed cycles · ${(totalAnnualGross / 1000).toFixed(0)}K total gross disbursed
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            disabled={runPayrollMutation.isPending}
            onClick={() => runPayrollMutation.mutate()}
          >
            <Play size={14} /> {runPayrollMutation.isPending ? 'Calculating...' : 'Execute Payroll Cycle'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Latest Gross Pay', value: latestRun ? `$${Number(latestRun.totalGross).toLocaleString()}` : '$0', icon: DollarSign, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Latest Net Disbursed', value: latestRun ? `$${Number(latestRun.totalNet).toLocaleString()}` : '$0', icon: CheckCircle, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Total Tax Withheld', value: `$${(totalTaxDisbursed / 1000).toFixed(0)}K`, icon: FileText, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Active Payees', value: latestRun?.employeeCount || 25, icon: Users, color: '#d97706', bg: 'var(--warning-bg)' },
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

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : runs.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>No payroll cycles recorded</h3>
          <p>Run your first automated payroll calculation with real tax withholdings.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => runPayrollMutation.mutate()}>
            <Play size={14} /> Execute Payroll
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Pay Period</th>
                <th>Pay Date</th>
                <th>Employees</th>
                <th>Total Gross</th>
                <th>Net Disbursed</th>
                <th>Tax Withheld</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Payslips</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r: PayrollRun) => {
                const sc = STATUS_MAP[r.status] || STATUS_MAP.COMPLETED;
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{r.period}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {new Date(r.payDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.employeeCount} payees</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(r.totalGross).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 750, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(r.totalNet).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        ${Number(r.totalTax).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedRun(r)}
                      >
                        <Eye size={13} /> View Breakdown
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payslip & Breakdown Modal */}
      <AnimatePresence>
        {selectedRun && (
          <div className="modal-overlay" onClick={() => setSelectedRun(null)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 560 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                  Payroll Breakdown — {selectedRun.period}
                </h3>
                <button className="btn-ghost btn-icon" onClick={() => setSelectedRun(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
                  <div className="flex-between">
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Total Payroll Cost</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                        ${Number(selectedRun.totalGross).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Net Disbursed</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                        ${Number(selectedRun.totalNet).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 'var(--space-4) var(--space-6)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    DEDUCTION & WITHHOLDING BREAKDOWN
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="flex-between" style={{ fontSize: 'var(--text-sm)' }}>
                      <span>Federal & State Income Tax (22% Avg)</span>
                      <span style={{ fontWeight: 650, color: 'var(--error)' }}>
                        -${Number(selectedRun.totalTax).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex-between" style={{ fontSize: 'var(--text-sm)' }}>
                      <span>Health & Dental Benefits Withholding</span>
                      <span style={{ fontWeight: 650, color: 'var(--error)' }}>
                        -${(Number(selectedRun.totalGross) * 0.03).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex-between" style={{ fontSize: 'var(--text-sm)' }}>
                      <span>401(k) Pre-Tax Retirement Matching (5%)</span>
                      <span style={{ fontWeight: 650, color: 'var(--info)' }}>
                        -${(Number(selectedRun.totalGross) * 0.05).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedRun(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Payroll;
