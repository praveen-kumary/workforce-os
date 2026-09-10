import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: boolean;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', style = {}, padding = true, hover = false, glass = false, onClick }: CardProps) {
  return (
    <div
      className={`card ${hover ? 'card-interactive' : ''} ${glass ? 'card-glass' : ''} ${className}`}
      onClick={onClick}
      style={{
        padding: padding ? 'var(--space-5)' : 0,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
