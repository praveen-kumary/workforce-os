import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Download, X,
} from 'lucide-react';
import { coreApi, financeApi, itApi, workplaceApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';

const REPORT_TEMPLATES = [
  { id: 'headcount', name: 'Headcount & Organizational Report', category: 'People', description: 'Employee distribution by department, location, compensation and employment type', schedule: 'Monthly' },
  { id: 'payroll', name: 'Payroll & Tax Disbursal Breakdown', category: 'Finance', description: 'Gross pay, federal/state tax withholdings, and retirement contribution breakdowns', schedule: 'Monthly' },
  { id: 'expenses', name: 'Expense & Spend Analysis', category: 'Finance', description: 'Corporate card and reimbursement spending by category and department', schedule: 'Weekly' },
  { id: 'compliance', name: 'Hardware & Security Compliance', category: 'IT', description: 'Endpoint encryption attestation, OS patch status, and fleet health', schedule: 'Monthly' },
  { id: 'attendance', name: 'Time & Attendance Utilization', category: 'People', description: 'Timesheets, logged hours, leave balances, and overtime tracking', schedule: 'Daily' },
];

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  People: { color: '#2563eb', bg: 'var(--info-bg)' },
  Finance: { color: '#16a34a', bg: 'var(--success-bg)' },
  IT: { color: '#7c3aed', bg: '#f5f3ff' },
};

export function Reports() {
  const [runningReport, setRunningReport] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<{ title: string; rows: any[] } | null>(null);
  const { addToast } = useToast();

  const handleRunReport = async (reportId: string, name: string) => {
    setRunningReport(reportId);
    try {
      let rows: any[] = [];
      if (reportId === 'headcount') {
        const res = await coreApi.getEmployees({ pageSize: 50 });
        rows = (res.data || []).map((e: any) => ({
          Name: `${e.firstName} ${e.lastName}`,
          Department: e.department,
          Role: e.roleTitle,
          Location: e.location,
          Status: e.status,
        }));
      } else if (reportId === 'payroll') {
        const res = await financeApi.getPayrollRuns();
        rows = (res || []).map((r: any) => ({
          Period: r.period,
          Gross: `$${r.totalGross}`,
          Net: `$${r.totalNet}`,
          Tax: `$${r.totalTax}`,
          Status: r.status,
        }));
      } else if (reportId === 'expenses') {
        const res = await financeApi.getExpenses();
        rows = (res || []).map((e: any) => ({
          Employee: `${e.employee?.firstName || ''} ${e.employee?.lastName || ''}`,
          Category: e.category,
          Description: e.description,
          Amount: `$${e.amount}`,
          Status: e.status,
        }));
      } else if (reportId === 'compliance') {
        const res = await itApi.getDevices();
        rows = (res || []).map((d: any) => ({
          Device: `${d.make} ${d.model}`,
          Serial: d.serialNumber,
          Assignee: `${d.employee?.firstName || ''} ${d.employee?.lastName || ''}`,
          Encrypted: d.isEncrypted ? 'YES' : 'NO',
          Status: d.status,
        }));
      } else if (reportId === 'attendance') {
        const res = await workplaceApi.getTeamStatus();
        rows = (res || []).map((t: any) => ({
          Name: t.name,
          Role: t.role,
          Department: t.department,
          ClockIn: t.clockIn,
          Hours: t.hours,
          Status: t.status,
        }));
      }

      setReportResult({ title: name, rows });
      addToast({ title: 'Report Generated', description: `Loaded ${rows.length} records successfully.` });
    } catch (err: any) {
      addToast({ title: 'Report failed', description: err.message });
    } finally {
      setRunningReport(null);
    }
  };

  const handleDownloadCSV = () => {
    if (!reportResult || reportResult.rows.length === 0) return;
    const headers = Object.keys(reportResult.rows[0]).join(',');
    const lines = reportResult.rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...lines].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportResult.title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ title: 'CSV Downloaded' });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Analytics & Reports</h1>
          <p className="page-subtitle">
            {REPORT_TEMPLATES.length} live executive report generators
          </p>
        </div>
      </div>

      <div className="grid-cards">
        {REPORT_TEMPLATES.map((report, i) => {
          const cat = CAT_COLORS[report.category] || { color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' };
          const isRunning = runningReport === report.id;

          return (
            <motion.div
              key={report.id}
              className="card card-interactive"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                <span className="badge" style={{ background: cat.bg, color: cat.color }}>{report.category}</span>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>{report.schedule}</span>
              </div>
              <h4 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 4 }}>{report.name}</h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                {report.description}
              </p>
              <div className="flex-between" style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-light)' }}>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={isRunning}
                  onClick={() => handleRunReport(report.id, report.name)}
                >
                  <BarChart3 size={13} /> {isRunning ? 'Running...' : 'Run Query'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Report Results Modal */}
      <AnimatePresence>
        {reportResult && (
          <div className="modal-overlay" onClick={() => setReportResult(null)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 760 }}
            >
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{reportResult.title}</h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    {reportResult.rows.length} records generated
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-sm btn-secondary" onClick={handleDownloadCSV}>
                    <Download size={13} /> Export CSV
                  </button>
                  <button className="btn-ghost btn-icon" onClick={() => setReportResult(null)}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="modal-body" style={{ maxHeight: 400, overflowY: 'auto', padding: 0 }}>
                {reportResult.rows.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(reportResult.rows[0]).map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportResult.rows.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val: any, vIdx) => (
                            <td key={vIdx}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: 20, textAlign: 'center' }}>No rows generated</div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setReportResult(null)}>
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
export default Reports;
