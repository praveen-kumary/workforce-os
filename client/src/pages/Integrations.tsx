import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link2, Check, Zap, MessageSquare, Calendar, Mail, Shield, Database, Cloud, GitBranch } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';

const STORAGE_KEY = 'uos_enterprise_integrations_v1';

const INITIAL_INTEGRATIONS = [
  { id: 'slack', name: 'Slack Enterprise', desc: 'Send notifications, approvals, and incident alerts directly to Slack channels.', icon: MessageSquare, connected: true, color: '#4A154B', bg: '#f5f0f6' },
  { id: 'google', name: 'Google Workspace', desc: 'Sync corporate directory, calendar events, and email accounts automatically.', icon: Mail, connected: true, color: '#4285F4', bg: '#eff6ff' },
  { id: 'github', name: 'GitHub Enterprise', desc: 'Provision developer repositories and manage org team access automatically.', icon: GitBranch, connected: true, color: '#24292e', bg: '#f6f8fa' },
  { id: 'jira', name: 'Jira Software', desc: 'Sync project sprint deliverables, backlog tasks, and velocity metrics.', icon: Zap, connected: false, color: '#0052CC', bg: '#e8f0fe' },
  { id: 'okta', name: 'Okta / Azure AD SSO', desc: 'Enterprise SAML / OIDC single sign-on, SCIM user provisioning, and MFA.', icon: Shield, connected: true, color: '#007dc1', bg: '#e8f4fd' },
  { id: 'quickbooks', name: 'QuickBooks & NetSuite', desc: 'Sync bi-weekly payroll runs, vendor invoices, and tax ledgers with ERP.', icon: Database, connected: false, color: '#2CA01C', bg: '#f0fdf4' },
  { id: 'aws', name: 'AWS Cloud Console', desc: 'Cloud infrastructure cost management, IAM role binding, and compute alerts.', icon: Cloud, connected: true, color: '#FF9900', bg: '#fffbeb' },
  { id: 'calendar', name: 'Outlook & Google Calendar', desc: 'Sync 1:1 meetings, team out-of-office dates, and company holidays.', icon: Calendar, connected: true, color: '#0078D4', bg: '#eff6ff' },
];

export const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedMap: Record<string, boolean> = JSON.parse(saved);
        return INITIAL_INTEGRATIONS.map((item) => ({
          ...item,
          connected: parsedMap[item.id] !== undefined ? parsedMap[item.id] : item.connected,
        }));
      }
    } catch {
      // ignore
    }
    return INITIAL_INTEGRATIONS;
  });

  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const toggleConnection = (id: string, name: string, currentState: boolean) => {
    const nextState = !currentState;
    setIntegrations((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, connected: nextState } : item));
      try {
        const stateMap = updated.reduce((acc, curr) => {
          acc[curr.id] = curr.connected;
          return acc;
        }, {} as Record<string, boolean>);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateMap));
      } catch {
        // ignore
      }
      return updated;
    });

    addToast({
      title: nextState ? `Connected to ${name}` : `Disconnected from ${name}`,
      description: nextState
        ? 'OAuth credentials authorized. Webhooks and real-time event streaming active.'
        : 'Integration session tokens revoked.',
      type: nextState ? 'success' : 'info',
    });
  };

  const filtered = integrations.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const connectedCount = integrations.filter((i) => i.connected).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Enterprise Integrations</h1>
            <span className="badge badge-info">{connectedCount} Connected</span>
          </div>
          <p className="page-subtitle">
            Seamlessly bridge HR, IT, Finance, and Communication across your existing technology stack.
          </p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search integrations by name or service..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input"
        style={{ marginBottom: 20, maxWidth: 360 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.map((int) => (
          <Card key={int.id}>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: int.bg,
                  color: int.color,
                }}
              >
                <int.icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {int.name}
                </div>
              </div>
              {int.connected ? (
                <span className="badge badge-success">Connected</span>
              ) : (
                <span className="badge badge-neutral">Not connected</span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 14, lineHeight: 1.5 }}>
              {int.desc}
            </p>
            <Button
              variant={int.connected ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={int.connected ? <Check size={14} /> : <Link2 size={14} />}
              onClick={() => toggleConnection(int.id, int.name, int.connected)}
            >
              {int.connected ? 'Disconnect' : 'Connect Integration'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default Integrations;
