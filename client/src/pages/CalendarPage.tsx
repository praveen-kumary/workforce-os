import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, MapPin,
  Plus, X, Trash2,
} from 'lucide-react';
import { workplaceApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import type { CalendarEvent } from '../lib/types';

const EVENT_TYPE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  meeting: { bg: 'var(--accent-subtle)', color: 'var(--accent-text)', border: 'var(--accent-muted)' },
  interview: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', border: 'var(--warning-border)' },
  review: { bg: 'var(--success-bg)', color: 'var(--success-text)', border: 'var(--success-border)' },
  all_hands: { bg: 'var(--info-bg)', color: 'var(--info-text)', border: 'var(--info-border)' },
  deadline: { bg: 'var(--error-bg)', color: 'var(--error-text)', border: 'var(--error-border)' },
};

export function CalendarPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    time: '10:00 AM - 11:00 AM',
    type: 'meeting',
    location: 'Virtual / Zoom',
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => workplaceApi.getCalendarEvents(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CalendarEvent>) => workplaceApi.createCalendarEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      addToast({ title: 'Event Scheduled', description: `${newEvent.title} has been added to calendar.` });
      setShowModal(false);
      setNewEvent({
        title: '',
        description: '',
        time: '10:00 AM - 11:00 AM',
        type: 'meeting',
        location: 'Virtual / Zoom',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workplaceApi.deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      addToast({ title: 'Event Removed', description: 'Calendar event removed.' });
    },
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;
    createMutation.mutate({
      title: newEvent.title,
      description: newEvent.description,
      type: newEvent.type,
      date: selectedDate,
      time: newEvent.time,
      location: newEvent.location,
    });
  };

  const today = new Date();

  return (
    <div className="page-content">
      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarIcon size={24} color="var(--accent)" />
            <span>Company Calendar & Scheduling</span>
          </h1>
          <p className="page-subtitle">
            {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Schedule Event
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--space-4)' }}>
        {/* Events Timeline & Roster */}
        <div className="card card-flush">
          <div
            className="flex-between"
            style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-light)' }}
          >
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
                Upcoming Schedule & Executive Milestones
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                {events.length} events scheduled in database
              </div>
            </div>
            <div className="badge badge-info">{events.length} Active Events</div>
          </div>

          <div style={{ padding: 'var(--space-3)' }}>
            {isLoading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="shimmer" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
                <div className="shimmer" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
                <div className="shimmer" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
              </div>
            ) : events.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No events found. Click "Schedule Event" to add one.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.map((ev) => {
                  const style = EVENT_TYPE_STYLES[ev.type] || EVENT_TYPE_STYLES.meeting;
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          textAlign: 'center',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: style.bg,
                          border: `1px solid ${style.border}`,
                          color: style.color,
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                          {ev.type.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, marginTop: 2 }}>{ev.date}</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 750,
                            color: 'var(--text-primary)',
                            marginBottom: 2,
                          }}
                        >
                          {ev.title}
                        </div>
                        {ev.description && (
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                            {ev.description}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            fontSize: '0.65rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} color="var(--text-tertiary)" /> {ev.time}
                          </span>
                          {ev.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={11} color="var(--text-tertiary)" /> {ev.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className="btn-icon-sm"
                        onClick={() => deleteMutation.mutate(ev.id)}
                        title="Delete event"
                        style={{ color: 'var(--text-quaternary)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Quick Overview & Mini Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <div
              style={{
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
                Calendar Quick Guide
              </div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Synchronized across all unified modules
              </div>
            </div>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { type: 'meeting', label: 'Team Standups & Sprints', desc: 'Syncs with Slack and Google Meet' },
                { type: 'interview', label: 'Candidate Interview Loops', desc: 'Auto-booked from Recruiting pipeline' },
                { type: 'review', label: 'Financial & OKR Calibrations', desc: 'Directly linked to Executive reviews' },
                { type: 'deadline', label: 'Payroll & Tax Cutoffs', desc: 'Enforces payroll freeze milestones' },
              ].map((item) => {
                const style = EVENT_TYPE_STYLES[item.type];
                return (
                  <div
                    key={item.type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span className="badge-pulse" style={{ background: style.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Schedule Event Modal ─── */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text-heading)' }}>
                    Schedule New Calendar Event
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Persists directly to database and notifies attendees.
                  </p>
                </div>
                <button className="btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddEvent}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Event Title *</label>
                    <input
                      className="input"
                      placeholder="e.g. Q4 Executive Budget Calibration"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="input"
                      style={{ minHeight: 60 }}
                      placeholder="Meeting objective, agenda, or link"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time Window</label>
                      <input
                        className="input"
                        placeholder="10:00 AM - 11:00 AM"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Event Type</label>
                      <select
                        className="input"
                        value={newEvent.type}
                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                      >
                        <option value="meeting">Team Meeting</option>
                        <option value="interview">Candidate Interview</option>
                        <option value="review">Performance / OKR Review</option>
                        <option value="all_hands">All-Hands Global</option>
                        <option value="deadline">Critical Deadline</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location / URL</label>
                      <input
                        className="input"
                        placeholder="Virtual / Zoom / Boardroom A"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Scheduling...' : 'Save & Schedule Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default CalendarPage;
