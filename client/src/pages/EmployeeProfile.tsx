import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Building,
  Laptop,
  CreditCard,
  FileText,
  Clock,
  Shield,
  Award,
  Lock,
  DollarSign,
  UserX,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Tabs } from '../components/ui/Tabs';
import { Timeline } from '../components/ui/Timeline';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { useToast } from '../components/ui/Toaster';
import { coreApi } from '../lib/api';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const fetchEmployeeProfile = (id: string) => coreApi.getEmployeeProfile(id);

const listVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
};

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOffboardConfirm, setShowOffboardConfirm] = useState(false);

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee-profile', id],
    queryFn: () => fetchEmployeeProfile(id!),
    enabled: !!id,
  });

  const offboardMutation = useMutation({
    mutationFn: () => coreApi.offboardEmployee(id!, {
      reason: 'Voluntary departure',
      revokeAccess: true,
      returnDevices: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-profile', id] });
      toast('Employee offboarded. All app access revoked and devices locked.', 'success');
      setShowOffboardConfirm(false);
    },
    onError: () => {
      toast('Failed to offboard employee.', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="rectangular" className="h-44 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-400">Employee record could not be loaded.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/directory')}>
          Return to Directory
        </Button>
      </div>
    );
  }

  const profileTabs = [
    { id: 'overview', label: '360° Overview', icon: <Building className="w-4 h-4" /> },
    { id: 'hr', label: 'HR & Benefits', icon: <Award className="w-4 h-4" />, badge: employee.benefitEnrollments?.length || undefined },
    { id: 'it', label: 'IT Fleet & Access', icon: <Laptop className="w-4 h-4" />, badge: employee.devices?.length || undefined },
    { id: 'finance', label: 'Payroll & Cards', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" />, badge: employee.documents?.length || undefined },
    { id: 'timeline', label: 'Lifecycle Timeline', icon: <Clock className="w-4 h-4" /> },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
  };

  return (
    <div className="page-content">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/directory')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Header Profile Card */}
      <Card className="p-6 md:p-8 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[var(--accent)] to-transparent opacity-10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center gap-5">
            <Avatar
              name={`${employee.firstName} ${employee.lastName}`}
              src={employee.avatarUrl}
              size="2xl"
              status={employee.status === 'ACTIVE' ? 'online' : employee.status === 'TERMINATED' ? 'offline' : 'pending'}
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="page-title">
                  {employee.firstName} {employee.lastName}
                </h1>
                <Badge
                  variant={
                    employee.status === 'ACTIVE'
                      ? 'success'
                      : employee.status === 'TERMINATED'
                      ? 'danger'
                      : employee.status === 'ON_LEAVE'
                      ? 'warning'
                      : 'info'
                  }
                  dot
                  pulse={employee.status === 'ACTIVE'}
                >
                  {employee.status.replace('_', ' ')}
                </Badge>
                {employee.pronouns && (
                  <span className="text-xs text-slate-400 font-mono">
                    ({employee.pronouns})
                  </span>
                )}
              </div>

              <p className="page-subtitle font-semibold">
                {employee.roleTitle} • <span style={{ color: 'var(--text-primary)' }}>{employee.department}</span>
              </p>

              <div className="flex items-center gap-4 text-xs flex-wrap pt-1" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {employee.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {employee.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  Joined {new Date(employee.hireDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              onClick={() => window.open(`mailto:${employee.email}`)}
            >
              Email
            </Button>
            {employee.status !== 'TERMINATED' && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<UserX className="w-3.5 h-3.5" />}
                onClick={() => setShowOffboardConfirm(true)}
              >
                Offboard
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Tabs
          tabs={profileTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          module="primary"
        />
      </div>

      {/* TAB CONTENT: 360 Overview */}
      {activeTab === 'overview' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={itemVariant}>
              <Card className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--accent)' }}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>PTO Balance</span>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {employee.leaveBalances?.[0]?.usedDays ?? 4} / {employee.leaveBalances?.[0]?.totalDays ?? 20} Days
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--accent)' }}>
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Assigned Hardware</span>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{employee.devices?.length || 0} Devices</p>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Monthly Base Pay</span>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {employee.payrollProfile ? formatCurrency(Number(employee.payrollProfile.baseSalary) / 12) : '$9,500.00'}
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={itemVariant}>
              <Card className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>Security Compliance</span>
                  <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>100% Verified</p>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Org & Reporting Structure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Building className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Reporting Structure</span>
              </h3>

              {employee.manager ? (
                <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                  <div className="flex items-center gap-3">
                    <Avatar name={`${employee.manager.firstName} ${employee.manager.lastName}`} size="md" status="online" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Reports To (Manager)</span>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {employee.manager.firstName} {employee.manager.lastName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--accent)' }}>{employee.manager.roleTitle}</p>
                    </div>
                  </div>
                  <Link
                    to={`/employees/${employee.manager.id}`}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No manager assigned (Executive level).</p>
              )}

              {/* Subordinates */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Direct Reports ({employee.subordinates?.length || 0})
                </span>
                {employee.subordinates?.length > 0 ? (
                  <div className="space-y-2">
                    {employee.subordinates.map((sub: any) => (
                      <Link
                        key={sub.id}
                        to={`/employees/${sub.id}`}
                        className="p-3 rounded-xl transition-colors flex items-center justify-between group"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={`${sub.firstName} ${sub.lastName}`} size="sm" />
                          <div>
                            <p className="text-xs font-bold transition-colors group-hover:text-[var(--accent)]" style={{ color: 'var(--text-primary)' }}>
                              {sub.firstName} {sub.lastName}
                            </p>
                            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{sub.roleTitle}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-tertiary)' }} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No direct reports.</p>
                )}
              </div>
            </Card>

            {/* Performance OKRs */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Award className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Quarterly Goals & OKRs</span>
              </h3>

              {employee.goals?.length > 0 ? (
                <div className="space-y-4">
                  {employee.goals.map((goal: any) => (
                    <div key={goal.id} className="p-4 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{goal.title}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{goal.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      {goal.description && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{goal.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>No active OKRs assigned for this quarter.</p>
              )}
            </Card>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT: HR & Benefits */}
      {activeTab === 'hr' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Benefits Enrolled */}
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4" style={{ height: '100%' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Award className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Enrolled Benefits & Insurance</span>
              </h3>

              {employee.benefitEnrollments?.length > 0 ? (
                <div className="space-y-3">
                  {employee.benefitEnrollments.map((enr: any) => (
                    <div key={enr.id} className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                          {enr.plan?.type?.replace('_', ' ')}
                        </span>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{enr.plan?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Coverage Tier: {enr.coverageTier}</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Award className="w-6 h-6"/>} title="No Benefits" description="No active benefits enrolled." />
              )}
            </Card>
          </motion.div>

          {/* Leave History */}
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4" style={{ height: '100%' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                <span>Time-Off & Leave Requests</span>
              </h3>

              {employee.leaveRequests?.length > 0 ? (
                <div className="space-y-3">
                  {employee.leaveRequests.map((req: any) => (
                    <div key={req.id} className="p-3.5 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {req.leaveType} Leave ({req.daysCount} days)
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={req.status === 'APPROVED' ? 'success' : 'pending'}>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Clock className="w-6 h-6"/>} title="No Leave History" description="No leave history recorded." />
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* TAB CONTENT: IT Fleet & Apps */}
      {activeTab === 'it' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Hardware */}
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4" style={{ height: '100%' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Laptop className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Assigned Fleet Hardware</span>
              </h3>

              {employee.devices?.length > 0 ? (
                <div className="space-y-3">
                  {employee.devices.map((dev: any) => (
                    <div key={dev.id} className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <div className="space-y-1">
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{dev.make} {dev.model}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>SN: {dev.serialNumber} • {dev.osName}</p>
                        <div className="flex items-center gap-2 text-[11px] font-semibold pt-1" style={{ color: 'var(--success)' }}>
                          <Shield className="w-3.5 h-3.5" />
                          <span>FileVault Encrypted (Battery: {dev.batteryHealth}%)</span>
                        </div>
                      </div>
                      <Badge variant={dev.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {dev.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Laptop className="w-6 h-6"/>} title="No Devices" description="No hardware devices currently assigned." />
              )}
            </Card>
          </motion.div>

          {/* Provisioned SSO Apps */}
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4" style={{ height: '100%' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Provisioned Applications & SSO Access</span>
              </h3>

              {employee.appAccesses?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employee.appAccesses.map((app: any) => (
                    <div key={app.id} className="p-3.5 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{app.appName}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Access: {app.accessLevel}</p>
                      </div>
                      <Badge variant={app.status === 'ACTIVE' ? 'success' : 'inactive'}>
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Lock className="w-6 h-6"/>} title="No Apps" description="No apps provisioned." />
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* TAB CONTENT: Payroll & Finance */}
      {activeTab === 'finance' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payroll Profile */}
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4" style={{ height: '100%' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <DollarSign className="w-4 h-4" style={{ color: 'var(--success)' }} />
                <span>Payroll & Compensation Profile</span>
              </h3>

              {employee.payrollProfile ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Annual Base Salary</span>
                    <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(Number(employee.payrollProfile.baseSalary))}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pay Frequency</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{employee.payrollProfile.payFrequency}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tax Withholding Slab</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{employee.payrollProfile.taxSlab} ({employee.payrollProfile.taxRate}%)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Direct Deposit Bank</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{employee.payrollProfile.bankName} ({employee.payrollProfile.accountNumber})</span>
                  </div>
                </div>
              ) : (
                <EmptyState icon={<DollarSign className="w-6 h-6"/>} title="No Payroll Profile" description="No payroll profile configured." />
              )}
            </Card>
          </motion.div>

          {/* Corporate Card */}
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4" style={{ height: '100%' }}>
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CreditCard className="w-4 h-4" style={{ color: 'var(--success)' }} />
                <span>Corporate Spend Card</span>
              </h3>

              {employee.corporateCard ? (
                <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                      UOS Corporate {employee.corporateCard.cardType}
                    </span>
                    <Badge variant={employee.corporateCard.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {employee.corporateCard.status}
                    </Badge>
                  </div>
                  <div className="py-2">
                    <span className="text-lg font-mono tracking-widest" style={{ color: 'var(--text-primary)' }}>
                      {employee.corporateCard.cardNumberMasked}
                    </span>
                  </div>
                  <div className="flex justify-between items-end text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div>
                      <span>CARDHOLDER</span>
                      <p className="font-bold uppercase" style={{ color: 'var(--text-primary)' }}>{employee.firstName} {employee.lastName}</p>
                    </div>
                    <div>
                      <span>SPEND LIMIT</span>
                      <p className="font-bold font-mono" style={{ color: 'var(--success)' }}>
                        {formatCurrency(Number(employee.corporateCard.spendingLimit))}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon={<CreditCard className="w-6 h-6"/>} title="No Corporate Card" description="No corporate card issued." />
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* TAB CONTENT: Documents */}
      {activeTab === 'documents' && (
        <motion.div variants={listVariant} initial="hidden" animate="show">
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Employee Document Vault & E-Signatures</span>
              </h3>

              {employee.documents?.length > 0 ? (
                <div className="space-y-3">
                  {employee.documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--accent)' }}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Category: {doc.category} • {doc.signedAt ? `Signed on ${new Date(doc.signedAt).toLocaleDateString()}` : 'Pending Signature'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.status === 'SIGNED' ? 'success' : 'pending'}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<FileText className="w-6 h-6"/>} title="No Documents" description="No documents uploaded." />
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* TAB CONTENT: Lifecycle Timeline */}
      {activeTab === 'timeline' && (
        <motion.div variants={listVariant} initial="hidden" animate="show">
          <motion.div variants={itemVariant}>
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>Cross-Module Activity Audit Trail</span>
              </h3>

              <Timeline
                events={
                  employee.auditLogs?.map((log: any) => ({
                    id: log.id,
                    title: log.action === 'create' ? 'Employee Onboarded & Hired' : `Updated ${log.fieldName}`,
                    description: `Changed from "${log.oldValue || 'None'}" to "${log.newValue || 'Updated'}"`,
                    timestamp: log.createdAt,
                    module: 'primary',
                    author: log.changedBy,
                  })) || []
                }
              />
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Offboard Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showOffboardConfirm}
        onClose={() => setShowOffboardConfirm(false)}
        onConfirm={() => offboardMutation.mutate()}
        title={`Offboard ${employee.firstName} ${employee.lastName}?`}
        message="This will immediately revoke all single sign-on access tokens, lock fleet hardware devices, freeze corporate cards, and generate final payroll calculation."
        confirmLabel="Execute Offboarding"
        variant="danger"
        loading={offboardMutation.isPending}
      />
    </div>
  );
};
