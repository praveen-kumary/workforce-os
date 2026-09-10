import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Play,
  Download,
  Plus,
  CreditCard,
  Receipt,
  Lock,
  Unlock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { DataTable, Column } from '../components/ui/DataTable';
import { useToast } from '../components/ui/Toaster';
import { Modal } from '../components/ui/Modal';
import { downloadPayslip } from '../lib/payslipPdfGenerator';
import { financeApi } from '../lib/api';

const fetchPayrollRuns = () => financeApi.getPayrollRuns();
const fetchExpenses = () => financeApi.getExpenses();
const fetchCorporateCards = () => financeApi.getCorporateCards();
const fetchCompBands = () => financeApi.getCompensationBands();

const listVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
};

export const FinanceDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('payroll');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'TRAVEL', description: '', amount: '' });

  // Queries
  const { data: runs = [], isLoading: loadingRuns } = useQuery({ queryKey: ['finance-payroll'], queryFn: fetchPayrollRuns, retry: 1, retryDelay: 1000 });
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({ queryKey: ['finance-expenses'], queryFn: fetchExpenses, retry: 1, retryDelay: 1000 });
  const { data: cards = [], isLoading: loadingCards } = useQuery({ queryKey: ['finance-cards'], queryFn: fetchCorporateCards, retry: 1, retryDelay: 1000 });
  const { data: compBands = [] } = useQuery({ queryKey: ['finance-comp'], queryFn: fetchCompBands, retry: 1, retryDelay: 1000 });

  // Mutations
  const payrollMutation = useMutation({
    mutationFn: () => financeApi.executePayrollRun(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finance-payroll'] });
      toast(`💰 Automated payroll engine executed! Dispatched payslips to ${data.employeeCount} active team members.`, 'success');
    },
    onError: () => {
      toast('Failed to run payroll engine.', 'error');
    },
  });

  const submitExpenseMutation = useMutation({
    mutationFn: () => financeApi.submitExpense({
      employeeId: '',
      category: newExpense.category,
      description: newExpense.description,
      amount: Number(newExpense.amount) * 100,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      toast('Expense report submitted for manager approval', 'success');
      setShowExpenseModal(false);
      setNewExpense({ category: 'TRAVEL', description: '', amount: '' });
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: (id: string) => financeApi.approveExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      toast('Expense approved for reimbursement', 'success');
    },
  });

  const freezeCardMutation = useMutation({
    mutationFn: (id: string) => financeApi.toggleCardFreeze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-cards'] });
      toast('Card status updated', 'info');
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const totalGrossYTD = runs.reduce((acc: number, r: any) => acc + Number(r.totalGross || 0), 0);
  const totalTaxYTD = runs.reduce((acc: number, r: any) => acc + Number(r.totalTax || 0), 0);
  const pendingExpenses = expenses.filter((e: any) => e.status === 'SUBMITTED');

  const financeTabs = [
    { id: 'payroll', label: 'Automated Payroll Runs', icon: <CreditCard size={15} />, badge: runs.length || undefined },
    { id: 'expenses', label: 'Expense Reimbursements', icon: <Receipt size={15} />, badge: pendingExpenses.length || undefined },
    { id: 'cards', label: 'Corporate Spend Cards', icon: <Wallet size={15} />, badge: cards.length || undefined },
    { id: 'compensation', label: 'Compensation Bands & Benchmarking', icon: <TrendingUp size={15} /> },
  ];

  const payrollColumns: Column<any>[] = [
    { key: 'period', header: 'Pay Period', sortable: true },
    {
      key: 'payDate',
      header: 'Disbursement Date',
      render: (r) => new Date(r.payDate).toLocaleDateString(),
    },
    { key: 'employeeCount', header: 'Employees Paid', align: 'center' },
    {
      key: 'totalGross',
      header: 'Total Gross',
      render: (r) => <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(r.totalGross)}</span>,
    },
    {
      key: 'totalTax',
      header: 'Tax Withheld',
      render: (r) => <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.totalTax)}</span>,
    },
    {
      key: 'totalNet',
      header: 'Net Direct Deposit',
      render: (r) => <span className="font-mono font-bold" style={{ color: 'var(--success)' }}>{formatCurrency(r.totalNet)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge variant="success">{r.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Payslip',
      align: 'right',
      render: (r) => (
        <button
          onClick={() => {
            if (!r.payslips || r.payslips.length === 0) {
              toast('No payslips generated for this run yet.', 'error');
              return;
            }
            const samplePayslip = r.payslips[0];
            const payslipData = {
              employeeName: `${samplePayslip.employee.firstName} ${samplePayslip.employee.lastName}`,
              employeeCode: `EMP-${samplePayslip.employeeId.slice(0, 4)}`,
              employeeEmail: samplePayslip.employee.email || 'employee@uos.com',
              monthName: r.period.split('—')[1]?.trim() || 'Month',
              year: new Date(r.payDate).getFullYear(),
              status: 'PAID',
              basicSalary: Number(samplePayslip.basePay),
              allowances: Number(samplePayslip.grossPay) - Number(samplePayslip.basePay),
              deductions: Number(samplePayslip.taxDeduction),
              netSalary: Number(samplePayslip.netPay),
              department: samplePayslip.employee.department,
              companyName: 'Unified Workforce OS',
            };
            downloadPayslip(payslipData, `Payslip_${payslipData.employeeName.replace(' ', '_')}.pdf`);
            toast(`Generated official PDF payslip for ${payslipData.employeeName}`, 'success');
          }}
          className="p-2 rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer"
          style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
          title="Download Sample PDF Payslip"
        >
          <Download className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">
              Finance & Spend Cloud
            </h1>
            <Badge variant="finance">Automated Ledger Engine</Badge>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Zero-error payroll calculation runs, corporate card limits, and expense approval workflows.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="finance"
            size="md"
            leftIcon={<Play size={15} />}
            onClick={() => payrollMutation.mutate()}
            isLoading={payrollMutation.isPending}
          >
            Run Payroll Engine
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <KPICard
          title="Total Gross YTD"
          value={loadingRuns ? undefined : formatCurrency(totalGrossYTD)}
          trend={2.4}
          trendLabel="Within Annual Budget"
          icon={<DollarSign size={18} />}
          color="var(--success)"
          bg="var(--success-subtle)"
          isLoading={loadingRuns}
        />
        <KPICard
          title="Taxes & Benefits Withheld"
          value={loadingRuns ? undefined : formatCurrency(totalTaxYTD)}
          trend={-1.8}
          trendLabel="Fully Compliant"
          icon={<TrendingUp size={18} />}
          color="var(--warning)"
          bg="var(--warning-subtle)"
          isLoading={loadingRuns}
        />
        <KPICard
          title="Active Corporate Cards"
          value={loadingCards ? undefined : cards.filter((c: any) => c.status === 'ACTIVE').length}
          trend={4.5}
          trendLabel="Zero Overdrafts"
          icon={<Wallet size={18} />}
          color="var(--accent)"
          bg="var(--accent-subtle)"
          isLoading={loadingCards}
        />
        <KPICard
          title="Pending Expenses"
          value={loadingExpenses ? undefined : pendingExpenses.length}
          trend={-8.5}
          trendLabel="Ready for Review"
          icon={<Receipt size={18} />}
          color="var(--error)"
          bg="var(--error-subtle)"
          isLoading={loadingExpenses}
        />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Tabs tabs={financeTabs} activeTab={activeTab} onChange={setActiveTab} module="finance" />
      </div>

      {/* 1. PAYROLL RUNS TAB */}
      {activeTab === 'payroll' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>Historical & Live Payroll Runs</h3>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--success)' }}>Automated Tax Breakdown</span>
          </div>

          <DataTable
            data={runs}
            columns={payrollColumns}
            isLoading={loadingRuns}
            pageSize={8}
            emptyTitle="No Payroll Runs Found"
            emptyDescription="Click 'Run Payroll Engine' above to calculate and execute the current pay period."
          />
        </Card>
      )}

      {/* 2. EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Employee Expense Reimbursement Pipeline</h3>
            <Button
              variant="finance"
              size="xs"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowExpenseModal(true)}
            >
              Submit Expense
            </Button>
          </div>

          <motion.div variants={listVariant} initial="hidden" animate="show" className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {expenses.map((exp: any) => (
              <motion.div key={exp.id} variants={itemVariant} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{exp.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Category: <span className="font-semibold" style={{ color: 'var(--success)' }}>{exp.category}</span> • Submitted by{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>{exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : 'Employee'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-base font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(Number(exp.amount))}
                  </span>

                  <Badge variant={exp.status === 'APPROVED' ? 'success' : exp.status === 'SUBMITTED' ? 'warning' : 'danger'}>
                    {exp.status}
                  </Badge>

                  {exp.status === 'SUBMITTED' && (
                    <Button
                      variant="finance"
                      size="xs"
                      onClick={() => approveExpenseMutation.mutate(exp.id)}
                      isLoading={approveExpenseMutation.isPending}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      )}

      {/* 3. CORPORATE CARDS TAB */}
      {activeTab === 'cards' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-5)' }}>
          {cards.map((card: any) => (
            <motion.div key={card.id} variants={itemVariant}>
              <Card className="p-6 space-y-4 transition-all hover:shadow-lg" style={{ height: '100%' }}>
                {/* Virtual Card Visualizer */}
                <div className="p-5 rounded-2xl border space-y-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>
                      UOS {card.cardType} Card
                    </span>
                    <Badge variant={card.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {card.status}
                    </Badge>
                  </div>

                  <div className="py-2">
                    <span className="text-base font-mono tracking-widest" style={{ color: 'var(--text-primary)' }}>
                      {card.cardNumberMasked}
                    </span>
                  </div>

                  <div className="flex justify-between items-end text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-tertiary)' }}>CARDHOLDER</span>
                      <span className="font-bold uppercase" style={{ color: 'var(--text-primary)' }}>
                        {card.employee ? `${card.employee.firstName} ${card.employee.lastName}` : 'Executive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-tertiary)' }}>SPEND LIMIT</span>
                      <span className="font-bold font-mono" style={{ color: 'var(--success)' }}>
                        {formatCurrency(Number(card.spendingLimit))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Current Balance: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(card.currentBalance))}</strong>
                  </span>

                  <Button
                    variant={card.status === 'ACTIVE' ? 'outline' : 'finance'}
                    size="xs"
                    leftIcon={card.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
                    onClick={() => freezeCardMutation.mutate(card.id)}
                    isLoading={freezeCardMutation.isPending}
                  >
                    {card.status === 'ACTIVE' ? 'Freeze Card' : 'Unfreeze Card'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 4. COMPENSATION BANDS TAB */}
      {activeTab === 'compensation' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Department Compensation Bands & Equity Percentiles</h3>
            <Badge variant="finance">Market Benchmarked</Badge>
          </div>

          <motion.div variants={listVariant} initial="hidden" animate="show" className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {compBands.map((band: any) => (
              <motion.div key={band.id} variants={itemVariant} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--bg-secondary)]">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{band.roleTitle}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {band.department} • <span className="font-bold" style={{ color: 'var(--success)' }}>{band.level}</span>
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                  <div>
                    <span className="text-[10px] block uppercase" style={{ color: 'var(--text-tertiary)' }}>Min Base</span>
                    <span className="font-bold">${Number(band.minSalary).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block uppercase" style={{ color: 'var(--text-tertiary)' }}>Midpoint Target</span>
                    <span className="font-bold" style={{ color: 'var(--success)' }}>${Number(band.midSalary).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block uppercase" style={{ color: 'var(--text-tertiary)' }}>Max Cap</span>
                    <span className="font-bold">${Number(band.maxSalary).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block uppercase" style={{ color: 'var(--text-tertiary)' }}>Equity Shares</span>
                    <span className="font-bold" style={{ color: 'var(--accent)' }}>{band.equityMin.toLocaleString()} - {band.equityMax.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <Modal
          title="Submit Business Expense"
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
        >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitExpenseMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flight to NYC for Client Meeting"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Amount (USD) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 450"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="input w-full font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Expense Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="input w-full"
                >
                  <option value="TRAVEL">Travel & Lodging</option>
                  <option value="SOFTWARE">Software / SaaS Subscription</option>
                  <option value="MEALS">Meals & Entertainment</option>
                  <option value="OFFICE">Office Supplies & Hardware</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <Button variant="outline" type="button" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </Button>
                <Button variant="finance" type="submit" isLoading={submitExpenseMutation.isPending}>
                  Submit Report
                </Button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
};
