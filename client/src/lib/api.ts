/**
 * Unified Workforce OS — Production API Client
 * Features: Auto-refresh tokens, retry with backoff, request deduplication, typed responses.
 */

import type {
  LoginResponse,
  RefreshResponse,
  EmployeeListResponse,
  DashboardStats,
  Employee,
  LeaveRequest,
  Device,
  AppAccess,
  AppCatalogItem,
  SupportTicket,
  PayrollRun,
  Expense,
  CorporateCard,
  WorkflowRule,
  WorkflowExecution,
  Notification,
  HeadcountAnalytics,
  CompensationBand,
  BenefitPlan,
  PerformanceReview,
  GoalOKR,
  Customer,
  Deal,
  PipelineStats,
  Project,
  Task,
  Invoice,
  Vendor,
  PurchaseOrder,
  AttendanceRecord,
  TeamAttendanceMember,
  JobOpening,
  Candidate,
  KnowledgeArticle,
  LearningCourse,
  ChatChannel,
  ChatMessage,
  UnifiedApprovalItem,
  CalendarEvent,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Token Management ───────────────────────────────────
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('uos-auth-token');
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  try {
    return localStorage.getItem('uos-refresh-token');
  } catch {
    return null;
  }
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('uos-auth-token', accessToken);
  localStorage.setItem('uos-refresh-token', refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('uos-auth-token');
  localStorage.removeItem('uos-refresh-token');
  localStorage.removeItem('uos-auth-user');
}

// ─── Refresh Token Logic ────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    isRefreshing = false;
    clearTokens();
    window.location.href = '/';
    throw new Error('No refresh token available');
  }

  try {
    const res = await fetch(`${API_BASE}/core/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    const data: RefreshResponse = await res.json();
    setTokens(data.token, data.refreshToken);

    // Resolve all queued requests
    refreshQueue.forEach(({ resolve }) => resolve(data.token));
    refreshQueue = [];

    return data.token;
  } catch (err) {
    refreshQueue.forEach(({ reject }) => reject(err as Error));
    refreshQueue = [];
    clearTokens();
    window.location.href = '/';
    throw err;
  } finally {
    isRefreshing = false;
  }
}

// ─── Core Request Function ──────────────────────────────
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Token expired — attempt refresh
    if (res.status === 401) {
      const body = await res.json().catch(() => ({}));
      if (body.code === 'TOKEN_EXPIRED' && retryCount === 0) {
        const newToken = await refreshAccessToken();
        headers['Authorization'] = `Bearer ${newToken}`;
        return request<T>(endpoint, options, retryCount + 1);
      }

      clearTokens();
      window.location.href = '/';
      throw new Error('Session expired — please log in again.');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || body.message || `API Error ${res.status}`);
    }

    return res.json();
  } catch (err: any) {
    // Retry on network errors (up to 2 retries with exponential backoff)
    if (err.name === 'TypeError' && err.message.includes('fetch') && retryCount < 2) {
      await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000));
      return request<T>(endpoint, options, retryCount + 1);
    }
    throw err;
  }
}

function get<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'GET' });
}

function post<T = any>(endpoint: string, body?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function put<T = any>(endpoint: string, body?: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function del<T = any>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: 'DELETE' });
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    post<LoginResponse>('/core/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    post<LoginResponse>('/core/auth/register', data),
  refresh: (refreshToken: string) =>
    post<RefreshResponse>('/core/auth/refresh', { refreshToken }),
  logout: (refreshToken?: string) =>
    post('/core/auth/logout', { refreshToken }),
  me: () => get<LoginResponse['user']>('/core/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    post('/core/auth/change-password', { currentPassword, newPassword }),
};

// ─────────────────────────────────────────────
// Core — Employees, Settings, Notifications
// ─────────────────────────────────────────────
export const coreApi = {
  getStats: () => get<DashboardStats>('/core/employees/stats'),
  getEmployees: (params?: { search?: string; department?: string; status?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.department && params.department !== 'ALL') qs.set('department', params.department);
    if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const q = qs.toString();
    return get<EmployeeListResponse>(`/core/employees${q ? `?${q}` : ''}`);
  },
  getEmployee: (id: string) => get<Employee>(`/core/employees/${id}`),
  getEmployeeProfile: (id: string) => get<any>(`/core/employees/${id}/profile`),
  createEmployee: (data: any) => post<Employee>('/core/employees', data),
  updateEmployee: (id: string, data: any) => put<Employee>(`/core/employees/${id}`, data),
  offboardEmployee: (id: string, data: any) => post(`/core/employees/${id}/offboard`, data),
  getOrgChart: () => get('/core/employees/org-chart'),
  getSettings: () => get('/core/settings'),
  updateSettings: (data: any) => put('/core/settings', data),
  getNotifications: (employeeId: string) => get<Notification[]>(`/core/notifications?employeeId=${employeeId}`),
  getNotificationCount: () => get<{ count: number }>('/core/notifications/count'),
  markNotificationRead: (id: string) => post(`/core/notifications/${id}/read`),
  markAllNotificationsRead: () => post('/core/notifications/read-all'),
  search: (q: string) => get(`/core/search?q=${encodeURIComponent(q)}`),
  // Analytics
  getAnalyticsHeadcount: () => get<HeadcountAnalytics>('/core/analytics/headcount'),
  getAnalyticsPayrollTrend: () => get('/core/analytics/payroll-trend'),
  getAnalyticsLeaveUtilization: () => get('/core/analytics/leave-utilization'),
  getAnalyticsExpenseBreakdown: () => get('/core/analytics/expense-breakdown'),
  getAnalyticsDeviceCompliance: () => get('/core/analytics/device-compliance'),
  // Audit
  getAuditLogs: (params?: { page?: number; employeeId?: string; action?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.employeeId) qs.set('employeeId', params.employeeId);
    if (params?.action) qs.set('action', params.action);
    const q = qs.toString();
    return get(`/core/audit${q ? `?${q}` : ''}`);
  },
};

// ─────────────────────────────────────────────
// Workflows
// ─────────────────────────────────────────────
export const workflowApi = {
  getWorkflows: () => get<WorkflowRule[]>('/core/workflows'),
  createWorkflow: (data: any) => post<WorkflowRule>('/core/workflows', data),
  toggleWorkflow: (id: string) => post<WorkflowRule>(`/core/workflows/${id}/toggle`),
  deleteWorkflow: (id: string) => del(`/core/workflows/${id}`),
  getExecutions: () => get<WorkflowExecution[]>('/core/workflows/executions'),
  testWorkflow: (id: string, employeeId: string) =>
    post(`/core/workflows/${id}/test`, { employeeId }),
};

// ─────────────────────────────────────────────
// HR Module
// ─────────────────────────────────────────────
export const hrApi = {
  getLeaves: () => get<LeaveRequest[]>('/hr/leaves'),
  submitLeave: (data: any) => post<LeaveRequest>('/hr/leaves', data),
  approveLeave: (id: string, approverId?: string) =>
    post(`/hr/leaves/${id}/approve`, { approverId: approverId || 'system' }),
  denyLeave: (id: string, approverId?: string) =>
    post(`/hr/leaves/${id}/deny`, { approverId: approverId || 'system' }),
  getOnboarding: () => get('/hr/onboarding'),
  completeOnboardingTask: (taskId: string) => post(`/hr/onboarding/tasks/${taskId}/complete`),
  getOnboardingTemplates: () => get('/hr/onboarding/template'),
  saveOnboardingTemplate: (data: { name: string; department: string; steps: string[] }) =>
    post('/hr/onboarding/template', data),
  getPerformanceReviews: () => get<PerformanceReview[]>('/hr/performance/reviews'),
  createReview: (data: any) => post('/hr/performance/reviews', data),
  getGoals: () => get<GoalOKR[]>('/hr/performance/goals'),
  updateGoalProgress: (id: string, progress: number, status?: string) =>
    put(`/hr/performance/goals/${id}/progress`, { progress, status }),
  getBenefitsCatalog: () => get<BenefitPlan[]>('/hr/benefits/catalog'),
  getBenefitEnrollments: () => get('/hr/benefits/enrollments'),
  enrollBenefit: (data: { employeeId: string; planId: string; coverageTier?: string }) =>
    post('/hr/benefits/enroll', data),
  getDocuments: () => get('/hr/documents'),
  createDocument: (data: any) => post('/hr/documents', data),
  signDocument: (id: string, signedBy?: string) =>
    post(`/hr/documents/${id}/sign`, { signedBy: signedBy || 'Employee' }),
};

// ─────────────────────────────────────────────
// IT Module
// ─────────────────────────────────────────────
export const itApi = {
  getDevices: () => get<Device[]>('/it/devices'),
  assignDevice: (data: { employeeId: string; deviceType?: string; make?: string; model?: string; serialNumber?: string }) =>
    post<Device>('/it/devices/assign', data),
  lockDevice: (id: string) => post(`/it/devices/${id}/lock`),
  unlockDevice: (id: string) => post(`/it/devices/${id}/unlock`),
  wipeDevice: (id: string) => post(`/it/devices/${id}/wipe`),
  getAppAccesses: () => get<AppAccess[]>('/it/access'),
  getAppCatalog: () => get<AppCatalogItem[]>('/it/catalog'),
  provisionApp: (data: { employeeId: string; appName: string; accessLevel?: string }) =>
    post('/it/access/provision', data),
  revokeApp: (id: string) => post(`/it/access/${id}/revoke`),
  getSecurityPolicies: () => get('/it/security/policies'),
  toggleSecurityPolicy: (id: string) => post(`/it/security/policies/${id}/toggle`),
  getTickets: () => get<SupportTicket[]>('/it/tickets'),
  createTicket: (data: { employeeId?: string; title: string; description: string; category: string; priority?: string }) =>
    post('/it/tickets', data),
  updateTicketStatus: (id: string, status: string) =>
    put(`/it/tickets/${id}/status`, { status }),
};

// ─────────────────────────────────────────────
// Finance Module
// ─────────────────────────────────────────────
export const financeApi = {
  getPayrollRuns: () => get<PayrollRun[]>('/finance/payroll'),
  executePayrollRun: (period?: string) =>
    post('/finance/payroll/run', { period }),
  getExpenses: () => get<Expense[]>('/finance/expenses'),
  submitExpense: (data: { employeeId?: string; category: string; description: string; amount: number }) =>
    post('/finance/expenses', data),
  approveExpense: (id: string) =>
    post(`/finance/expenses/${id}/approve`),
  rejectExpense: (id: string) =>
    post(`/finance/expenses/${id}/reject`),
  getCorporateCards: () => get<CorporateCard[]>('/finance/cards'),
  issueCorporateCard: (data: { employeeId: string; cardType?: string; spendingLimit?: number }) =>
    post('/finance/cards/issue', data),
  toggleCardFreeze: (id: string) => post(`/finance/cards/${id}/toggle-freeze`),
  updateCardLimit: (id: string, spendingLimit: number) =>
    put(`/finance/cards/${id}/limit`, { spendingLimit }),
  getCompensationBands: () => get<CompensationBand[]>('/finance/compensation/bands'),
};

// ─────────────────────────────────────────────
// CRM Module (Sales & Customers)
// ─────────────────────────────────────────────
export const crmApi = {
  getCustomers: () => get<Customer[]>('/crm/customers'),
  getCustomer: (id: string) => get<Customer>(`/crm/customers/${id}`),
  createCustomer: (data: any) => post<Customer>('/crm/customers', data),
  updateCustomer: (id: string, data: Partial<Customer>) => put<Customer>(`/crm/customers/${id}`, data),
  deleteCustomer: (id: string) => del(`/crm/customers/${id}`),
  getDeals: () => get<Deal[]>('/crm/deals'),
  getPipeline: () => get<PipelineStats>('/crm/pipeline'),
  createDeal: (data: Partial<Deal>) => post<Deal>('/crm/deals', data),
  updateDealStage: (id: string, stage: string, probability?: number) =>
    request(`/crm/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage, probability }) }),
  updateDeal: (id: string, data: Partial<Deal>) => put<Deal>(`/crm/deals/${id}`, data),
};

