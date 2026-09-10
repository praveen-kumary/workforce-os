import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Home, CheckSquare, Inbox, CheckCircle, Menu } from 'lucide-react';
import { PageSkeleton } from '../ui/SkeletonLoader';

export function AppShell() {
  const location = useLocation();

  const mobileNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: CheckSquare, label: 'Work', path: '/my-work' },
    { icon: Inbox, label: 'Inbox', path: '/inbox' },
    { icon: CheckCircle, label: 'Approvals', path: '/approvals' },
    { icon: Menu, label: 'More', path: '/settings' },
  ];

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <React.Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </React.Suspense>
        </main>

        {/* Mobile bottom navigation */}
        <nav className="mobile-nav">
          {mobileNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.3 : 1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
