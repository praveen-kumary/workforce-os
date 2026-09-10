import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Filter, Clock, User, ChevronLeft, ChevronRight,
  Activity, ShieldCheck,
} from 'lucide-react';
import { coreApi } from '../lib/api';

const ACTION_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  create: { label: 'Created', bg: 'var(--success-bg)', color: 'var(--success)', border: 'var(--success-border)' },
  update: { label: 'Updated', bg: 'var(--accent-subtle)', color: 'var(--accent)', border: 'var(--accent-muted)' },
  offboard: { label: 'Offboarded', bg: 'var(--error-bg)', color: 'var(--error)', border: 'var(--error-border)' },
};

export const AuditTrail: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: () => coreApi.getAuditLogs({ page, action: actionFilter || undefined }),
  });

  const logs = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="page-content">
      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck size={24} color="var(--accent)" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="page-subtitle">
            Cryptographically timestamped change history across all employee profiles, roles, and device grants.
          </p>
        </div>

        <div className="page-actions">
          <div className="badge badge-success">
            <span className="badge-pulse badge-pulse-success" />
            <span>SOC 2 Compliant Log Store</span>
          </div>
        </div>
      </div>

      {/* ─── Filters & Search ─── */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>
            <Filter size={13} /> Filter Action:
          </div>
          {['', 'create', 'update', 'offboard'].map((action) => (
            <button
              key={action}
              onClick={() => {
                setActionFilter(action);
                setPage(1);
              }}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 650,
                cursor: 'pointer',
                background: actionFilter === action ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
                color: actionFilter === action ? 'var(--accent)' : 'var(--text-secondary)',
                border: actionFilter === action ? '1px solid var(--accent-muted)' : '1px solid var(--border)',
                transition: 'all 0.12s',
              }}
            >
              {action ? action.toUpperCase() : 'ALL ACTIONS'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Logs Feed ─── */}
      <div className="card card-flush">
        <div
          className="flex-between"
          style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-light)' }}
        >
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
            System Audit Events
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            Showing Page {page} of {totalPages}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="shimmer" style={{ height: 50, borderRadius: 'var(--radius-md)' }} />
            <div className="shimmer" style={{ height: 50, borderRadius: 'var(--radius-md)' }} />
            <div className="shimmer" style={{ height: 50, borderRadius: 'var(--radius-md)' }} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            <Activity size={32} color="var(--text-quaternary)" style={{ margin: '0 auto 12px' }} />
            No audit events found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map((log: any, i: number) => {
              const ab = ACTION_BADGE[log.action] || {
                label: log.action,
                bg: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: 'var(--border)',
              };
              return (
                <div
                  key={log.id}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    borderBottom: i < logs.length - 1 ? '1px solid var(--border-light)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-md)',
                      flexShrink: 0,
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: ab.bg,
                      color: ab.color,
                      border: `1px solid ${ab.border}`,
                    }}
                  >
                    <FileText size={14} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                      <span style={{ fontWeight: 800 }}>{ab.label}</span>{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>
                        {log.fieldName}
                      </span>
                      {' on '}
                      <span style={{ fontWeight: 700 }}>
                        {log.employee?.firstName} {log.employee?.lastName}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        marginTop: 4,
                        fontSize: '0.7rem',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {log.oldValue && (
                        <span>
                          <span style={{ color: 'var(--error)', textDecoration: 'line-through' }}>{log.oldValue}</span>
                          {' → '}
                          <span style={{ color: 'var(--success)', fontWeight: 650 }}>{log.newValue}</span>
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={11} /> {log.changedBy}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: ab.bg,
                      color: ab.color,
                      border: `1px solid ${ab.border}`,
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {log.action}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
export default AuditTrail;
