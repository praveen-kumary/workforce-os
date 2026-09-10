import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'it' | 'finance' | 'workflow' | 'hr';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/* ── Flat solid colors — NO gradients (Awe Design Style) ── */
const VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#FFFFFF',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-xs)',
  },
  secondary: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border)',
    boxShadow: 'var(--shadow-xs)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    borderColor: 'transparent',
  },
  danger: {
    background: 'var(--error)',
    color: '#FFFFFF',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-xs)',
  },
  success: {
    background: 'var(--success)',
    color: '#FFFFFF',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-xs)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--text-primary)',
    borderColor: 'var(--border)',
  },
  it: {
    background: 'var(--info)',
    color: '#FFFFFF',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-xs)',
  },
  finance: {
    background: 'var(--success)',
    color: '#FFFFFF',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-xs)',
  },
  workflow: {
    background: '#7C3AED',
    color: '#FFFFFF',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-xs)',
  },
  hr: {
    background: 'var(--accent)',
    color: '#FFFFFF',
    borderColor: 'transparent',
    boxShadow: 'var(--shadow-xs)',
  },
};

const SIZES: Record<ButtonSize, React.CSSProperties> = {
  xs: { padding: '5px 12px', fontSize: 'var(--text-xs)' },
  sm: { padding: '6px 14px', fontSize: 'var(--text-xs)' },
  md: { padding: '8px 16px', fontSize: 'var(--text-sm)' },
  lg: { padding: '10px 22px', fontSize: 'var(--text-base)' },
};

export function Button({
  variant = 'primary', size = 'md', icon, leftIcon, rightIcon, loading, isLoading, disabled,
  children, className, type = 'button', onClick, style,
}: ButtonProps) {
  const isLoadingState = loading || isLoading;
  return (
    <button
      type={type}
      disabled={disabled || isLoadingState}
      className={className}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        border: '1px solid',
        borderRadius: 'var(--radius-md)',
        cursor: disabled || isLoadingState ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        whiteSpace: 'nowrap' as const,
        transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        outline: 'none',
        userSelect: 'none' as const,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '-0.005em',
        opacity: disabled || isLoadingState ? 0.5 : 1,
        position: 'relative' as const,
        ...VARIANTS[variant],
        ...SIZES[size],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isLoadingState) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.filter = 'brightness(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.filter = 'none';
      }}
      onMouseDown={(e) => {
        if (!disabled && !isLoadingState) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px) scale(1)';
      }}
    >
      {isLoadingState ? (
        <div style={{
          width: 14, height: 14, border: '2px solid currentColor',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite', opacity: 0.7,
        }} />
      ) : (leftIcon || icon)}
      {children}
      {rightIcon}
    </button>
  );
}
