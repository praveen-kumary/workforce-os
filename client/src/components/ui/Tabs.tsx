import React from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badge?: number | string;
}

interface TabsProps {
  tabs: TabItem[];
  active?: string;
  activeTab?: string;
  onChange: (id: string) => void;
  style?: React.CSSProperties;
  module?: string;
}

/**
 * Pill-style tabs — Awe Design Studio pattern
 * Active = blue pill, Inactive = gray text
 */
export function Tabs({ tabs, active, activeTab, onChange, style }: TabsProps) {
  const currentActive = active || activeTab || (tabs[0] ? tabs[0].id : '');
  return (
    <div style={{
      display: 'inline-flex',
      gap: 2,
      padding: 4,
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-md)',
      ...style,
    }}>
      {tabs.map(tab => {
        const isActive = currentActive === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 600 : 500,
              fontFamily: 'var(--font-sans)',
              color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.005em',
              outline: 'none',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.icon}
            {tab.label}
            {(tab.count !== undefined || tab.badge !== undefined) && (
              <span style={{
                padding: '1px 7px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                color: isActive ? '#FFFFFF' : 'var(--text-tertiary)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                lineHeight: '18px',
                minWidth: 20,
                textAlign: 'center' as const,
              }}>
                {tab.badge ?? tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
