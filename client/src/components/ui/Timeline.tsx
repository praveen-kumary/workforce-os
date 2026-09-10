import React from 'react';
import { Clock } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: React.ReactNode;
  timestamp: string | Date;
  icon?: React.ReactNode;
  iconBg?: string;
  actor?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

function formatDate(date: string | Date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(d);
}

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
        No activity history available.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 8 }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', top: 12, bottom: 12, left: 23, width: 2,
        background: 'var(--border-light)', zIndex: 0
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
        {events.map((event) => (
          <div key={event.id} style={{ display: 'flex', gap: 16 }}>
            {/* Icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: event.iconBg || 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
              boxShadow: '0 0 0 4px var(--bg-primary)' // fake cutout effect over the line
            }}>
              {event.icon || <Clock size={14} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {event.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  {formatDate(event.timestamp)}
                </div>
              </div>
              
              {event.description && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {event.description}
                </div>
              )}
              
              {event.actor && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  By <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{event.actor}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
