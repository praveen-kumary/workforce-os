import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MapPin,
  Star, X,
} from 'lucide-react';
import { workplaceApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { JobOpening, Candidate } from '../lib/types';

const PIPELINE_STAGES: Array<{ id: Candidate['stage']; label: string; color: string }> = [
  { id: 'APPLIED', label: 'Applied', color: '#6366f1' },
  { id: 'SCREENING', label: 'Screening', color: '#2563eb' },
  { id: 'INTERVIEW', label: 'Interview', color: '#0891b2' },
  { id: 'ASSESSMENT', label: 'Assessment', color: '#7c3aed' },
  { id: 'OFFER', label: 'Offer', color: '#d97706' },
  { id: 'HIRED', label: 'Hired', color: '#16a34a' },
];

export function Recruiting() {
  const [view, setView] = useState<'jobs' | 'pipeline'>('jobs');
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    location: 'San Francisco, CA',
    employmentType: 'Full-time',
    salaryRange: '$150K-$190K',
    description: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: jobs = [] } = useQuery({
    queryKey: ['recruiting-jobs'],
    queryFn: () => workplaceApi.getJobs(),
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ['recruiting-candidates'],
    queryFn: () => workplaceApi.getCandidates(),
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      workplaceApi.updateCandidateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiting-candidates'] });
      addToast({ title: 'Candidate stage updated' });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => workplaceApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiting-jobs'] });
      addToast({ title: 'Job opening posted', description: `${newJob.title} is now open for applicants.` });
      setShowModal(false);
      setNewJob({
        title: '',
        department: 'Engineering',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        salaryRange: '$150K-$190K',
        description: '',
      });
    },
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recruiting & Talent Acquisition</h1>
          <p className="page-subtitle">
            {jobs.length} open headcount positions · {candidates.length} candidates in pipeline
          </p>
        </div>
        <div className="page-actions">
          <div className="flex items-center gap-1" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 2, border: '1px solid var(--border)' }}>
            <button className={`btn btn-sm ${view === 'jobs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('jobs')}>Job Openings</button>
            <button className={`btn btn-sm ${view === 'pipeline' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('pipeline')}>Candidate Pipeline</button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Post Job
          </button>
        </div>
      </div>

      {/* Pipeline Stage Counts */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          TALENT PIPELINE OVERVIEW
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`, gap: 8 }}>
          {PIPELINE_STAGES.map((st) => {
            const count = candidates.filter((c: Candidate) => c.stage === st.id).length;
            return (
              <div
                key={st.id}
                style={{
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: `${st.color}10`,
                  border: `1px solid ${st.color}25`,
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: st.color }}>{count}</div>
                <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 650, color: 'var(--text-secondary)' }}>{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {view === 'jobs' ? (
        /* Jobs List */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Location</th>
                <th>Salary Band</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job: JobOpening) => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{job.title}</div>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{job.employmentType}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{job.department}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      <MapPin size={12} /> {job.location}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 650 }}>{job.salaryRange}</span>
                  </td>
                  <td>
                    <span className="badge badge-success">{job.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Candidates Table */
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Applied Role</th>
                <th>Source</th>
                <th>Rating</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand: Candidate) => {
                return (
                  <tr key={cand.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-sm" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
                          {cand.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cand.name}</div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{cand.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 550 }}>
                        {cand.job?.title || 'Open Requisition'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{cand.source}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" style={{ fontWeight: 700 }}>
                        <Star size={13} fill="#d97706" color="#d97706" />
                        <span>{cand.rating ? Number(cand.rating).toFixed(1) : '4.5'}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className="input input-sm"
                        value={cand.stage}
                        onChange={(e) => stageMutation.mutate({ id: cand.id, stage: e.target.value })}
                        style={{ fontSize: '0.8125rem', height: 32, width: 130, padding: '4px 8px' }}
                      >
                        {PIPELINE_STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Job Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 480 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Post New Job Opening</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Role Title *</label>
                  <input
                    className="input"
                    placeholder="e.g. Senior Backend Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="select"
                      value={newJob.department}
                      onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      className="input"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Band / Comp Range</label>
                  <input
                    className="input"
                    placeholder="$140K-$180K"
                    value={newJob.salaryRange}
                    onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newJob.title || createJobMutation.isPending}
                  onClick={() => createJobMutation.mutate(newJob)}
                >
                  {createJobMutation.isPending ? 'Posting...' : 'Post Requisition'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Recruiting;
