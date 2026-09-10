import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent' | 'workflow' | 'inactive' | 'pending' | 'hr';

/* ── Flat status pills — Awe Design Style ── */
const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  success: {
    background: 'var(--success-subtle)',
    color: 'var(--success-text)',
  },
  warning: {
    background: 'var(--warning-subtle)',
    color: 'var(--warning-text)',
  },
  error: {
    background: 'var(--error-subtle)',
    color: 'var(--error-text)',
  },
  info: {
    background: 'var(--info-subtle)',
    color: 'var(--info-text)',
  },
  neutral: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
  },
  accent: {
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
  },
  pending: {
    background: 'var(--warning-subtle)',
    color: 'var(--warning-text)',
  },
  workflow: {
    background: 'var(--workflow-subtle)',
    color: 'var(--workflow-text)',
  },
  inactive: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-tertiary)',
  },
  hr: {
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
  },
};

const DEFAULT_STYLE: React.CSSProperties = {
  background: 'var(--bg-tertiary)',
  color: 'var(--text-secondary)',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  dot?: boolean;
  pulse?: boolean;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'neutral', dot = false, pulse, style }: BadgeProps) {
  const vs = VARIANT_STYLES[variant as BadgeVariant] || DEFAULT_STYLE;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap' as const,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      ...vs,
      ...style,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: vs.color as string, flexShrink: 0,
          animation: pulse ? 'pulse 2s ease-in-out infinite' : undefined,
          boxShadow: pulse ? `0 0 6px ${vs.color}` : undefined,
        }} />
      )}
      {children}
    </span>
  );
}
