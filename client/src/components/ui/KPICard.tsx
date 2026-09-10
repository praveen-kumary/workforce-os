import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Skeleton } from './SkeletonLoader';

interface KPICardProps {
  title?: string;
  label?: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number | string | { value: string; direction: 'up' | 'down' | 'neutral' };
  trendLabel?: string;
  trendUp?: boolean;
  color?: string;
  bg?: string;
  bgColor?: string;
  isLoading?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function KPICard({
  title, label, value, subtitle, icon,
  trend, trendLabel, trendUp,
  color = 'var(--accent)', bg, bgColor,
  isLoading, loading, onClick,
}: KPICardProps) {
  const displayLabel = label || title || '';
  const displayBg = bg || bgColor || 'var(--accent-subtle)';
  const isLoadingState = isLoading || loading;

  let trendDirection: 'up' | 'down' | 'neutral' | undefined;
  let trendText: string | undefined;

  if (trend !== undefined) {
    if (typeof trend === 'object') {
      trendDirection = trend.direction;
      trendText = trend.value;
    } else if (typeof trend === 'number') {
      trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
      trendText = `${trend > 0 ? '+' : ''}${trend}%`;
    } else {
      trendDirection = trendUp === true ? 'up' : trendUp === false ? 'down' : 'neutral';
      trendText = trend;
    }
  }

  const trendColor = trendDirection === 'up'
    ? 'var(--success-text)'
    : trendDirection === 'down'
      ? 'var(--error-text)'
      : 'var(--text-tertiary)';

  const trendBg = trendDirection === 'up'
    ? 'var(--success-subtle)'
    : trendDirection === 'down'
      ? 'var(--error-subtle)'
      : 'var(--bg-tertiary)';

  const TrendIcon = trendDirection === 'up'
    ? TrendingUp
    : trendDirection === 'down'
      ? TrendingDown
      : trendDirection === 'neutral'
        ? (typeof trend === 'string' ? Clock : Minus)
        : null;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: 'var(--space-5)',
        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: icon + trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: 'var(--radius-md)',
          background: displayBg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>

        {trendText && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 8px',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
            color: trendColor,
            background: trendBg,
          }}>
            {TrendIcon && <TrendIcon size={12} />}
            {trendText}
          </span>
        )}
      </div>

      {/* Large stat number */}
      {isLoadingState ? (
        <Skeleton variant="text" width="60%" height={36} style={{ marginBottom: 4 }} />
      ) : (
        <div style={{
          fontSize: 'var(--text-4xl)',
          fontWeight: 700,
          color: 'var(--text-heading)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          fontFamily: 'var(--font-heading)',
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
        </div>
      )}

      {/* Label */}
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        marginTop: 'var(--space-1)',
        fontWeight: 500,
      }}>
        {displayLabel}
      </div>

      {(subtitle || trendLabel) && (
        <div style={{
          fontSize: 'var(--text-2xs)',
          color: 'var(--text-tertiary)',
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {trendLabel && <span>{trendLabel}</span>}
          {trendLabel && subtitle && <span>•</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
