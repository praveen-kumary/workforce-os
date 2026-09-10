import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LogIn, LogOut,
} from 'lucide-react';
import { workplaceApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import { useAuthStore } from '../store/auth.store';
import type { TeamAttendanceMember, AttendanceRecord } from '../lib/types';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  present: { color: 'var(--success)', bg: 'var(--success-bg)', label: 'Present' },
  late: { color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Late' },
  leave: { color: 'var(--info)', bg: 'var(--info-bg)', label: 'On Leave' },
  remote: { color: '#7c3aed', bg: 'var(--workflow-subtle)', label: 'Remote' },
  offline: { color: 'var(--text-quaternary)', bg: 'var(--bg-tertiary)', label: 'Offline' },
};

export function Attendance() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: team = [] } = useQuery({
    queryKey: ['attendance-team'],
    queryFn: () => workplaceApi.getTeamStatus(),
  });

  const { data: myRecords = [] } = useQuery({
    queryKey: ['attendance-my', user?.id],
    queryFn: () => workplaceApi.getAttendance({ employeeId: user?.id }),
    enabled: !!user?.id,
  });

  const activeSession = myRecords.find((r: AttendanceRecord) => !r.clockOut);
  const isClockedIn = !!activeSession;

  const clockInMutation = useMutation({
    mutationFn: () => workplaceApi.clockIn(user?.id, 'PRESENT'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-team'] });
      addToast({ title: 'Clocked In Successfully', description: 'Your attendance timer is now running.' });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => workplaceApi.clockOut(user?.id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-my'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-team'] });
      addToast({ title: 'Clocked Out', description: `Recorded ${res.hoursWorked || 0} hours worked today.` });
    },
    onError: (err: any) => {
      addToast({ title: 'Clock out failed', description: err.message });
    },
  });

  const presentCount = team.filter((t: TeamAttendanceMember) => t.status === 'present' || t.status === 'remote').length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance & Timesheets</h1>
          <p className="page-subtitle">
            {presentCount} team members online · Real-time attendance logging
          </p>
        </div>
      </div>

      {/* Clock In / Out Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isClockedIn ? 'linear-gradient(135deg, rgba(22,163,74,0.06) 0%, rgba(37,99,235,0.04) 100%)' : 'var(--bg-primary)',
          borderColor: isClockedIn ? 'var(--success)' : 'var(--border)',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            CURRENT WORK SESSION
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            {isClockedIn ? 'You are currently Clocked In' : 'You are currently Clocked Out'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
            {isClockedIn
              ? `Started session at ${new Date(activeSession.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Clock in to log your daily work hours and timesheet records.'}
          </div>
        </div>

        <div>
          {isClockedIn ? (
            <button
              className="btn btn-secondary"
              style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
              disabled={clockOutMutation.isPending}
              onClick={() => clockOutMutation.mutate()}
            >
              <LogOut size={16} /> {clockOutMutation.isPending ? 'Logging out...' : 'Clock Out'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={clockInMutation.isPending}
              onClick={() => clockInMutation.mutate()}
            >
              <LogIn size={16} /> {clockInMutation.isPending ? 'Clocking in...' : 'Clock In Now'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Team Status Table */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
          Live Team Status
        </h3>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Clock In</th>
              <th>Logged Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {team.map((member: TeamAttendanceMember) => {
              const sc = STATUS_CONFIG[member.status] || STATUS_CONFIG.offline;
              return (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="avatar avatar-sm"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                      >
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{member.name}</div>
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{member.department}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {member.clockIn}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {member.hours}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Attendance;
