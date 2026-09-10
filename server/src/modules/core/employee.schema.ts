import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().min(1),
  roleTitle: z.string().min(1),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']).default('FULL_TIME'),
  hireDate: z.string().datetime(),
  managerId: z.string().uuid().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().min(1).optional(),
  roleTitle: z.string().min(1).optional(),
  status: z.enum(['ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  managerId: z.string().uuid().optional(),
});
