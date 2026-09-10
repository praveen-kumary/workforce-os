import { z } from 'zod';

// ─── Device Schemas ─────────────────────────────────────
export const assignDeviceSchema = z.object({
  employeeId: z.string().uuid(),
  deviceType: z.enum(['Laptop', 'Desktop', 'Monitor', 'Mobile', 'Tablet']).default('Laptop'),
  make: z.string().min(1).max(100).default('Apple'),
  model: z.string().min(1).max(200).default('MacBook Pro 16" M3 Max'),
});

// ─── App Provisioning Schemas ───────────────────────────
export const provisionAppSchema = z.object({
  employeeId: z.string().uuid(),
  appName: z.string().min(1).max(200),
  accessLevel: z.enum(['Admin', 'Member', 'Viewer', 'Developer', 'Manager']).default('Member'),
});

// ─── Ticket Schemas ─────────────────────────────────────
export const createTicketSchema = z.object({
  employeeId: z.string().uuid().optional(),
  title: z.string().min(3).max(300),
  description: z.string().min(5).max(5000),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'ACCESS', 'SECURITY', 'NETWORK', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
});
