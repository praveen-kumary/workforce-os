import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Users, Star, Award, Plus, TrendingUp, X } from 'lucide-react';
import { workplaceApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { LearningCourse } from '../lib/types';

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  Compliance: { color: '#dc2626', bg: 'var(--error-bg)' },
  Leadership: { color: '#7c3aed', bg: '#f5f3ff' },
  Security: { color: '#d97706', bg: 'var(--warning-bg)' },
  'Soft Skills': { color: '#2563eb', bg: 'var(--info-bg)' },
  Professional: { color: '#16a34a', bg: 'var(--success-bg)' },
};

export function Learning() {
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: 'Security',
    duration: '2h',
    isMandatory: false,
    description: '',
  });

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: courses = [] } = useQuery({
    queryKey: ['learning-courses'],
    queryFn: () => workplaceApi.getCourses(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => workplaceApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
      addToast({ title: 'Course published', description: `${newCourse.title} added to academy.` });
      setShowModal(false);
      setNewCourse({ title: '', category: 'Security', duration: '2h', isMandatory: false, description: '' });
    },
  });

  const totalEnrolled = courses.reduce((s: number, c: LearningCourse) => s + (c.enrolledCount || 0), 0);
  const totalCompleted = courses.reduce((s: number, c: LearningCourse) => s + (c.completedCount || 0), 0);
  const avgCompletion = totalEnrolled > 0 ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Learning & Certifications</h1>
          <p className="page-subtitle">
            {courses.length} courses · {courses.filter((c: any) => c.isMandatory).length} required compliance certifications
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Create Course
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats" style={{ marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Modules', value: courses.length, icon: BookOpen, color: '#2563eb', bg: 'var(--info-bg)' },
          { label: 'Avg Completion', value: `${avgCompletion}%`, icon: TrendingUp, color: '#16a34a', bg: 'var(--success-bg)' },
          { label: 'Total Enrolled', value: totalEnrolled, icon: Users, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Certifications Issued', value: totalCompleted, icon: Award, color: '#d97706', bg: 'var(--warning-bg)' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} className="kpi-card" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="kpi-card-header"><div className="kpi-card-icon" style={{ background: kpi.bg }}><kpi.icon size={18} color={kpi.color} /></div></div>
            <div className="kpi-card-value">{kpi.value}</div>
            <div className="kpi-card-label">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid-cards">
        {courses.map((course: LearningCourse, i: number) => {
          const cat = CAT_COLORS[course.category] || { color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' };
          const completionPct = course.enrolledCount > 0 ? Math.round((course.completedCount / course.enrolledCount) * 100) : 0;

          return (
            <motion.div
              key={course.id}
              className="card card-interactive"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
                <span className="badge" style={{ background: cat.bg, color: cat.color }}>{course.category}</span>
                {course.isMandatory && <span className="badge badge-error" style={{ fontSize: '0.55rem' }}>Mandatory</span>}
              </div>
              <h4 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>{course.title}</h4>
              <div className="flex items-center gap-4" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
                <span className="flex items-center gap-1"><Clock size={13} /> {course.duration}</span>
                <span className="flex items-center gap-1"><Users size={13} /> {course.enrolledCount} enrolled</span>
                <span className="flex items-center gap-1"><Star size={13} fill="#d97706" color="#d97706" /> {Number(course.rating).toFixed(1)}</span>
              </div>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div className="flex-between" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  <span>Completion Rate</span>
                  <span style={{ fontWeight: 700 }}>{completionPct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionPct}%`, background: 'var(--accent)', borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Course Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: 460 }}
            >
              <div className="modal-header">
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Create Course</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input
                    className="input"
                    placeholder="e.g. Data Protection & Privacy"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="select"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    >
                      <option value="Security">Security</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      className="input"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!newCourse.title || createMutation.isPending}
                  onClick={() => createMutation.mutate(newCourse)}
                >
                  {createMutation.isPending ? 'Publishing...' : 'Publish Course'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default Learning;
