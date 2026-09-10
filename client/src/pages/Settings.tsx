import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toaster';
import { coreApi } from '../lib/api';
import {
  Save, Building2, Globe, MessageSquare, Zap, Clock,
  CreditCard, Shield, Check,
} from 'lucide-react';

const fetchSettings = () => coreApi.getSettings();

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--bg-tertiary)',
        position: 'relative', transition: 'background 0.2s',
        boxShadow: 'var(--shadow-inner)',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: 10,
        background: 'white', boxShadow: 'var(--shadow-sm)',
        transition: 'left 0.2s var(--ease-spring)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Check size={10} color="var(--accent)" strokeWidth={3} />}
      </span>
    </button>
  );
}

function SettingRow({ icon: Icon, iconBg, iconColor, title, desc, children }: any) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 12,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: iconBg, color: iconColor,
        }}>
          <Icon size={18} />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2, maxWidth: 420 }}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

export const Settings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['core-settings'],
    queryFn: fetchSettings,
  });

  const [formData, setFormData] = useState({
    companyName: 'Acme Technologies',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    currency: 'USD',
    slackIntegration: false,
    googleWorkspace: false,
    autoProvisionIT: true,
    autoRunPayroll: false,
  });

  React.useEffect(() => {
    if (settings) {
      setFormData((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => coreApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['core-settings'] });
      toast('Settings updated successfully!', 'success');
    },
    onError: () => {
      toast('Failed to update settings', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: '0.875rem',
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
    border: '1.5px solid var(--border-strong)', borderRadius: 10,
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-heading)' }}>
            Settings
          </h1>
          <Badge variant="accent">Admin</Badge>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
          Manage your workspace configuration, automations, and integrations.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Company Information */}
        <Card style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <Building2 size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>Organization</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Company Name</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Default Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                style={inputStyle}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                style={inputStyle}
              >
                <option value="UTC">UTC (Universal Time)</option>
                <option value="America/New_York">Eastern (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific (US & Canada)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Date Format</label>
              <select
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                style={inputStyle}
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Automations */}
        <Card style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <Zap size={18} color="var(--warning)" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>Automations</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SettingRow
              icon={Zap} iconBg="var(--warning-bg)" iconColor="var(--warning)"
              title="Auto-Provision IT on Hire"
              desc="Automatically allocate laptops and create SSO accounts when a new employee is created."
            >
              <ToggleSwitch checked={formData.autoProvisionIT} onChange={(v) => setFormData({ ...formData, autoProvisionIT: v })} />
            </SettingRow>

            <SettingRow
              icon={CreditCard} iconBg="var(--success-bg)" iconColor="var(--success)"
              title="Auto-Run Monthly Payroll"
              desc="Automatically process payroll on the last business day of each month."
            >
              <ToggleSwitch checked={formData.autoRunPayroll} onChange={(v) => setFormData({ ...formData, autoRunPayroll: v })} />
            </SettingRow>

            <SettingRow
              icon={MessageSquare} iconBg="var(--info-bg)" iconColor="var(--info)"
              title="Slack Notifications"
              desc="Send hire welcomes, leave approvals, and expense alerts to Slack channels."
            >
              <ToggleSwitch checked={formData.slackIntegration} onChange={(v) => setFormData({ ...formData, slackIntegration: v })} />
            </SettingRow>

            <SettingRow
              icon={Globe} iconBg="#f0fdf4" iconColor="#16a34a"
              title="Google Workspace Sync"
              desc="Keep Google Admin directory synchronized with the employee directory."
            >
              <ToggleSwitch checked={formData.googleWorkspace} onChange={(v) => setFormData({ ...formData, googleWorkspace: v })} />
            </SettingRow>
          </div>
        </Card>

        {/* Security */}
        <Card style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <Shield size={18} color="var(--error)" />
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>Security & Compliance</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SettingRow
              icon={Shield} iconBg="var(--error-bg)" iconColor="var(--error)"
              title="Two-Factor Authentication"
              desc="Require 2FA for all users with admin or manager roles."
            >
              <Badge variant="success" dot>Enabled</Badge>
            </SettingRow>

            <SettingRow
              icon={Clock} iconBg="var(--info-bg)" iconColor="var(--info)"
              title="Session Timeout"
              desc="Automatically log out inactive users after a set period."
            >
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>30 minutes</span>
            </SettingRow>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={updateMutation.isPending}
            leftIcon={<Save size={15} />}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
