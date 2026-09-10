import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
  variant?: string;
  count?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
  variant,
  count = 1,
  className,
}: SkeletonProps) {
  const computedRadius = variant === 'circle' ? '50%' : borderRadius;
  const classes = ['shimmer', className].filter(Boolean).join(' ');

  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={classes}
            style={{ width, height, borderRadius: computedRadius, ...style }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={classes}
      style={{ width, height, borderRadius: computedRadius, ...style }}
    />
  );
}

interface SkeletonRowProps {
  count?: number;
  height?: number;
  gap?: number;
}

export function SkeletonRows({ count = 3, height = 48, gap = 8 }: SkeletonRowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} borderRadius={8} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid-stats">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={100} borderRadius={12} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-content" style={{ animation: 'fadeIn 0.15s ease' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width={180} height={28} borderRadius={6} />
          <Skeleton width={260} height={14} borderRadius={4} />
        </div>
        <Skeleton width={120} height={36} borderRadius={8} />
      </div>
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={110} borderRadius={12} />
        ))}
      </div>
      <Skeleton height={280} borderRadius={12} />
    </div>
  );
}
