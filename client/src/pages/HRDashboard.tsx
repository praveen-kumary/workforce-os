import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Award,
  HeartHandshake,
  FolderOpen,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { useToast } from '../components/ui/Toaster';
import { EmptyState } from '../components/ui/EmptyState';
import { OnboardingBuilder } from './OnboardingBuilder';
import { hrApi } from '../lib/api';

const fetchLeaves = () => hrApi.getLeaves();
const fetchPerformance = () => hrApi.getPerformanceReviews();
const fetchGoals = () => hrApi.getGoals();
const fetchBenefits = () => hrApi.getBenefitsCatalog();
const fetchDocs = () => hrApi.getDocuments();

const listVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
};

export const HRDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('leaves');

  // Queries
  const { data: leaves = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['hr-leaves'],
    queryFn: fetchLeaves,
    retry: 1, retryDelay: 1000,
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['hr-reviews'],
    queryFn: fetchPerformance,
    retry: 1, retryDelay: 1000,
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['hr-goals'],
    queryFn: fetchGoals,
    retry: 1, retryDelay: 1000,
  });

  const { data: benefits = [] } = useQuery({
    queryKey: ['hr-benefits'],
    queryFn: fetchBenefits,
    retry: 1, retryDelay: 1000,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['hr-documents'],
    queryFn: fetchDocs,
    retry: 1, retryDelay: 1000,
  });

  // Mutations
  const approveLeaveMutation = useMutation({
    mutationFn: (id: string) => hrApi.approveLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
      toast('Time-off request approved & calendar updated', 'success');
    },
  });

  const denyLeaveMutation = useMutation({
    mutationFn: (id: string) => hrApi.denyLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-leaves'] });
      toast('Time-off request denied', 'info');
    },
  });

  const signDocMutation = useMutation({
    mutationFn: (id: string) => hrApi.signDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-documents'] });
      toast('Document signed with cryptographic timestamp!', 'success');
    },
  });

  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING');
  const approvedLeaves = leaves.filter((l: any) => l.status === 'APPROVED');

  const hrTabs = [
    { id: 'leaves', label: 'Time & Off Approvals', icon: <CalendarDays size={15} />, badge: pendingLeaves.length || undefined },
    { id: 'performance', label: 'Performance & OKRs', icon: <Award size={15} />, badge: reviews.length || undefined },
    { id: 'benefits', label: 'Benefits Hub', icon: <HeartHandshake size={15} />, badge: benefits.length || undefined },
    { id: 'documents', label: 'Document Vault', icon: <FolderOpen size={15} />, badge: documents.length || undefined },
    { id: 'templates', label: 'Onboarding Pipelines', icon: <Sparkles size={15} /> },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">
              HR Cloud Hub
            </h1>
            <Badge variant="hr">Unified Talent OS</Badge>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Automate time-off policies, quarterly reviews, employee benefits enrollment, and compliance documents.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <KPICard
          title="Pending Time-Off"
          value={loadingLeaves ? undefined : pendingLeaves.length}
          trend={-15}
          trendLabel="Awaiting Review"
          icon={<Clock size={18} />}
          color="var(--warning)"
          bg="var(--warning-subtle)"
          isLoading={loadingLeaves}
        />
        <KPICard
          title="Approved Leaves"
          value={loadingLeaves ? undefined : approvedLeaves.length}
          trend={8.2}
          trendLabel="Active This Month"
          icon={<CalendarDays size={18} />}
          color="var(--success)"
          bg="var(--success-subtle)"
          isLoading={loadingLeaves}
        />
        <KPICard
          title="Performance Cycles"
          value={loadingReviews ? undefined : `${reviews.length} Reviews`}
          trend={4.8}
          trendLabel="Avg 4.6 / 5.0 Rating"
          icon={<Award size={18} />}
          color="var(--accent)"
          bg="var(--accent-subtle)"
          isLoading={loadingReviews}
        />
        <KPICard
          title="Benefits Enrollment"
          value={benefits.length > 0 ? '100%' : '0%'}
          trend={0}
          trendLabel="Top Tier Coverage"
          icon={<HeartHandshake size={18} />}
          color="var(--info)"
          bg="var(--info-subtle)"
        />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Tabs tabs={hrTabs} activeTab={activeTab} onChange={setActiveTab} module="hr" />
      </div>

      {/* 1. TIME & OFF TAB */}
      {activeTab === 'leaves' && (
        <div className="section-grid">
          <Card style={{ padding: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              <Clock size={16} style={{ color: 'var(--accent)' }} />
              <span>Pending Leave Approvals ({pendingLeaves.length})</span>
            </h2>

            {loadingLeaves ? (
              <Skeleton variant="card" count={3} />
            ) : pendingLeaves.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={32}/>} title="All Caught Up" description="All leave requests have been reviewed. No pending approvals!" />
            ) : (
              <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-3">
                {pendingLeaves.map((leave: any) => (
                  <motion.div
                    key={leave.id}
                    variants={itemVariant}
                    className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        name={`${leave.employee?.firstName} ${leave.employee?.lastName}`}
                        src={leave.employee?.avatarUrl}
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{leave.leaveType}</span> • {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} ({leave.daysCount} days)
                        </p>
                        {leave.notes && (
                          <p className="text-[11px] italic mt-0.5" style={{ color: 'var(--text-tertiary)' }}>"{leave.notes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => denyLeaveMutation.mutate(leave.id)}
                        disabled={denyLeaveMutation.isPending}
                      >
                        Deny
                      </Button>
                      <Button
                        variant="hr"
                        size="xs"
                        onClick={() => approveLeaveMutation.mutate(leave.id)}
                        isLoading={approveLeaveMutation.isPending}
                      >
                        Approve
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>

          {/* Approved Leaves History */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              <CalendarDays size={16} style={{ color: 'var(--success)' }} />
              <span>Approved Time-Off Calendar</span>
            </h2>

            <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar">
              {approvedLeaves.map((leave: any) => (
                <motion.div key={leave.id} variants={itemVariant} className="p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center gap-3">
                    <Avatar name={`${leave.employee?.firstName} ${leave.employee?.lastName}`} size="sm" />
                    <div>
                      <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success">{leave.leaveType}</Badge>
                </motion.div>
              ))}
            </motion.div>
          </Card>
        </div>
      )}

      {/* 2. PERFORMANCE & OKRs TAB */}
      {activeTab === 'performance' && (
        <div className="section-grid">
          <Card style={{ padding: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              <Award size={16} style={{ color: 'var(--accent)' }} />
              <span>Quarterly Performance Review Submissions</span>
            </h2>

            {loadingReviews ? (
              <Skeleton variant="card" count={3} />
            ) : reviews.length === 0 ? (
              <EmptyState icon={<Award size={32}/>} title="No Reviews" description="No review cycles recorded." />
            ) : (
              <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-3">
                {reviews.map((rev: any) => (
                  <motion.div key={rev.id} variants={itemVariant} className="p-4 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${rev.employee?.firstName} ${rev.employee?.lastName}`} size="sm" />
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{rev.employee?.firstName} {rev.employee?.lastName}</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{rev.employee?.roleTitle} • {rev.cycleName}</p>
                        </div>
                      </div>
                      <Badge variant="success">★ {rev.rating || 4.5} / 5.0</Badge>
                    </div>
                    {rev.feedback && (
                      <p className="text-xs p-2.5 rounded-lg italic" style={{ color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-tertiary)' }}>
                        "{rev.feedback}"
                      </p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>

          {/* Goals / OKRs */}
          <Card style={{ padding: 'var(--space-5)' }}>
            <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              <Sparkles size={16} style={{ color: 'var(--info)' }} />
              <span>Company & Team OKR Progress</span>
            </h2>

            {loadingGoals ? (
              <Skeleton variant="card" count={3} />
            ) : goals.length === 0 ? (
              <EmptyState icon={<Sparkles size={32} style={{ color: 'var(--info)' }}/>} title="No OKRs" description="No OKRs created yet." />
            ) : (
              <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-3">
                {goals.map((g: any) => (
                  <motion.div key={g.id} variants={itemVariant} className="p-4 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span style={{ color: 'var(--text-primary)' }}>{g.title}</span>
                      <span style={{ color: 'var(--accent)' }}>{g.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <div
                        style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'linear-gradient(to right, var(--accent), var(--info))', width: `${g.progress}%` }}
                      />
                    </div>
                    {g.description && <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{g.description}</p>}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>
        </div>
      )}

      {/* 3. BENEFITS HUB TAB */}
      {activeTab === 'benefits' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" className="section-grid">
          {benefits.map((plan: any) => (
            <motion.div key={plan.id} variants={itemVariant}>
              <Card className="p-6 space-y-4 transition-all hover:shadow-lg" style={{ height: '100%' }}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                      {plan.type?.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{plan.provider}</p>
                  </div>
                  <Badge variant="success">Active Plan</Badge>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>

                <div className="pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-light)' }}>
                  <div>
                    <span className="block" style={{ color: 'var(--text-tertiary)' }}>Employer Contribution</span>
                    <span className="font-bold font-mono" style={{ color: 'var(--success)' }}>${plan.employerContrib}/mo</span>
                  </div>
                  <div className="text-right">
                    <span className="block" style={{ color: 'var(--text-tertiary)' }}>Total Premium</span>
                    <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>${plan.monthlyCost}/mo</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 4. DOCUMENT VAULT TAB */}
      {activeTab === 'documents' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Cryptographic Document Vault & E-Signatures</h3>
            <Badge variant="hr">{documents.length} Files Protected</Badge>
          </div>

          <motion.div variants={listVariant} initial="hidden" animate="show" className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {documents.map((doc: any) => (
              <motion.div key={doc.id} variants={itemVariant} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--info-bg)', color: 'var(--accent)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Assigned to: <span className="font-semibold" style={{ color: 'var(--accent)' }}>{doc.employee?.firstName} {doc.employee?.lastName}</span> ({doc.employee?.department})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={doc.status === 'SIGNED' ? 'success' : 'pending'}>
                    {doc.status}
                  </Badge>

                  {doc.status !== 'SIGNED' && (
                    <Button
                      variant="hr"
                      size="xs"
                      onClick={() => signDocMutation.mutate(doc.id)}
                      isLoading={signDocMutation.isPending}
                    >
                      E-Sign Document
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      )}

      {/* 5. ONBOARDING BUILDER TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <OnboardingBuilder />
        </div>
      )}
    </div>
  );
};
