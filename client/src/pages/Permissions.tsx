import React, { useState } from 'react';
import { Shield, Lock, ChevronRight, CheckCircle, Save } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';

const INITIAL_ROLES = [
  { id: '1', name: 'Super Admin', description: 'Full access to all modules and settings', users: 3, permissions: 156, color: '#dc2626', system: true },
  { id: '2', name: 'HR Manager', description: 'Manage employees, leave, payroll, and benefits', users: 5, permissions: 82, color: '#7c3aed', system: false },
  { id: '3', name: 'Finance Manager', description: 'Manage payroll, expenses, invoices, and budgets', users: 4, permissions: 64, color: '#16a34a', system: false },
  { id: '4', name: 'Engineering Lead', description: 'Manage team, projects, and technical resources', users: 7, permissions: 45, color: '#2563eb', system: false },
  { id: '5', name: 'Sales Manager', description: 'Manage CRM, deals, customers, and pipeline', users: 5, permissions: 48, color: '#d97706', system: false },
  { id: '6', name: 'Employee', description: 'Self-service access to personal information', users: 31, permissions: 22, color: '#6366f1', system: true },
  { id: '7', name: 'IT Admin', description: 'Manage devices, apps, security, and infrastructure', users: 4, permissions: 72, color: '#0891b2', system: false },
];

const MODULES = ['People', 'Finance', 'IT', 'CRM', 'Projects', 'Communication', 'Analytics', 'Workplace'];

export function Permissions() {
  const [selectedRole, setSelectedRole] = useState<string>('1');
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  const togglePermission = (mod: string, perm: string) => {
    const key = `${selectedRole}-${mod}-${perm}`;
    setMatrix((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isGranted = (mod: string, perm: string) => {
    const key = `${selectedRole}-${mod}-${perm}`;
    if (matrix[key] !== undefined) return matrix[key];
    if (selectedRole === '1') return true;
    if (perm === 'View') return true;
    if (selectedRole === '6') return perm === 'View';
    return perm !== 'Delete';
  };

  const handleSave = () => {
    addToast({ title: 'Role Permissions Saved', description: 'Access control policies updated across all services.' });
  };

  const currentRole = INITIAL_ROLES.find((r) => r.id === selectedRole) || INITIAL_ROLES[0];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles & Access Control</h1>
          <p className="page-subtitle">
            {INITIAL_ROLES.length} predefined security roles · Granular RBAC permission matrices
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={14} /> Save Permission Matrix
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-4)' }}>
        {/* Roles List */}
        <div className="card card-flush">
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 650 }}>Configured Roles</span>
          </div>
          {INITIAL_ROLES.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                background: selectedRole === role.id ? 'var(--accent-subtle)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-md)',
                  background: `${role.color}14`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={15} color={role.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{role.name}</span>
                  {role.system && (
                    <span
                      style={{
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        color: 'var(--text-quaternary)',
                        background: 'var(--bg-tertiary)',
                        padding: '1px 4px',
                        borderRadius: 3,
                      }}
                    >
                      SYSTEM
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)' }}>
                  {role.users} active assignees
                </div>
              </div>
              <ChevronRight size={14} color="var(--text-quaternary)" />
            </div>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="card card-flush">
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 650 }}>
              {currentRole.name} — Access Policy Matrix
            </span>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
              Click any permission cell to toggle
            </span>
          </div>

          <div style={{ padding: 'var(--space-2)' }}>
            {MODULES.map((mod) => (
              <div
                key={mod}
                style={{
                  padding: 'var(--space-3) var(--space-3)',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {mod} Module
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
                  {['View', 'Create', 'Edit', 'Delete'].map((perm) => {
                    const granted = isGranted(mod, perm);
                    return (
                      <div
                        key={perm}
                        onClick={() => togglePermission(mod, perm)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: granted ? 'var(--success-bg)' : 'var(--bg-secondary)',
                          fontSize: 'var(--text-2xs)',
                          fontWeight: 650,
                          color: granted ? 'var(--success-text)' : 'var(--text-quaternary)',
                          cursor: 'pointer',
                          border: `1px solid ${granted ? 'var(--success)' : 'var(--border)'}`,
                          transition: 'all 0.1s',
                        }}
                      >
                        {granted ? <CheckCircle size={12} /> : <Lock size={12} />}
                        {perm}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default Permissions;
