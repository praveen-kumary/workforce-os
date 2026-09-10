import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bell, CheckCircle, Check,
} from 'lucide-react';
import { coreApi } from '../lib/api';
import { useToast } from '../components/ui/Toaster';
import { useAuthStore } from '../store/auth.store';
import type { Notification } from '../lib/types';

export function InboxPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => coreApi.getNotifications(user?.id || ''),
    enabled: !!user?.id,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => coreApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => coreApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      addToast({ title: 'All notifications marked as read' });
    },
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inbox & Activity</h1>
          <p className="page-subtitle">
            {notifications.length} updates · {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <Check size={14} /> Mark All as Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="shimmer" style={{ width: '100%', height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={40} color="var(--text-tertiary)" style={{ marginBottom: 12 }} />
          <h3>Your inbox is empty</h3>
          <p>You have zero unread notifications or system alerts.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((notif: Notification) => (
            <motion.div
              key={notif.id}
              className="card card-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 'var(--space-4)',
                background: notif.isRead ? 'var(--bg-primary)' : 'var(--accent-subtle)',
                borderColor: notif.isRead ? 'var(--border-light)' : 'var(--accent)',
              }}
              onClick={() => {
                if (!notif.isRead) markReadMutation.mutate(notif.id);
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: notif.type === 'SUCCESS' ? 'var(--success-bg)' : 'var(--info-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {notif.type === 'SUCCESS' ? (
                  <CheckCircle size={18} color="var(--success)" />
                ) : (
                  <Bell size={18} color="var(--info)" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-quaternary)', marginTop: 4 }}>
                  {new Date(notif.createdAt).toLocaleString()}
                </div>
              </div>

              {!notif.isRead && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    flexShrink: 0,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
export default InboxPage;
