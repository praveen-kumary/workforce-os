import React from 'react';
import { Button } from './Button';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  module?: 'primary' | 'hr' | 'it' | 'finance' | 'workflow';
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  module = 'primary',
  className,
  style,
}) => {
  const accentColors = {
    primary: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.25)', color: '#818cf8' },
    hr: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.25)', color: '#c084fc' },
    it: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.25)', color: '#22d3ee' },
    finance: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', color: '#34d399' },
    workflow: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24' },
  }[module];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`empty-state ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            background: accentColors.bg,
            border: `1px solid ${accentColors.border}`,
            color: accentColors.color,
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text-tertiary)',
          maxWidth: 360,
          marginTop: 6,
          marginBottom: 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <div style={{ marginTop: 20 }}>
          <Button variant={module} size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
