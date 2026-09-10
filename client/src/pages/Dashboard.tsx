import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Laptop, Calendar,
  ArrowUpRight, Workflow, UserPlus,
  CheckCircle, Receipt, ClipboardList, CalendarDays, ChevronRight,
  Circle, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { coreApi, approvalsApi, projectsApi, workplaceApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { KPICard } from '../components/ui/KPICard';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};


function QuickAction({ icon: Icon, label, desc, color, bg, onClick }: any) {
  return (
    <motion.div
      variants={fadeUp}
      className="card card-interactive card-compact"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={color} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{desc}</div>
      </div>
      <ArrowUpRight size={14} color="var(--text-quaternary)" />
    </motion.div>
  );
}

const customTooltipStyle = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.75rem',
  boxShadow: 'var(--shadow-xl)',
  color: 'var(--text-primary)',
  padding: '8px 12px',
};

function formatApprovalDate(dateStr?: string) {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // 1. Stats query
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => coreApi.getStats(),
    retry: 1,
    retryDelay: 1000,
    staleTime: 60_000,
  });

  // 2. Approvals query
  const { data: approvals = [], isLoading: isApprovalsLoading } = useQuery({
    queryKey: ['dashboard-approvals'],
    queryFn: () => approvalsApi.getApprovals(),
    retry: 1,
    retryDelay: 1000,
  });

  // 3. Assigned tasks query
  const { data: tasks = [], isLoading: isTasksLoading } = useQuery({
    queryKey: ['dashboard-tasks', user?.id],
    queryFn: () => projectsApi.getTasks(),
    retry: 1,
    retryDelay: 1000,
  });

  // 4. Audit feed query
  const { data: auditData, isLoading: isAuditLoading } = useQuery({
    queryKey: ['dashboard-audit'],
    queryFn: () => coreApi.getAuditLogs({ page: 1 }),
    retry: 1,
    retryDelay: 1000,
  });

  // 5. Calendar events query
  const { data: calendarEvents = [], isLoading: isCalendarLoading } = useQuery({
    queryKey: ['dashboard-calendar'],
    queryFn: () => workplaceApi.getCalendarEvents(),
    retry: 1,
    retryDelay: 1000,
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const kpis = stats?.kpis;
  const trendData = stats?.trendData || [];

  const pendingTasksCount = tasks.filter((t) => t.status !== 'DONE').length;
  const pendingApprovalsCount = approvals.length;
  const todayEventsCount = calendarEvents.length;

  const auditList = Array.isArray(auditData) ? auditData : auditData?.logs || [];

  return (
    <div className="page-content">
      {/* ─── Executive Briefing Header (Modern Minimalist Linear/Stripe Style) ─── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{
          marginBottom: 'var(--space-5)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(99, 102, 241, 0.06) 100%)',
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--accent)',
              }}
            >
              Executive Workforce Overview
            </span>
            <span style={{ color: 'var(--border-strong)' }}>·</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--text-heading)',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {greeting}, {user?.firstName || 'Colleague'} 👋
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
            Real-time workforce intelligence across HR, IT, Finance, and Workplace operations.
          </p>
        </div>

        {/* Executive Action & Status Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
            <span>Systems Normal</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <ClipboardList size={13} color="var(--accent)" />
            <span><strong style={{ color: 'var(--text-primary)' }}>{pendingTasksCount}</strong> Tasks Active</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <CheckCircle size={13} color="var(--warning)" />
            <span><strong style={{ color: 'var(--text-primary)' }}>{pendingApprovalsCount}</strong> Pending Approvals</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Calendar size={13} color="var(--info)" />
            <span><strong style={{ color: 'var(--text-primary)' }}>{todayEventsCount}</strong> Events</span>
          </div>
        </div>
      </motion.div>

      {/* ─── KPI Metric Cards (Top Row) ─── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="kpi-grid"
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <KPICard
          label="Total Workforce"
          value={kpis?.totalEmployees}
          icon={<Users size={18} strokeWidth={2.2} />}
          color="var(--accent)"
          bg="var(--accent-subtle)"
          trend="+8% QTD"
          trendUp={true}
          isLoading={isStatsLoading}
          onClick={() => navigate('/directory')}
        />
        <KPICard
          label="Active Devices"
          value={kpis?.activeDevices}
          icon={<Laptop size={18} strokeWidth={2.2} />}
          color="var(--info)"
          bg="var(--info-subtle)"
          trend="100% Encrypted"
          isLoading={isStatsLoading}
          onClick={() => navigate('/it')}
        />
        <KPICard
          label="Active Automations"
          value={kpis?.activeWorkflows}
          icon={<Workflow size={18} strokeWidth={2.2} />}
          color="var(--success)"
          bg="var(--success-subtle)"
          trend="Real-time"
          trendUp={true}
          isLoading={isStatsLoading}
          onClick={() => navigate('/workflows')}
        />
        <KPICard
          label="Pending Leaves"
          value={kpis?.pendingLeaves}
          icon={<CalendarDays size={18} strokeWidth={2.2} />}
          color="var(--warning)"
          bg="var(--warning-subtle)"
          trend="Awaiting Review"
          isLoading={isStatsLoading}
          onClick={() => navigate('/leave')}
        />
      </motion.div>

      {/* ─── Main Content Grid: Chart + Approval Queue ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Headcount Growth Chart */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card card-flush">
          <div
            className="flex-between"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
                Workforce & Asset Velocity
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Active headcount vs. enrolled zero-trust endpoint devices
              </div>
            </div>
            <Link
              to="/analytics"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Analytics <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="employeeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="deviceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-quaternary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-quaternary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="employees"
                    name="Employees"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#employeeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="devices"
                    name="Devices"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fillOpacity={1}
                    fill="url(#deviceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Approvals Action Queue */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card card-flush">
          <div
            className="flex-between"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
                Approval Queue
              </div>
              <span className="badge badge-warning">{approvals.length}</span>
            </div>
            <Link
              to="/approvals"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Review all <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
            {isApprovalsLoading ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <Skeleton variant="text" width="100%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton variant="text" width="80%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton variant="text" width="90%" height={24} />
              </div>
            ) : approvals.length === 0 ? (
              <div style={{ padding: 'var(--space-6) 0' }}>
                <EmptyState
                  icon={<CheckCircle size={28} />}
                  title="Queue is Clear"
                  description="No pending expense, leave, or purchase approvals requiring review."
                />
              </div>
            ) : (
              approvals.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to="/approvals"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '9px var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background:
                        item.type === 'leave'
                          ? 'var(--info-subtle)'
                          : item.type === 'expense'
                          ? 'var(--warning-subtle)'
                          : 'var(--success-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.type === 'leave' ? (
                      <CalendarDays size={15} color="var(--info)" />
                    ) : item.type === 'expense' ? (
                      <Receipt size={15} color="var(--warning)" />
                    ) : (
                      <CheckCircle size={15} color="var(--success)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 650,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {item.requester} · {formatApprovalDate(item.submitted)}
                    </div>
                  </div>
                  {item.amount && (
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 750,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-heading)',
                      }}
                    >
                      {item.amount}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── Second Row: Tasks, Audit Feed, Calendar ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Assigned Tasks */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card card-flush">
          <div
            className="flex-between"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
              Assigned Tasks
            </div>
            <Link to="/tasks" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 650 }}>
              View all
            </Link>
          </div>
          <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
            {isTasksLoading ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <Skeleton variant="text" width="90%" height={20} style={{ marginBottom: 6 }} />
                <Skeleton variant="text" width="70%" height={20} />
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ padding: 'var(--space-4) 0' }}>
                <EmptyState
                  icon={<ClipboardList size={28} />}
                  title="No Tasks Assigned"
                  description="You are caught up on all assigned deliverables."
                />
              </div>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  to="/tasks"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '9px var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Circle
                    size={14}
                    color={task.status === 'DONE' ? 'var(--success)' : 'var(--text-tertiary)'}
                    strokeWidth={2}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {task.priority?.toUpperCase()} · Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Soon'}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      task.status === 'DONE'
                        ? 'badge-success'
                        : task.status === 'IN_PROGRESS'
                        ? 'badge-info'
                        : task.status === 'REVIEW'
                        ? 'badge-warning'
                        : 'badge-neutral'
                    }`}
                    style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}
                  >
                    {task.status?.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Live Audit Log */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card card-flush">
          <div
            className="flex-between"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
              Recent Audit Log
            </div>
            <Link to="/audit" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 650 }}>
              Full Log
            </Link>
          </div>
          <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
            {isAuditLoading ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <Skeleton variant="text" width="90%" height={20} style={{ marginBottom: 6 }} />
                <Skeleton variant="text" width="70%" height={20} />
              </div>
            ) : auditList.length === 0 ? (
              <div style={{ padding: 'var(--space-4) 0' }}>
                <EmptyState
                  icon={<Activity size={28} />}
                  title="No Audit Records"
                  description="System activity will stream here in real-time."
                />
              </div>
            ) : (
              auditList.slice(0, 5).map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                    padding: '9px var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      marginTop: 6,
                      background: 'var(--accent)',
                      flexShrink: 0,
                      boxShadow: '0 0 6px var(--accent)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 550,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {log.action?.toUpperCase()}: {log.fieldName} updated
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                      By {log.changedBy} · {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Today's Timeline / Schedule */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card card-flush">
          <div
            className="flex-between"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
              Today&rsquo;s Timeline
            </div>
            <Link to="/calendar" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', fontWeight: 650 }}>
              Calendar
            </Link>
          </div>
          <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
            {isCalendarLoading ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <Skeleton variant="text" width="90%" height={20} style={{ marginBottom: 6 }} />
                <Skeleton variant="text" width="70%" height={20} />
              </div>
            ) : calendarEvents.length === 0 ? (
              <div style={{ padding: 'var(--space-4) 0' }}>
                <EmptyState
                  icon={<Calendar size={28} />}
                  title="No Scheduled Events"
                  description="Your calendar is open for focused work today."
                />
              </div>
            ) : (
              [...calendarEvents]
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .slice(0, 5)
                .map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--space-3)',
                      padding: '9px var(--space-2)',
                      borderRadius: 'var(--radius-md)',
                      transition: 'background 0.1s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/calendar')}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-2xs)',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                        minWidth: 62,
                        marginTop: 2,
                        fontWeight: 600,
                      }}
                    >
                      {ev.time || 'All Day'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                        {ev.location || 'Virtual Conference'}
                      </div>
                    </div>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                      {ev.type?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── Quick Actions Grid ─── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <QuickAction
          icon={UserPlus}
          label="Onboard Employee"
          desc="Zero-touch provisioning"
          color="var(--accent)"
          bg="var(--accent-subtle)"
          onClick={() => navigate('/onboarding/new')}
        />
        <QuickAction
          icon={Receipt}
          label="Submit Expense"
          desc="Receipt OCR auto-scan"
          color="var(--warning)"
          bg="var(--warning-subtle)"
          onClick={() => navigate('/expenses')}
        />
        <QuickAction
          icon={CalendarDays}
          label="Request Leave"
          desc="PTO & sick leave balances"
          color="var(--info)"
          bg="var(--info-subtle)"
          onClick={() => navigate('/leave')}
        />
        <QuickAction
          icon={Workflow}
          label="Workflow Studio"
          desc="Event-driven rules"
          color="var(--success)"
          bg="var(--success-subtle)"
          onClick={() => navigate('/workflows')}
        />
      </motion.div>
    </div>
  );
}
export default Dashboard;
