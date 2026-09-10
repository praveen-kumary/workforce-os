import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', variant = 'danger', loading,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: 'var(--error-bg)', color: 'var(--error)', iconBg: 'var(--error-bg)' },
    warning: { bg: 'var(--warning-bg)', color: 'var(--warning)', iconBg: 'var(--warning-bg)' },
    info: { bg: 'var(--info-bg)', color: 'var(--info)', iconBg: 'var(--info-bg)' },
  }[variant];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-primary)', borderRadius: 14,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%', maxWidth: 400, padding: 24,
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: colors.iconBg, marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} color={colors.color} />
          </div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>{title}</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
