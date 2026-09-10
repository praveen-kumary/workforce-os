import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Star, Plus, X } from 'lucide-react';
import { hrApi, coreApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { PerformanceReview, GoalOKR, Employee } from '../lib/types';

const REVIEW_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', label: 'Pending' },
  SELF_REVIEW: { bg: 'var(--info-bg)', text: 'var(--info-text)', label: 'Self Review' },
  IN_REVIEW: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', label: 'In Review' },
  COMPLETED: { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Completed' },
};

export function Performance() {
  const [tab, setTab] = useState<'reviews' | 'goals'>('reviews');
  const [showModal, setShowModal] = useState(false);
  const [newReview, setNewReview] = useState({
    employeeId: '',
    cycleName: 'Q3 2026 Performance Review',
    rating: '4.5',
    feedback: 'Consistently demonstrates technical excellence and high ownership.',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: reviews = [] } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => hrApi.getPerformanceReviews(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['performance-goals'],
    queryFn: () => hrApi.getGoals(),
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees-short'],
    queryFn: () => coreApi.getEmployees({ pageSize: 50 }),
  });
  const employees = employeesResponse?.data || [];

  const goalProgressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      hrApi.updateGoalProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-goals'] });
      addToast({ title: 'Goal progress updated' });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: any) =>
      hrApi.createReview({
        employeeId: data.employeeId,
        cycleName: data.cycleName,
        rating: Number(data.rating),
        feedback: data.feedback,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
      addToast({ title: 'Performance review submitted' });
      setShowModal(false);
    },
  });

  const completedCount = reviews.filter((r: PerformanceReview) => r.status === 'COMPLETED').length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance & OKRs</h1>
          <p className="page-subtitle">
            {reviews.length} reviews in cycle · {completedCount} completed · {goals.length} active OKRs
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              if (employees.length > 0 && !newReview.employeeId) {
                setNewReview({ ...newReview, employeeId: employees[0].id });
              }
              setShowModal(true);
            }}
          >
            <Plus size={15} /> Submit Review
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab ${tab === 'reviews' ? 'tab-active' : ''}`}
          onClick={() => setTab('reviews')}
        >
          <Star size={14} /> Performance Reviews ({reviews.length})
        </button>
        <button
          className={`tab ${tab === 'goals' ? 'tab-active' : ''}`}
          onClick={() => setTab('goals')}
        >
          <Target size={14} /> Goals & OKRs ({goals.length})
        </button>
      </div>

      {tab === 'reviews' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Cycle</th>
                <th>Rating</th>
                <th>Feedback Summary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r: PerformanceReview) => {
                const sc = REVIEW_STATUS[r.status] || REVIEW_STATUS.COMPLETED;
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="avatar avatar-sm"
                          style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
                        >
                          {r.employee?.firstName?.[0] || 'U'}
                          {r.employee?.lastName?.[0] || 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {r.employee?.firstName} {r.employee?.lastName}
                          </div>
                          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                            {r.employee?.department} · {r.employee?.roleTitle}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {r.cycleName}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" style={{ fontWeight: 700 }}>
                        <Star size={13} fill="#d97706" color="#d97706" />
                        <span>{r.rating ? Number(r.rating).toFixed(1) : '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: 300 }}>
                        {r.feedback || 'Self review in progress.'}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Goals & OKRs */
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {goals.map((g: GoalOKR) => (
            <div key={g.id} className="card card-interactive">
              <div className="flex-between" style={{ marginBottom: 8 }}>
                <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}>
                  {g.status?.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)' }}>
                  {g.progress}%
                </span>
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>{g.title}</h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
                {g.description}
              </p>

              <input
                type="range"
                min="0"
                max="100"
                value={g.progress}
                onChange={(e) => goalProgressMutation.mutate({ id: g.id, progress: Number(e.target.value) })}
                style={{ width: '100%', marginBottom: 12 }}
              />

              <div className="flex-between" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                <span>Owner: {g.employee?.firstName} {g.employee?.lastName}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>Slide to update %</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Review Modal */}
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
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Submit Review</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select
                    className="select"
                    value={newReview.employeeId}
                    onChange={(e) => setNewReview({ ...newReview, employeeId: e.target.value })}
                  >
                    {employees.map((emp: Employee) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rating (1.0 to 5.0)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Feedback & Accomplishments</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={newReview.feedback}
                    onChange={(e) => setNewReview({ ...newReview, feedback: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newReview.employeeId || createReviewMutation.isPending}
                  onClick={() => createReviewMutation.mutate(newReview)}
                >
                  {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Performance;
