import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, UserPlus, Grid3X3, List, MapPin, Mail, Building2 } from 'lucide-react';
import { coreApi } from '../lib/api';

import { EmployeeDrawer } from '../components/ui/EmployeeDrawer';

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'var(--success-bg)', color: 'var(--success)' },
  ONBOARDING: { bg: 'var(--info-bg)', color: 'var(--info)' },
  ON_LEAVE: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  TERMINATED: { bg: 'var(--error-bg)', color: 'var(--error)' },
};

const DEPTS = ['ALL', 'Engineering', 'Sales', 'Finance', 'HR', 'Marketing', 'Product', 'Operations'];



export function Directory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, department, status],
    queryFn: () => coreApi.getEmployees({ search, department, status }),
  });
  const apiEmployees = data?.data || (Array.isArray(data) ? data : []);
  const employees = apiEmployees.filter((e: any) => {
    if (department !== 'ALL' && e.department !== department) return false;
    if (status !== 'ALL' && e.status !== status) return false;
    if (search && !`${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">People</h1>
          <p className="page-subtitle">{isLoading ? '...' : `${employees.length} team members`}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/onboarding/new')}>
          <UserPlus size={15} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input className="input" placeholder="Search people..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
        <select className="input" value={department} onChange={e => setDepartment(e.target.value)} style={{ width: 150 }}>
          {DEPTS.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Depts' : d}</option>)}
        </select>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 130 }}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <div style={{ display: 'flex', gap: 1, padding: 2, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7 }}>
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 8px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
              background: view === v ? 'var(--bg-primary)' : 'transparent',
              color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: view === v ? 'var(--shadow-sm), var(--inner-highlight)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s var(--ease-spring)'
            }}>
              {v === 'grid' ? <Grid3X3 size={14} strokeWidth={view === v ? 2.5 : 2} /> : <List size={14} strokeWidth={view === v ? 2.5 : 2} />}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid-cards">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer" style={{ height: 160, borderRadius: 12 }} />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <Search size={40} style={{ color: 'var(--text-quaternary)' }} />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 8, color: 'var(--text-secondary)' }}>No employees found</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Try adjusting your filters</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid-cards">
          {employees.map((emp: any, i: number) => {
            const st = STATUS_MAP[emp.status] || STATUS_MAP.ACTIVE;
            const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`;
            return (
              <motion.div
                key={emp.id}
                className="card card-hover"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => setSelectedEmployeeId(emp.id)}
                style={{ padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="avatar avatar-lg" style={{
                    background: emp.avatarUrl ? 'none' : 'var(--accent-muted)', color: emp.avatarUrl ? undefined : 'var(--accent)',
                  }}>
                    {emp.avatarUrl ? <img src={emp.avatarUrl} alt="" /> : initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.roleTitle}
                    </div>
                  </div>
                  <span className="badge" style={{ background: st.bg, color: st.color, fontSize: '0.65rem' }}>
                    {emp.status}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <Building2 size={12} color="var(--text-quaternary)" />{emp.department}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <Mail size={12} color="var(--text-quaternary)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <MapPin size={12} color="var(--text-quaternary)" />{emp.location || 'San Francisco, CA'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Location</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp: any) => {
                const st = STATUS_MAP[emp.status] || STATUS_MAP.ACTIVE;
                const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`;
                return (
                  <tr key={emp.id} className="card-hover" onClick={() => setSelectedEmployeeId(emp.id)} style={{ cursor: 'pointer', transition: 'all 0.2s var(--ease-spring)' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{emp.avatarUrl ? <img src={emp.avatarUrl} alt="" /> : initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.department}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.roleTitle}</td>
                    <td><span className="badge" style={{ background: st.bg, color: st.color, fontSize: '0.65rem' }}>{emp.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.location || 'San Francisco'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}


      <EmployeeDrawer 
        employeeId={selectedEmployeeId} 
        onClose={() => setSelectedEmployeeId(null)} 
      />
    </div>
  );
}
