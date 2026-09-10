import { z } from 'zod';

// ─── Payroll Schemas ────────────────────────────────────
export const executePayrollRunSchema = z.object({
  period: z.string().min(1).max(200).optional(),
});

// ─── Expense Schemas ────────────────────────────────────
export const submitExpenseSchema = z.object({
  employeeId: z.string().uuid().optional(),
  category: z.enum(['TRAVEL', 'SOFTWARE', 'OFFICE', 'MEALS', 'WELLNESS', 'EQUIPMENT', 'TRAINING', 'OTHER']),
  description: z.string().min(3).max(1000),
  amount: z.number().positive().max(10000000), // Max $100,000 in cents
});

// ─── Corporate Card Schemas ─────────────────────────────
export const issueCardSchema = z.object({
  employeeId: z.string().uuid(),
  cardType: z.enum(['virtual', 'physical']).default('virtual'),
  spendingLimit: z.number().positive().max(100000000).default(500000), // Default $5,000
});

export const updateCardLimitSchema = z.object({
  spendingLimit: z.number().positive().max(100000000),
});
