import React from 'react';

export interface StatusDotProps {
  status: 'online' | 'active' | 'warning' | 'offline' | 'error' | 'pending';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status = 'active',
  size = 'md',
  pulse = true,
  className,
  style,
}) => {
  const sizePx = {
    sm: 6,
    md: 8,
    lg: 10,
  }[size];

  const colorMap = {
    online: '#34d399',
    active: '#34d399',
    warning: '#fbbf24',
    offline: '#64748b',
    error: '#f43f5e',
    pending: '#22d3ee',
  };

  const dotColor = colorMap[status] || colorMap.active;

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: sizePx,
        height: sizePx,
        ...style,
      }}
    >
      {pulse && (
        <span
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: dotColor,
            opacity: 0.5,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
      <span
        style={{
          position: 'relative',
          width: sizePx,
          height: sizePx,
          borderRadius: '50%',
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}80`,
        }}
      />
    </span>
  );
};
