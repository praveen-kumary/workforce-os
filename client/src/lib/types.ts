// ─────────────────────────────────────────────
// Shared TypeScript Types for Unified Workforce OS
// ─────────────────────────────────────────────

// ─── Auth ────────────────────────────────────────────────
export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
  user: UserProfile;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roleTitle: string;
  department: string;
  avatarUrl?: string;
  status?: string;
  location?: string;
  phone?: string;
  pronouns?: string;
  bio?: string;
  hireDate?: string;
}

// ─── Employee ────────────────────────────────────────────
export type EmployeeStatus = 'ONBOARDING' | 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: EmployeeStatus;
  department: string;
  roleTitle: string;
  employmentType: EmploymentType;
  hireDate: string;
  terminationDate?: string;
  location: string;
  pronouns?: string;
  bio?: string;
  managerId?: string;
  manager?: Partial<Employee>;
  subordinates?: Partial<Employee>[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListResponse {
  data: Employee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Dashboard ───────────────────────────────────────────
export interface DashboardStats {
  kpis: {
    totalEmployees: number;
    activeDevices: number;
    activeWorkflows: number;
    pendingLeaves: number;
    systemHealth: string;
  };
  recentActivity: Array<{
    action: string;
    dept: string;
    time: string;
    color: string;
  }>;
  trendData: Array<{
    name: string;
    employees: number;
    devices: number;
    payroll: number;
  }>;
}

// ─── Leave ───────────────────────────────────────────────
export type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'PARENTAL' | 'BEREAVEMENT' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: Partial<Employee>;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: LeaveStatus;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

// ─── Device ──────────────────────────────────────────────
export type DeviceStatus = 'ACTIVE' | 'LOCKED' | 'WIPED' | 'RETURNED';

export interface Device {
  id: string;
  employeeId?: string;
  employee?: Partial<Employee>;
  deviceType: string;
  make: string;
  model: string;
  serialNumber: string;
  osName: string;
  osVersion: string;
  isEncrypted: boolean;
  batteryHealth: number;
  diskUsageGb: number;
  status: DeviceStatus;
  assignedDate?: string;
  lastCheckIn?: string;
}

// ─── App Access ──────────────────────────────────────────
export interface AppAccess {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  appName: string;
  accessLevel: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  provisionedAt?: string;
  revokedAt?: string;
}

export interface AppCatalogItem {
  id: string;
  name: string;
  category: string;
  logoUrl?: string;
  ssoEnabled: boolean;
  licenseCost: number;
  activeSeats: number;
  totalSeats: number;
}

// ─── Support Ticket ──────────────────────────────────────
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicket {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  title: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Payroll ─────────────────────────────────────────────
export interface PayrollRun {
  id: string;
  period: string;
  payDate: string;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalGross: number;
  totalNet: number;
  totalTax: number;
  employeeCount: number;
  payslips: Payslip[];
  createdAt: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employee?: Partial<Employee>;
  grossPay: number;
  basePay: number;
  taxDeduction: number;
  insuranceDeduction: number;
  retirementDeduction: number;
  otherDeductions: number;
  netPay: number;
  pdfUrl?: string;
  createdAt: string;
}

// ─── Expense ─────────────────────────────────────────────
export type ExpenseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

export interface Expense {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: ExpenseStatus;
  approvedBy?: string;
  submittedAt?: string;
  createdAt: string;
}

// ─── Corporate Card ──────────────────────────────────────
export interface CorporateCard {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  cardNumberMasked: string;
  cardType: string;
  spendingLimit: number;
  currentBalance: number;
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED';
  issuedDate: string;
  expiryDate: string;
}

// ─── Workflow ────────────────────────────────────────────
export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  createdBy: string;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  _count?: { executions: number };
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  rule: { name: string; triggerType: string };
  employeeId: string;
  employee: Partial<Employee>;
  triggeredBy: string;
  status: string;
  actionsLog: any[];
  startedAt: string;
  completedAt?: string;
}

// ─── Notification ────────────────────────────────────────
export interface Notification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION_REQUIRED';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ─── Audit ───────────────────────────────────────────────
export interface AuditLog {
  id: string;
  employeeId: string;
  employee: Partial<Employee>;
  changedBy: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  action: string;
  createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────
export interface HeadcountAnalytics {
  byDepartment: Array<{ name: string; value: number }>;
  byStatus: Array<{ name: string; value: number }>;
  byEmploymentType: Array<{ name: string; value: number }>;
  byLocation: Array<{ name: string; value: number }>;
}

export interface CompensationBand {
  id: string;
  roleTitle: string;
  department: string;
  level: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  equityMin: number;
  equityMax: number;
}

// ─── Benefits ────────────────────────────────────────────
export interface BenefitPlan {
  id: string;
  name: string;
  type: string;
  provider: string;
  description: string;
  monthlyCost: number;
  employerContrib: number;
  _count?: { enrollments: number };
}

// ─── Performance ─────────────────────────────────────────
export interface PerformanceReview {
  id: string;
  employeeId: string;
  employee: Partial<Employee>;
  cycleName: string;
  rating?: number;
  feedback?: string;
  status: string;
  reviewerId?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface GoalOKR {
  id: string;
  employeeId: string;
  employee: Partial<Employee>;
  title: string;
  description?: string;
  progress: number;
  targetDate?: string;
  status: string;
  createdAt: string;
}

// ─── CRM & Sales ─────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  status: 'ACTIVE' | 'LEAD' | 'CHURNED';
  ownerId?: string;
  contacts?: Contact[];
  deals?: Deal[];
  projects?: Project[];
  invoices?: Invoice[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleTitle?: string;
  isPrimary: boolean;
}

export interface Deal {
  id: string;
  customerId: string;
  customer?: Customer;
  name: string;
  amount: number;
  stage: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  probability: number;
  closeDate?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStats {
  dealCount: number;
  totalPipeline: number;
  weightedPipeline: number;
  wonThisMonth: number;
  deals: Deal[];
}

// ─── Projects & Tasks ────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  customerId?: string;
  customer?: Customer;
  managerId?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  budget?: number;
  startDate?: string;
  endDate?: string;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  project?: Project;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assigneeId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

// ─── Procurement & Invoices ──────────────────────────────
export interface Invoice {
  id: string;
  invoiceNum: string;
  customerId: string;
  customer?: Customer;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
  issueDate: string;
  dueDate: string;
  items?: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'REVIEW' | 'INACTIVE';
  purchaseOrders?: PurchaseOrder[];
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor?: Vendor;
  requesterId: string;
  amount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'REJECTED';
  createdAt: string;
}

// ─── Workplace & Collaboration ───────────────────────────
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: Partial<Employee>;
  date: string;
  clockIn: string;
  clockOut?: string;
  hoursWorked?: number;
  status: 'PRESENT' | 'LATE' | 'REMOTE' | 'ON_LEAVE' | 'HALF_DAY';
  notes?: string;
  createdAt: string;
}

export interface TeamAttendanceMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'present' | 'remote' | 'late' | 'leave' | 'offline';
  clockIn: string;
  hours: string;
  avatarUrl?: string;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  description?: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  postedDate: string;
  candidates?: Candidate[];
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  job?: JobOpening;
  name: string;
  email: string;
  phone?: string;
  stage: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'ASSESSMENT' | 'OFFER' | 'HIRED' | 'REJECTED';
  rating?: number;
  source: string;
  resumeUrl?: string;
  appliedDate: string;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  authorId?: string;
  authorName: string;
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningCourse {
  id: string;
  title: string;
  category: string;
  duration: string;
  description?: string;
  isMandatory: boolean;
  enrolledCount: number;
  completedCount: number;
  rating: number;
  status: string;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'public' | 'private';
  topic?: string;
  isPinned: boolean;
  messages?: ChatMessage[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  reactions?: string;
  createdAt: string;
}

export interface UnifiedApprovalItem {
  id: string;
  type: 'leave' | 'expense' | 'purchase' | 'access' | 'hiring';
  title: string;
  requester: string;
  dept: string;
  amount: string;
  submitted: string;
  urgency: 'low' | 'normal' | 'high';
  details: string;
  status: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'interview' | 'review' | 'all_hands' | 'deadline' | string;
  date: string;
  time: string;
  location?: string;
  attendees?: string;
  color?: string;
  createdAt: string;
}


