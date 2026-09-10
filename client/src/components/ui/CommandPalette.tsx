import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Users, Laptop, DollarSign, Briefcase, UserPlus,
  BarChart3, Settings, Workflow, FileText, Receipt,
  Building2, CheckSquare, ShoppingCart, CalendarDays,
  Heart, Shield, Clock, BookOpen, Library, MessageSquare,
} from 'lucide-react';

interface CommandPaletteProps {
  onClose: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  desc?: string;
  icon: any;
  path: string;
  group: 'Navigation' | 'Workplace' | 'Finance & CRM' | 'System';
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'home', label: 'Home Dashboard', desc: 'Overview & executive KPIs', icon: BarChart3, path: '/', group: 'Navigation' },
  { id: 'directory', label: 'Employee Directory', desc: 'Browse all 31 employees', icon: Users, path: '/directory', group: 'Navigation' },
  { id: 'attendance', label: 'Time & Attendance', desc: 'Clock-in & team roster', icon: Clock, path: '/attendance', group: 'Navigation' },
  { id: 'approvals', label: 'Pending Approvals', desc: 'Leaves, POs & Expenses', icon: CheckSquare, path: '/approvals', group: 'Navigation' },
  { id: 'inbox', label: 'Inbox & Notifications', desc: 'Recent activity feed', icon: MessageSquare, path: '/inbox', group: 'Navigation' },
  { id: 'calendar', label: 'Company Calendar', desc: 'Events & milestones', icon: CalendarDays, path: '/calendar', group: 'Navigation' },

  // Workplace & HR
  { id: 'recruiting', label: 'Recruiting & Candidates', desc: 'Hiring pipeline', icon: UserPlus, path: '/recruiting', group: 'Workplace' },
  { id: 'leave', label: 'Leave Requests', desc: 'PTO & vacation management', icon: CalendarDays, path: '/leave', group: 'Workplace' },
  { id: 'benefits', label: 'Health & Benefits', desc: 'Company insurance plans', icon: Heart, path: '/benefits', group: 'Workplace' },
  { id: 'learning', label: 'Learning Academy', desc: 'Courses & certifications', icon: BookOpen, path: '/learning', group: 'Workplace' },
  { id: 'knowledge', label: 'Company Wiki', desc: 'Handbook & documentation', icon: Library, path: '/knowledge', group: 'Workplace' },

  // Finance & CRM
  { id: 'customers', label: 'Customer Accounts', desc: 'Enterprise client directory', icon: Building2, path: '/customers', group: 'Finance & CRM' },
  { id: 'sales', label: 'Sales Deals & Pipeline', desc: 'Revenue opportunities', icon: DollarSign, path: '/sales', group: 'Finance & CRM' },
  { id: 'projects', label: 'Projects & Deliverables', desc: 'Active roadmaps', icon: Briefcase, path: '/projects', group: 'Finance & CRM' },
  { id: 'tasks', label: 'Task Board', desc: 'Assigned tasks', icon: CheckSquare, path: '/tasks', group: 'Finance & CRM' },
  { id: 'payroll', label: 'Payroll Runs', desc: 'Compensation & execution', icon: DollarSign, path: '/payroll', group: 'Finance & CRM' },
  { id: 'expenses', label: 'Expense Claims', desc: 'Reimbursements & cards', icon: Receipt, path: '/expenses', group: 'Finance & CRM' },
  { id: 'invoices', label: 'Invoices & Billing', desc: 'Accounts receivable', icon: FileText, path: '/invoices', group: 'Finance & CRM' },
  { id: 'procurement', label: 'Procurement & POs', desc: 'Purchase orders', icon: ShoppingCart, path: '/procurement', group: 'Finance & CRM' },
  { id: 'assets', label: 'Fleet & IT Assets', desc: 'Encrypted laptops & MDM', icon: Laptop, path: '/assets', group: 'Finance & CRM' },

  // System
  { id: 'workflows', label: 'Workflow Automator', desc: 'Rules & event triggers', icon: Workflow, path: '/workflows', group: 'System' },
  { id: 'permissions', label: 'Access Control (RBAC)', desc: 'Roles & permissions', icon: Shield, path: '/permissions', group: 'System' },
  { id: 'settings', label: 'Company Settings', desc: 'System preferences', icon: Settings, path: '/settings', group: 'System' },
];

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.desc?.toLowerCase().includes(query.toLowerCase()) ||
          c.group.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].path);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selectedIndex, navigate, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="modal-overlay"
      style={{
        paddingTop: '12vh',
        alignItems: 'flex-start',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--inner-highlight), var(--shadow-2xl), 0 0 0 1px var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-secondary)',
          }}
        >
          <Search size={18} color="var(--accent)" strokeWidth={2.2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.9375rem',
              fontWeight: 550,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <kbd className="header-kbd">ESC</kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
              }}
            >
              No matching pages or actions found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    navigate(cmd.path);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent-muted)' : '1px solid transparent',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: isSelected ? '0 2px 8px var(--accent-glow)' : 'none',
                      transition: 'all 0.12s',
                    }}
                  >
                    <Icon size={16} strokeWidth={isSelected ? 2.4 : 1.8} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                      }}
                    >
                      {cmd.label}
                    </div>
                    {cmd.desc && (
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: isSelected ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cmd.desc}
                      </div>
                    )}
                  </div>

                  <span
                    className="badge badge-neutral"
                    style={{ fontSize: '0.625rem', opacity: isSelected ? 1 : 0.6 }}
                  >
                    {cmd.group}
                  </span>

                  {isSelected && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--accent)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      <kbd className="header-kbd">↵</kbd>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          className="flex-between"
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border-light)',
            background: 'var(--bg-secondary)',
            fontSize: '0.6875rem',
            color: 'var(--text-quaternary)',
          }}
        >
          <span>Use ↑ ↓ keys to navigate</span>
          <span>Press ↵ to select</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
export default CommandPalette;