// ─────────────────────────────────────────────
// Projects & Tasks Module
// ─────────────────────────────────────────────
export const projectsApi = {
  getProjects: () => get<Project[]>('/projects'),
  getProject: (id: string) => get<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) => post<Project>('/projects', data),
  updateProject: (id: string, data: Partial<Project>) => put<Project>(`/projects/${id}`, data),
  deleteProject: (id: string) => del(`/projects/${id}`),
  getTasks: (params?: { projectId?: string; assigneeId?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.projectId) qs.set('projectId', params.projectId);
    if (params?.assigneeId) qs.set('assigneeId', params.assigneeId);
    if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
    const q = qs.toString();
    return get<Task[]>(`/projects/tasks/all${q ? `?${q}` : ''}`);
  },
  createTask: (data: Partial<Task>) => post<Task>('/projects/tasks', data),
  updateTaskStatus: (id: string, status: string) =>
    request(`/projects/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateTask: (id: string, data: Partial<Task>) => put<Task>(`/projects/tasks/${id}`, data),
  deleteTask: (id: string) => del(`/projects/tasks/${id}`),
};

// ─────────────────────────────────────────────
// Procurement & Invoicing Module
// ─────────────────────────────────────────────
export const procurementApi = {
  getInvoices: () => get<Invoice[]>('/procurement/invoices'),
  getInvoice: (id: string) => get<Invoice>(`/procurement/invoices/${id}`),
  createInvoice: (data: any) => post<Invoice>('/procurement/invoices', data),
  updateInvoiceStatus: (id: string, status: string) =>
    request(`/procurement/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getVendors: () => get<Vendor[]>('/procurement/vendors'),
  createVendor: (data: Partial<Vendor>) => post<Vendor>('/procurement/vendors', data),
  updateVendor: (id: string, data: Partial<Vendor>) => put<Vendor>(`/procurement/vendors/${id}`, data),
  deleteVendor: (id: string) => del(`/procurement/vendors/${id}`),
  getPurchaseOrders: () => get<PurchaseOrder[]>('/procurement/purchase-orders'),
  createPurchaseOrder: (data: any) => post<PurchaseOrder>('/procurement/purchase-orders', data),
  approvePurchaseOrder: (id: string) => post(`/procurement/purchase-orders/${id}/approve`),
  rejectPurchaseOrder: (id: string) => post(`/procurement/purchase-orders/${id}/reject`),
  updatePurchaseOrderStatus: (id: string, status: string) =>
    request(`/procurement/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─────────────────────────────────────────────
// Workplace & Collaboration Module
// ─────────────────────────────────────────────
export const workplaceApi = {
  getAttendance: (params?: { employeeId?: string; date?: string }) => {
    const qs = new URLSearchParams();
    if (params?.employeeId) qs.set('employeeId', params.employeeId);
    if (params?.date) qs.set('date', params.date);
    const q = qs.toString();
    return get<AttendanceRecord[]>(`/workplace/attendance${q ? `?${q}` : ''}`);
  },
  getTeamStatus: () => get<TeamAttendanceMember[]>('/workplace/attendance/team'),
  clockIn: (employeeId?: string, status?: string, notes?: string) =>
    post('/workplace/attendance/clock-in', { employeeId, status, notes }),
  clockOut: (employeeId?: string) =>
    post('/workplace/attendance/clock-out', { employeeId }),
  getJobs: () => get<JobOpening[]>('/workplace/recruiting/jobs'),
  createJob: (data: Partial<JobOpening>) => post<JobOpening>('/workplace/recruiting/jobs', data),
  getCandidates: (jobId?: string) => {
    const q = jobId ? `?jobId=${jobId}` : '';
    return get<Candidate[]>(`/workplace/recruiting/candidates${q}`);
  },
  createCandidate: (data: Partial<Candidate>) => post<Candidate>('/workplace/recruiting/candidates', data),
  updateCandidateStage: (id: string, stage: string) =>
    request(`/workplace/recruiting/candidates/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  getArticles: (category?: string, search?: string) => {
    const qs = new URLSearchParams();
    if (category && category !== 'ALL') qs.set('category', category);
    if (search) qs.set('search', search);
    const q = qs.toString();
    return get<KnowledgeArticle[]>(`/workplace/knowledge${q ? `?${q}` : ''}`);
  },
  createArticle: (data: Partial<KnowledgeArticle>) => post<KnowledgeArticle>('/workplace/knowledge', data),
  getCourses: () => get<LearningCourse[]>('/workplace/learning'),
  createCourse: (data: Partial<LearningCourse>) => post<LearningCourse>('/workplace/learning', data),
  getChannels: () => get<ChatChannel[]>('/workplace/channels'),
  getMessages: (channelId: string) => get<ChatMessage[]>(`/workplace/channels/${channelId}/messages`),
  postMessage: (channelId: string, content: string, senderName?: string) =>
    post(`/workplace/channels/${channelId}/messages`, { content, senderName }),
  getCalendarEvents: (date?: string) => {
    const q = date ? `?date=${date}` : '';
    return get<CalendarEvent[]>(`/workplace/calendar${q}`);
  },
  createCalendarEvent: (data: Partial<CalendarEvent>) => post<CalendarEvent>('/workplace/calendar', data),
  deleteCalendarEvent: (id: string) => del(`/workplace/calendar/${id}`),
};

// ─────────────────────────────────────────────
// Unified Approvals Queue
// ─────────────────────────────────────────────
export const approvalsApi = {
  getApprovals: () => get<UnifiedApprovalItem[]>('/core/approvals'),
  approveItem: async (type: string, id: string) => {
    if (type === 'leave') return hrApi.approveLeave(id);
    if (type === 'expense') return financeApi.approveExpense(id);
    if (type === 'purchase') return procurementApi.approvePurchaseOrder(id);
    throw new Error(`Unsupported approval type: ${type}`);
  },
  rejectItem: async (type: string, id: string) => {
    if (type === 'leave') return hrApi.denyLeave(id);
    if (type === 'expense') return financeApi.rejectExpense(id);
    if (type === 'purchase') return procurementApi.rejectPurchaseOrder(id);
    throw new Error(`Unsupported approval type: ${type}`);
  },
};

