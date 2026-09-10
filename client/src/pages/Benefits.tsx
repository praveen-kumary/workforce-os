import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, DollarSign } from 'lucide-react';
import { hrApi } from '../lib/api';
import type { BenefitPlan } from '../lib/types';

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  HEALTH_INSURANCE: { color: '#dc2626', bg: 'var(--error-bg)' },
  DENTAL: { color: '#2563eb', bg: 'var(--info-bg)' },
  VISION: { color: '#7c3aed', bg: 'var(--workflow-subtle)' },
  RETIREMENT_401K: { color: '#16a34a', bg: 'var(--success-bg)' },
  LIFE_INSURANCE: { color: '#d97706', bg: 'var(--warning-bg)' },
  WELLNESS: { color: '#0891b2', bg: '#ecfeff' },
};

export function Benefits() {

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['benefits-catalog'],
    queryFn: () => hrApi.getBenefitsCatalog(),
  });

  const totalMonthlyCost = plans.reduce((s: number, p: BenefitPlan) => s + Number(p.monthlyCost), 0);
  const totalEmployerContrib = plans.reduce((s: number, p: BenefitPlan) => s + Number(p.employerContrib), 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Benefits Administration</h1>
          <p className="page-subtitle">
            {plans.length} active corporate benefit plans · Nationwide network coverage
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Benefit Plans', value: plans.length, icon: Heart, color: '#dc2626', bg: 'var(--error-bg)' },
          { label: 'Employer Subsidized', value: `$${totalEmployerContrib}/mo`, icon: Shield, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Employee Avg Cost', value: `$${totalMonthlyCost - totalEmployerContrib}/mo`, icon: DollarSign, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Open Enrollment', value: 'Active', icon: Users, color: '#7c3aed', bg: '#f5f3ff' },
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
      ) : (
        <div className="grid-cards">
          {plans.map((plan: BenefitPlan, i: number) => {
            const tc = TYPE_COLORS[plan.type] || { color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' };
            return (
              <motion.div
                key={plan.id}
                className="card card-interactive"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      background: tc.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Heart size={20} color={tc.color} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{plan.name}</h4>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>
                      {plan.provider}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                  {plan.description}
                </p>

                <div className="flex-between" style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-light)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>Monthly Premium: </span>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>${Number(plan.monthlyCost)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--success)' }}>
                      Employer pays: ${Number(plan.employerContrib)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default Benefits;
