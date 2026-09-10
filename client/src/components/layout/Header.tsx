import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Menu, LogOut, User, Settings,
  Check, Sun, Moon,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { CommandPalette } from '../ui/CommandPalette';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import { coreApi } from '../../lib/api';
import type { Notification } from '../../lib/types';

function UserMenu({ user, onClose, onLogout }: { user: any; onClose: () => void; onLogout: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 240,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-heading)' }}>
          {user?.firstName} {user?.lastName}
        </div>
        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{user?.email}</div>
      </div>
      <div style={{ padding: 'var(--space-1)' }}>
        {[
          { icon: User, label: 'My Profile', path: '/me' },
          { icon: Settings, label: 'Account Settings', path: '/settings' },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.path}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: '8px var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 550,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border-light)', padding: 'var(--space-1)' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            width: '100%',
            padding: '8px var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            color: 'var(--error)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit',
            transition: 'all 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--error-subtle)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.div>
  );
}

function NotificationDropdown({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => coreApi.getNotifications(userId),
    enabled: !!userId,
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
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 380,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      <div
        className="flex-between"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 750, color: 'var(--text-heading)' }}>
          Notifications
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 'var(--text-2xs)', padding: '2px 6px' }}
          onClick={() => markAllMutation.mutate()}
        >
          <Check size={11} /> Mark all read
        </button>
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            No notifications
          </div>
        ) : (
          notifications.map((n: Notification) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) markReadMutation.mutate(n.id);
              }}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-light)',
                background: n.isRead ? 'transparent' : 'var(--accent-subtle)',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  marginTop: 5,
                  background: n.isRead ? 'transparent' : 'var(--accent)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {n.message}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-quaternary)', marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-light)', padding: '8px', textAlign: 'center' }}>
        <Link
          to="/inbox"
          onClick={onClose}
          style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--accent)' }}
        >
          View all notifications →
        </Link>
      </div>
    </motion.div>
  );
}

export function Header() {
  const { user, logout } = useAuthStore();
  const { sidebarMobileOpen, setSidebarMobileOpen, resolvedTheme, toggleTheme } = useThemeStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Keyboard shortcut listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: countData } = useQuery({
    queryKey: ['notification-count'],
    queryFn: () => coreApi.getNotificationCount(),
    refetchInterval: 15000,
  });
  const unreadCount = countData?.count || 0;

  return (
    <>
      <header className="app-header">
        {/* Left Side: Search / Cmd+K */}
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost btn-icon mobile-menu-toggle"
            onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>

          <button className="header-search-btn" onClick={() => setShowSearch(true)}>
            <Search size={14} />
            <span>Search or jump to...</span>
            <span className="header-kbd">⌘K</span>
          </button>
        </div>

        {/* Right Side: Quick Action & Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative', color: 'var(--text-secondary)' }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 6px var(--accent)',
                  }}
                />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationDropdown
                  userId={user?.id || ''}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle Button */}
          <button
            className="btn btn-ghost btn-icon"
            onClick={toggleTheme}
            title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            style={{ color: 'var(--text-secondary)' }}
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

          {/* User Profile Avatar Popover */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '2px 4px', borderRadius: 'var(--radius-md)' }}
            >
              <Avatar
                firstName={user?.firstName || 'Jane'}
                lastName={user?.lastName || 'Doe'}
                size="sm"
              />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user?.firstName} {user?.lastName}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: 1 }}>
                  {user?.roleTitle || 'Executive'}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {showUserMenu && (
                <UserMenu
                  user={user}
                  onClose={() => setShowUserMenu(false)}
                  onLogout={logout}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Command Palette (Cmd+K) Modal */}
      {showSearch && <CommandPalette onClose={() => setShowSearch(false)} />}
    </>
  );
}
export default Header;
