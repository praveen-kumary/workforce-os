import { z } from 'zod';

// ─── Leave Request Schemas ──────────────────────────────
export const submitLeaveSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(['ANNUAL', 'SICK', 'PERSONAL', 'PARENTAL', 'BEREAVEMENT', 'UNPAID']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  daysCount: z.number().positive().max(365),
  notes: z.string().max(500).optional(),
});

export const leaveActionSchema = z.object({
  approverId: z.string().optional(),
});

// ─── Onboarding Template Schema ─────────────────────────
export const onboardingTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  department: z.string().min(1).max(100),
  steps: z.array(z.string().min(1)).min(1).max(50),
});

// ─── Performance Review Schema ──────────────────────────
export const createReviewSchema = z.object({
  employeeId: z.string().uuid(),
  cycleName: z.string().min(1).max(200),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(5000).optional(),
  reviewerId: z.string().optional(),
});

// ─── Goal Progress Schema ───────────────────────────────
export const updateGoalProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  status: z.enum(['ON_TRACK', 'AT_RISK', 'BEHIND', 'COMPLETED']).optional(),
});

// ─── Benefit Enrollment Schema ──────────────────────────
export const enrollBenefitSchema = z.object({
  employeeId: z.string().uuid(),
  planId: z.string().uuid(),
  coverageTier: z.enum(['INDIVIDUAL', 'FAMILY', 'PLUS_ONE']).default('INDIVIDUAL'),
});

// ─── Document Schema ────────────────────────────────────
export const createDocumentSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().min(1).max(300),
  category: z.enum(['OFFER_LETTER', 'NDA', 'W4_TAX', 'I9_FORM', 'HANDBOOK', 'POLICY', 'OTHER']),
});

export const signDocumentSchema = z.object({
  signedBy: z.string().min(1).optional(),
});
