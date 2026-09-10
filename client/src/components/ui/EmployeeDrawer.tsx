import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SideDrawer } from './SideDrawer';
import { coreApi } from '../../lib/api';
import { Mail, Phone, MapPin, Building2, Briefcase, Calendar } from 'lucide-react';
import { Timeline } from './Timeline';

interface EmployeeDrawerProps {
  employeeId: string | null;
  onClose: () => void;
}

export function EmployeeDrawer({ employeeId, onClose }: EmployeeDrawerProps) {
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee-profile', employeeId],
    queryFn: () => coreApi.getEmployeeProfile(employeeId!),
    enabled: !!employeeId,
  });

  if (!employeeId) return null;

  return (
    <SideDrawer
      isOpen={!!employeeId}
      onClose={onClose}
      width={700}
      title={isLoading ? 'Loading...' : `${employee?.firstName} ${employee?.lastName}`}
      subtitle={employee?.roleTitle}
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Edit</button>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>View Full Profile</button>
        </div>
      }
    >
      {isLoading ? (
        <div className="v-stack" style={{ gap: 20 }}>
          <div className="shimmer" style={{ height: 120, borderRadius: 12 }} />
          <div className="shimmer" style={{ height: 300, borderRadius: 12 }} />
        </div>
      ) : employee ? (
        <div className="v-stack" style={{ gap: 24 }}>
          {/* Top Banner Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Department', value: employee.department, icon: Building2 },
              { label: 'Location', value: employee.location, icon: MapPin },
              { label: 'Joined', value: new Date(employee.hireDate).toLocaleDateString(), icon: Calendar },
            ].map(stat => (
              <div key={stat.label} style={{ padding: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  <stat.icon size={14} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Quick Info */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Contact & Employment</h3>
            <div className="v-stack" style={{ gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem' }}>
                <Mail size={16} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--text-secondary)' }}>{employee.email}</span>
              </div>
              {employee.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem' }}>
                  <Phone size={16} color="var(--text-tertiary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>{employee.phone}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem' }}>
                <Briefcase size={16} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--text-secondary)' }}>{employee.employmentType?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>Recent Activity</h3>
            <Timeline events={
              employee.eventLogs?.slice(0, 5).map((log: any) => ({
                id: log.id,
                title: log.eventType.replace('_', ' '),
                timestamp: log.createdAt,
              })) || [{
                id: '1', title: 'Employee record created', timestamp: employee.createdAt
              }]
            } />
          </div>
        </div>
      ) : null}
    </SideDrawer>
  );
}
