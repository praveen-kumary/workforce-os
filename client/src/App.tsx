import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toaster';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { PageSkeleton } from './components/ui/SkeletonLoader';
import { useAuthStore } from './store/auth.store';

// ─── Code-Split Pages ──────────────────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Directory = lazy(() => import('./pages/Directory').then(m => ({ default: m.Directory })));
const OrgChart = lazy(() => import('./pages/OrgChart').then(m => ({ default: m.OrgChart })));
const EmployeeProfile = lazy(() => import('./pages/EmployeeProfile').then(m => ({ default: m.EmployeeProfile })));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const OnboardingBuilder = lazy(() => import('./pages/OnboardingBuilder').then(m => ({ default: m.OnboardingBuilder })));
const HRDashboard = lazy(() => import('./pages/HRDashboard').then(m => ({ default: m.HRDashboard })));
const ITDashboard = lazy(() => import('./pages/ITDashboard').then(m => ({ default: m.ITDashboard })));
const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const WorkflowStudio = lazy(() => import('./pages/WorkflowStudio').then(m => ({ default: m.WorkflowStudio })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const MyProfile = lazy(() => import('./pages/MyProfile').then(m => ({ default: m.MyProfile })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AuditTrail = lazy(() => import('./pages/AuditTrail').then(m => ({ default: m.AuditTrail })));
const Integrations = lazy(() => import('./pages/Integrations').then(m => ({ default: m.Integrations })));
const Billing = lazy(() => import('./pages/Billing').then(m => ({ default: m.Billing })));

// ─── Workspace & Operations Pages ─────────────────────────
const InboxPage = lazy(() => import('./pages/Inbox').then(m => ({ default: m.InboxPage })));
const MyWork = lazy(() => import('./pages/MyWork').then(m => ({ default: m.MyWork })));
const Leave = lazy(() => import('./pages/Leave').then(m => ({ default: m.Leave })));
const Payroll = lazy(() => import('./pages/Payroll').then(m => ({ default: m.Payroll })));
const Sales = lazy(() => import('./pages/Sales').then(m => ({ default: m.Sales })));
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })));
const Expenses = lazy(() => import('./pages/Expenses').then(m => ({ default: m.Expenses })));
const Approvals = lazy(() => import('./pages/Approvals').then(m => ({ default: m.Approvals })));
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Recruiting = lazy(() => import('./pages/Recruiting').then(m => ({ default: m.Recruiting })));
const Invoices = lazy(() => import('./pages/Invoices').then(m => ({ default: m.Invoices })));
const Benefits = lazy(() => import('./pages/Benefits').then(m => ({ default: m.Benefits })));
const Performance = lazy(() => import('./pages/Performance').then(m => ({ default: m.Performance })));
const Documents = lazy(() => import('./pages/Documents').then(m => ({ default: m.Documents })));
const Assets = lazy(() => import('./pages/Assets').then(m => ({ default: m.Assets })));
const Vendors = lazy(() => import('./pages/Vendors').then(m => ({ default: m.Vendors })));
const Procurement = lazy(() => import('./pages/Procurement').then(m => ({ default: m.Procurement })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const Communication = lazy(() => import('./pages/Communication').then(m => ({ default: m.Communication })));
const Knowledge = lazy(() => import('./pages/Knowledge').then(m => ({ default: m.Knowledge })));
const Learning = lazy(() => import('./pages/Learning').then(m => ({ default: m.Learning })));
const Permissions = lazy(() => import('./pages/Permissions').then(m => ({ default: m.Permissions })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
    },
  },
});

export function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              {isAuthenticated ? (
                <Route path="/" element={<AppShell />}>
                  {/* ─── Workspace ───────────────────────────── */}
                  <Route index element={<Dashboard />} />
                  <Route path="inbox" element={<InboxPage />} />
                  <Route path="my-work" element={<MyWork />} />
                  <Route path="approvals" element={<Approvals />} />
                  <Route path="calendar" element={<CalendarPage />} />

                  {/* ─── People ──────────────────────────────── */}
                  <Route path="directory" element={<Directory />} />
                  <Route path="employees/:id" element={<EmployeeProfile />} />
                  <Route path="recruiting" element={<Recruiting />} />
                  <Route path="onboarding/new" element={<OnboardingWizard />} />
                  <Route path="onboarding/builder" element={<OnboardingBuilder />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="leave" element={<Leave />} />
                  <Route path="payroll" element={<Payroll />} />
                  <Route path="benefits" element={<Benefits />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="learning" element={<Learning />} />

                  {/* ─── Business ─────────────────────────────── */}
                  <Route path="customers" element={<Customers />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="finance/*" element={<FinanceDashboard />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="invoices" element={<Invoices />} />
                  <Route path="procurement" element={<Procurement />} />
                  <Route path="vendors" element={<Vendors />} />

                  {/* ─── Company ──────────────────────────────── */}
                  <Route path="documents" element={<Documents />} />
                  <Route path="knowledge" element={<Knowledge />} />
                  <Route path="communication" element={<Communication />} />
                  <Route path="it/*" element={<ITDashboard />} />
                  <Route path="assets" element={<Assets />} />

                  {/* ─── Insights ─────────────────────────────── */}
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="workflows" element={<WorkflowStudio />} />

                  {/* ─── Admin ────────────────────────────────── */}
                  <Route path="settings" element={<Settings />} />
                  <Route path="org-chart" element={<OrgChart />} />
                  <Route path="permissions" element={<Permissions />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="audit" element={<AuditTrail />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="me" element={<MyProfile />} />

                  {/* ─── Legacy Routes ────────────────────────── */}
                  <Route path="hr/*" element={<HRDashboard />} />

                  {/* ─── Catch-all ────────────────────────────── */}
                  <Route path="404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              ) : (
                <Route
                  path="*"
                  element={
                    <Suspense fallback={<PageSkeleton />}>
                      <Login />
                    </Suspense>
                  }
                />
              )}
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
