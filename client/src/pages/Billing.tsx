import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CreditCard, Check, Users, Zap, Building2 } from 'lucide-react';
import { coreApi, procurementApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 0, users: '≤ 10', features: ['Core HR & Directory', 'Basic Payroll Engine', 'Leave Management'] },
  { id: 'business', name: 'Business Pro', price: 18, users: '≤ 250', features: ['Everything in Starter', 'IT Asset Management', 'Multi-Cloud CRM & Pipeline', 'Expense Tracking', 'Performance OKRs'] },
  { id: 'enterprise', name: 'Enterprise Elite', price: 38, users: 'Unlimited', features: ['Everything in Business', 'Zero-Touch Workflows', 'SSO / SAML / SCIM', 'Custom ERP Integrations', 'Dedicated 24/7 SLA'] },
];

export const Billing: React.FC = () => {
  const [currentPlanId, setCurrentPlanId] = useState('business');
  const { addToast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => coreApi.getStats(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => procurementApi.getInvoices(),
  });

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setCurrentPlanId(plan.id);
    addToast({
      title: `Plan updated to ${plan.name}`,
      description: `Your enterprise subscription is now configured for ${plan.name}.`,
    });
  };

  const activeSeats = stats?.kpis?.totalEmployees || 31;
  const currentPlan = PLANS.find((p) => p.id === currentPlanId) || PLANS[1];

  return (
    <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="flex items-center gap-3">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Subscription & Billing</h1>
          <span className="badge badge-success">Active Subscription</span>
        </div>
        <p className="page-subtitle" style={{ marginTop: 4 }}>
          Manage your enterprise subscription tier, seat allocation, and billing history.
        </p>
      </div>

      {/* Current Plan Summary Card */}
      <Card
        style={{
          marginBottom: 'var(--space-6)',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
          borderColor: 'var(--border)',
          padding: '24px 28px',
        }}
      >
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <Zap size={16} color="var(--accent)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)' }}>Current Subscription</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              {currentPlan.name}
            </div>
            <div className="flex items-center gap-5" style={{ marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span className="flex items-center gap-1.5"><Users size={14} color="var(--accent)" /> {activeSeats} active seats billed</span>
              <span className="flex items-center gap-1.5"><CreditCard size={14} color="var(--accent)" /> ${currentPlan.price}/seat/month</span>
              <span className="flex items-center gap-1.5"><Building2 size={14} color="var(--accent)" /> Annual Billing Cycle</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              ${activeSeats * currentPlan.price}/mo
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Next billing date: Oct 1, 2026</div>
          </div>
        </div>
      </Card>

      {/* Plans Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 'var(--space-6)' }}>
        {PLANS.map((plan) => {
          const isActive = plan.id === currentPlanId;
          return (
            <Card
              key={plan.name}
              style={{
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                boxShadow: isActive ? '0 0 0 1px var(--accent), var(--shadow-md)' : 'var(--shadow-card)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: 20,
                    right: 20,
                    height: 3,
                    borderRadius: '0 0 3px 3px',
                    background: 'var(--accent)',
                  }}
                />
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    {plan.name}
                  </span>
                  {isActive && <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>Active</span>}
                </div>

                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  {plan.price > 0 && <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-secondary)' }}>/user/mo</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 16 }}>{plan.users} users included</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <Check size={14} color="var(--success)" strokeWidth={2.5} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant={isActive ? 'secondary' : 'primary'}
                size="sm"
                style={{ width: '100%', cursor: isActive ? 'default' : 'pointer' }}
                disabled={isActive}
                onClick={() => handleSelectPlan(plan)}
              >
                {isActive ? 'Current Plan' : 'Select Plan'}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Billing Invoices Card */}
      <div className="card card-flush" style={{ marginBottom: 'var(--space-6)' }}>
        <div
          className="flex-between"
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Recent Invoices & Payment History
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
              Enterprise receipts and tax compliance payment history
            </p>
          </div>
          <span className="badge badge-neutral">{invoices.length} Invoices</span>
        </div>

        <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Invoice ID</th>
                <th style={{ width: '24%' }}>Amount</th>
                <th style={{ width: '28%' }}>Due Date</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((inv: any) => {
                const statusUpper = (inv.status || '').toUpperCase();
                const badgeVariant =
                  statusUpper === 'PAID'
                    ? 'badge-success'
                    : statusUpper === 'SENT' || statusUpper === 'PENDING'
                    ? 'badge-info'
                    : statusUpper === 'OVERDUE'
                    ? 'badge-error'
                    : 'badge-neutral';

                return (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 650, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.8125rem' }}>
                        {inv.invoiceNum}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-heading)' }}>${Number(inv.amount).toLocaleString()}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${badgeVariant}`} style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                        {inv.status?.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Billing;
