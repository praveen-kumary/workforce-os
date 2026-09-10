import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Laptop,
  KeyRound,
  ShieldCheck,
  LifeBuoy,
  Lock,
  Unlock,
  Trash2,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { KPICard } from '../components/ui/KPICard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toaster';
import { Modal } from '../components/ui/Modal';
import { itApi } from '../lib/api';

const fetchDevices = () => itApi.getDevices();
const fetchAccesses = () => itApi.getAppAccesses();
const fetchCatalog = () => itApi.getAppCatalog();
const fetchPolicies = () => itApi.getSecurityPolicies();
const fetchTickets = () => itApi.getTickets();

const listVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.4 } }
};

export const ITDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('devices');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: 'HARDWARE', priority: 'MEDIUM' });

  // Queries
  const { data: devices = [], isLoading: loadingDevices } = useQuery({ queryKey: ['it-devices'], queryFn: fetchDevices, retry: 1, retryDelay: 1000 });
  const { data: accesses = [], isLoading: loadingAccess } = useQuery({ queryKey: ['it-accesses'], queryFn: fetchAccesses, retry: 1, retryDelay: 1000 });
  const { data: catalog = [] } = useQuery({ queryKey: ['it-catalog'], queryFn: fetchCatalog, retry: 1, retryDelay: 1000 });
  const { data: policies = [] } = useQuery({ queryKey: ['it-policies'], queryFn: fetchPolicies, retry: 1, retryDelay: 1000 });
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({ queryKey: ['it-tickets'], queryFn: fetchTickets, retry: 1, retryDelay: 1000 });

  // Mutations
  const lockDeviceMutation = useMutation({
    mutationFn: (id: string) => itApi.lockDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-devices'] });
      toast('Device remotely locked with MDM PIN!', 'warning');
    },
  });

  const unlockDeviceMutation = useMutation({
    mutationFn: (id: string) => itApi.unlockDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-devices'] });
      toast('Device unlocked and restored to active pool', 'success');
    },
  });

  const wipeDeviceMutation = useMutation({
    mutationFn: (id: string) => itApi.wipeDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-devices'] });
      toast('Remote cryptographic data wipe command dispatched!', 'error');
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: () => itApi.createTicket({ ...newTicket, employeeId: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['it-tickets'] });
      toast('Support ticket dispatched to IT queue!', 'success');
      setShowTicketModal(false);
      setNewTicket({ title: '', description: '', category: 'HARDWARE', priority: 'MEDIUM' });
    },
  });

  const itTabs = [
    { id: 'devices', label: 'Hardware Fleet MDM', icon: <Laptop size={15} />, badge: devices.length || undefined },
    { id: 'apps', label: 'App Catalog & 1-Click SSO', icon: <KeyRound size={15} />, badge: catalog.length || undefined },
    { id: 'security', label: 'Security & Zero-Trust Policies', icon: <ShieldCheck size={15} />, badge: policies.length || undefined },
    { id: 'tickets', label: 'Support Desk Tickets', icon: <LifeBuoy size={15} />, badge: tickets.filter((t: any) => t.status === 'OPEN').length || undefined },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">
              IT & Security Cloud
            </h1>
            <Badge variant="it">Zero-Touch Provisioning</Badge>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Manage corporate hardware inventory, remote MDM controls, app provisioning, and zero-trust policies.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="it"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowTicketModal(true)}
          >
            Create Support Ticket
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <KPICard
          title="Fleet Devices"
          value={loadingDevices ? undefined : devices.length}
          trend={2.4}
          trendLabel="Active & Encrypted"
          icon={<Laptop size={18} />}
          color="var(--info)"
          bg="var(--info-subtle)"
          isLoading={loadingDevices}
        />
        <KPICard
          title="Active App Accesses"
          value={loadingAccess ? undefined : accesses.filter((a: any) => a.status === 'ACTIVE').length}
          trend={5.1}
          trendLabel="Managed Single Sign-On"
          icon={<KeyRound size={18} />}
          color="var(--accent)"
          bg="var(--accent-subtle)"
          isLoading={loadingAccess}
        />
        <KPICard
          title="Security Attestation"
          value={policies.length > 0 ? '100%' : '0%'}
          trend={0}
          trendLabel="SOC2 / ISO Compliant"
          icon={<ShieldCheck size={18} />}
          color="var(--success)"
          bg="var(--success-subtle)"
        />
        <KPICard
          title="Open Tickets"
          value={loadingTickets ? undefined : tickets.filter((t: any) => t.status === 'OPEN').length}
          trend={-12}
          trendLabel="Avg 18m Resolution"
          icon={<LifeBuoy size={18} />}
          color="var(--warning)"
          bg="var(--warning-subtle)"
          isLoading={loadingTickets}
        />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Tabs tabs={itTabs} activeTab={activeTab} onChange={setActiveTab} module="it" />
      </div>

      {/* 1. HARDWARE FLEET TAB */}
      {activeTab === 'devices' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>Corporate Hardware Fleet (MDM Enrolled)</h3>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent)' }}>100% FileVault Encrypted</span>
          </div>

          <motion.div variants={listVariant} initial="hidden" animate="show" style={{ borderColor: 'var(--border-light)' }}>
            {devices.map((dev: any) => (
              <motion.div key={dev.id} variants={itemVariant} style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--info-bg)', color: 'var(--accent)' }}>
                    <Laptop size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{dev.make} {dev.model}</p>
                      <Badge variant={dev.status === 'ACTIVE' ? 'success' : dev.status === 'LOCKED' ? 'warning' : 'danger'}>
                        {dev.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      SN: {dev.serialNumber} • {dev.osName} • Battery: {dev.batteryHealth}%
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      Assigned to: <strong style={{ color: 'var(--accent)' }}>{dev.employee ? `${dev.employee.firstName} ${dev.employee.lastName}` : 'Unassigned Pool'}</strong>
                    </p>
                  </div>
                </div>

                {/* Remote MDM Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {dev.status === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={<Lock size={14} style={{ color: 'var(--warning)' }} />}
                      onClick={() => lockDeviceMutation.mutate(dev.id)}
                      isLoading={lockDeviceMutation.isPending}
                    >
                      Remote Lock
                    </Button>
                  ) : (
                    <Button
                      variant="it"
                      size="xs"
                      leftIcon={<Unlock size={14} />}
                      onClick={() => unlockDeviceMutation.mutate(dev.id)}
                      isLoading={unlockDeviceMutation.isPending}
                    >
                      Unlock
                    </Button>
                  )}

                  <Button
                    variant="danger"
                    size="xs"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => wipeDeviceMutation.mutate(dev.id)}
                    isLoading={wipeDeviceMutation.isPending}
                  >
                    Remote Wipe
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      )}

      {/* 2. APP CATALOG & SSO TAB */}
      {activeTab === 'apps' && (
        <motion.div variants={listVariant} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {catalog.map((app: any) => (
            <motion.div key={app.id} variants={itemVariant}>
              <Card className="p-5 space-y-4 transition-all hover:shadow-lg" style={{ height: '100%' }}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                      {app.category}
                    </span>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{app.name}</h3>
                  </div>
                  <Badge variant="it">SAML 2.0 SSO</Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                    <span>Seats Assigned</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{app.activeSeats} / {app.totalSeats}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.round((app.activeSeats / app.totalSeats) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
                  <span>License: <strong className="font-mono" style={{ color: 'var(--success)' }}>${app.licenseCost}/mo</strong></span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>1-Click Provisioning</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* 3. SECURITY POLICIES TAB */}
      {activeTab === 'security' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Zero-Trust Fleet Security Policies</h3>
            <Badge variant="success">SOC-2 Type II Certified</Badge>
          </div>

          <motion.div variants={listVariant} initial="hidden" animate="show" className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {policies.map((pol: any) => (
              <motion.div key={pol.id} variants={itemVariant} className="p-4 flex items-center justify-between transition-colors hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{pol.name}</p>
                    <p className="text-xs max-w-xl" style={{ color: 'var(--text-secondary)' }}>{pol.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--success)' }}>{pol.complianceRate}% Compliance</span>
                  <Badge variant={pol.enforced ? 'success' : 'inactive'}>
                    {pol.enforced ? 'Enforced' : 'Advisory'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      )}

      {/* 4. SUPPORT DESK TAB */}
      {activeTab === 'tickets' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>IT Helpdesk & Equipment Requests</h3>
            <Button
              variant="it"
              size="xs"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowTicketModal(true)}
            >
              New Ticket
            </Button>
          </div>

          <motion.div variants={listVariant} initial="hidden" animate="show" className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {tickets.map((t: any) => (
              <motion.div key={t.id} variants={itemVariant} className="p-4 flex items-center justify-between transition-colors hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    <LifeBuoy size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Category: {t.category} • Priority: <span className="font-bold" style={{ color: 'var(--warning)' }}>{t.priority}</span> • Requester: {t.employee?.firstName} {t.employee?.lastName}
                    </p>
                  </div>
                </div>

                <Badge variant={t.status === 'OPEN' ? 'warning' : t.status === 'IN_PROGRESS' ? 'info' : 'success'}>
                  {t.status.replace('_', ' ')}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <Modal
          title="Submit IT Support Ticket"
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
        >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTicketMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Request 4K Monitor and Laptop Stand"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide setup specifications or issue details..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="input w-full"
                  >
                    <option value="HARDWARE">Hardware & Peripherals</option>
                    <option value="SOFTWARE">SaaS App Access</option>
                    <option value="SECURITY">Security / Token Reset</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="input w-full"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Blocker)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <Button variant="outline" type="button" onClick={() => setShowTicketModal(false)}>
                  Cancel
                </Button>
                <Button variant="it" type="submit" isLoading={createTicketMutation.isPending}>
                  Submit Ticket
                </Button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
};
