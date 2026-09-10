import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Inbox, CheckSquare, Calendar,
  Users, UserPlus, Zap, Clock, CalendarDays, DollarSign, Heart, BookOpen,
  Building2, LineChart, Briefcase, CreditCard, Receipt, ShoppingCart, Store,
  FileText, Library, MessageSquare, Laptop,
  PieChart, BarChart3, Workflow,
  Settings, Grid, Shield, Link as LinkIcon, FileKey, Wallet,
  ChevronDown, ChevronRight, PanelLeftClose, PanelLeft,
  Target, ClipboardList, CheckCircle, Package,
  LogOut, AlertTriangle
} from 'lucide-react';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { approvalsApi, coreApi } from '../../lib/api';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  badgeKey?: 'approvals' | 'notifications';
  roles?: string[];
}

interface MenuGroup {
  group: string;
  roles?: string[];
  items: MenuItem[];
}

const MENU_DATA: MenuGroup[] = [
  {
    group: 'WORKSPACE',
    items: [
      { id: 'home', label: 'Home', icon: Home, path: '/' },
      { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/inbox', badgeKey: 'notifications' },
      { id: 'my-work', label: 'My Work', icon: CheckSquare, path: '/my-work' },
      { id: 'approvals', label: 'Approvals', icon: CheckCircle, path: '/approvals', badgeKey: 'approvals' },
      { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    ]
  },
  {
    group: 'PEOPLE',
    items: [
      { id: 'employees', label: 'Employees', icon: Users, path: '/directory' },
      { id: 'recruiting', label: 'Recruiting', icon: UserPlus, path: '/recruiting', roles: ['super_admin', 'hr_admin', 'manager'] },
      { id: 'onboarding', label: 'Onboarding', icon: Zap, path: '/onboarding/new', roles: ['super_admin', 'hr_admin', 'manager'] },
      { id: 'attendance', label: 'Attendance', icon: Clock, path: '/attendance' },
      { id: 'leave', label: 'Leave', icon: CalendarDays, path: '/leave' },
      { id: 'payroll', label: 'Payroll', icon: DollarSign, path: '/payroll', roles: ['super_admin', 'fin_admin', 'hr_admin'] },
      { id: 'benefits', label: 'Benefits', icon: Heart, path: '/benefits' },
      { id: 'performance', label: 'Performance', icon: Target, path: '/performance' },
      { id: 'learning', label: 'Learning', icon: BookOpen, path: '/learning' },
    ]
  },
  {
    group: 'BUSINESS',
    items: [
      { id: 'customers', label: 'Customers', icon: Building2, path: '/customers' },
      { id: 'sales', label: 'Sales', icon: LineChart, path: '/sales', roles: ['super_admin', 'sales_admin', 'manager'] },
      { id: 'projects', label: 'Projects', icon: Briefcase, path: '/projects' },
      { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/tasks' },
      { id: 'finance', label: 'Finance', icon: CreditCard, path: '/finance', roles: ['super_admin', 'fin_admin'] },
      { id: 'expenses', label: 'Expenses', icon: Receipt, path: '/expenses' },
      { id: 'invoices', label: 'Invoices', icon: FileText, path: '/invoices', roles: ['super_admin', 'fin_admin', 'sales_admin'] },
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart, path: '/procurement', roles: ['super_admin', 'fin_admin', 'it_admin'] },
      { id: 'vendors', label: 'Vendors', icon: Store, path: '/vendors', roles: ['super_admin', 'fin_admin', 'it_admin'] },
    ]
  },
  {
    group: 'COMPANY',
    items: [
      { id: 'documents', label: 'Documents', icon: FileText, path: '/documents' },
      { id: 'knowledge', label: 'Knowledge', icon: Library, path: '/knowledge' },
      { id: 'communication', label: 'Communication', icon: MessageSquare, path: '/communication' },
      { id: 'it', label: 'IT Assets', icon: Laptop, path: '/it', roles: ['super_admin', 'it_admin'] },
      { id: 'assets', label: 'Asset Fleet', icon: Package, path: '/assets', roles: ['super_admin', 'it_admin'] },
    ]
  },
  {
    group: 'INSIGHTS',
    items: [
      { id: 'analytics', label: 'Analytics', icon: PieChart, path: '/analytics', roles: ['super_admin', 'hr_admin', 'fin_admin', 'manager'] },
      { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports', roles: ['super_admin', 'hr_admin', 'fin_admin', 'manager'] },
      { id: 'automations', label: 'Automations', icon: Workflow, path: '/workflows', roles: ['super_admin', 'it_admin', 'hr_admin'] },
    ]
  },
  {
    group: 'ADMIN',
    roles: ['super_admin', 'hr_admin', 'it_admin', 'fin_admin'],
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
      { id: 'organization', label: 'Organization', icon: Grid, path: '/org-chart' },
      { id: 'permissions', label: 'Permissions', icon: Shield, path: '/permissions' },
      { id: 'integrations', label: 'Integrations', icon: LinkIcon, path: '/integrations' },
      { id: 'audit', label: 'Audit Log', icon: FileKey, path: '/audit' },
      { id: 'billing', label: 'Billing', icon: Wallet, path: '/billing' },
    ]
  }
];

function NavGroup({
  group,
  isCollapsed,
  pathname,
  userRole,
  badgeCounts,
  onItemClick,
}: {
  group: MenuGroup;
  isCollapsed: boolean;
  pathname: string;
  userRole?: string;
  badgeCounts: { approvals: number; notifications: number };
  onItemClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Group-level role check
  if (group.roles && userRole && !group.roles.includes(userRole) && userRole !== 'super_admin') {
    return null;
  }

  // Filter items by role
  const visibleItems = group.items.filter((item) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole) || userRole === 'super_admin';
  });

  if (visibleItems.length === 0) return null;

  if (isCollapsed) {
    return (
      <div className="sidebar-group">
        {visibleItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          const count = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

          return (
            <Link
              key={item.id}
              to={item.path}
              title={item.label}
              onClick={onItemClick}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
              style={{ justifyContent: 'center', padding: '8px', position: 'relative' }}
            >
              <item.icon size={17} strokeWidth={isActive ? 2.3 : 1.8} className="sidebar-item-icon" />
              {count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: '1.5px solid var(--bg-card)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="sidebar-group">
      <div className="sidebar-group-label" onClick={() => setIsOpen(!isOpen)}>
        <span>{group.group}</span>
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {visibleItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              const count = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onItemClick}
                  className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                >
                  <item.icon size={15} strokeWidth={isActive ? 2.3 : 1.8} className="sidebar-item-icon" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {count > 0 && (
                    <span className="sidebar-item-badge">{count}</span>
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useThemeStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Dynamic counts
  const { data: approvals = [] } = useQuery({
    queryKey: ['sidebar-approvals'],
    queryFn: () => approvalsApi.getApprovals(),
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['sidebar-notifications-count'],
    queryFn: () => coreApi.getNotificationCount(),
    refetchInterval: 30000,
  });

  const badgeCounts = {
    approvals: approvals.length,
    notifications: notifData?.count || 0,
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <nav
        className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarMobileOpen ? 'sidebar-open' : ''}`}
        style={{ width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      >
        {/* Brand */}
        <div className="sidebar-brand" style={sidebarCollapsed ? { justifyContent: 'center', padding: 0 } : undefined}>
          <div className="sidebar-brand-logo">
            <Zap size={15} color="white" strokeWidth={2.5} />
          </div>
          {!sidebarCollapsed && (
            <span className="sidebar-brand-name">Workspace OS</span>
          )}
          <button
            className="btn-ghost btn-icon-sm"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={sidebarCollapsed ? { display: 'none' } : { marginLeft: 'auto', color: 'var(--text-quaternary)' }}
          >
            <PanelLeftClose size={15} />
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          {sidebarCollapsed && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
              <button
                className="btn-ghost btn-icon-sm"
                onClick={toggleSidebar}
                title="Expand sidebar"
                style={{ color: 'var(--text-quaternary)' }}
              >
                <PanelLeft size={15} />
              </button>
            </div>
          )}
          {MENU_DATA.map((group) => (
            <NavGroup
              key={group.group}
              group={group}
              isCollapsed={sidebarCollapsed}
              pathname={location.pathname}
              userRole={user?.role}
              badgeCounts={badgeCounts}
              onItemClick={() => setSidebarMobileOpen(false)}
            />
          ))}
        </div>

        {/* User profile footer */}
        <div className="sidebar-footer">
          {sidebarCollapsed ? (
            <div
              style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => setShowLogoutModal(true)}
              title="Click to sign out"
            >
              <Avatar
                name={user ? `${user.firstName} ${user.lastName}` : ''}
                src={user?.avatarUrl}
                size="sm"
              />
            </div>
          ) : (
            <div
              className="sidebar-user"
              onClick={() => setShowLogoutModal(true)}
              title="Click to manage session / sign out"
            >
              <Avatar
                name={user ? `${user.firstName} ${user.lastName}` : ''}
                src={user?.avatarUrl}
                size="sm"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
                  {user?.roleTitle || user?.role?.toUpperCase() || 'Employee'}
                </div>
              </div>
              <LogOut size={14} color="var(--text-quaternary)" />
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
        maxWidth={420}
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              leftIcon={<LogOut size={14} />}
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
            >
              Sign Out
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-2) 0' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--error-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--error)',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Are you sure you want to sign out?
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
              Your current session tokens and workspace state will be cleared.
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
export default Sidebar;
