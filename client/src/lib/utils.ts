export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export type StatusBadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'workflow';

/** Helper to auto-map common status strings to badge variants */
export function statusVariant(status: string): StatusBadgeVariant {
  const s = status?.toUpperCase();
  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'SIGNED', 'ENROLLED', 'RESOLVED', 'PAID', 'ON_TIME'].includes(s)) return 'success';
  if (['PENDING', 'ONBOARDING', 'DRAFT', 'SELF_REVIEW', 'SUBMITTED', 'SENT'].includes(s)) return 'info';
  if (['ON_LEAVE', 'IN_PROGRESS', 'PROCESSING', 'BEHIND', 'FROZEN', 'ON_HOLD', 'OVERDUE'].includes(s)) return 'warning';
  if (['TERMINATED', 'REJECTED', 'WIPED', 'LOCKED', 'CANCELLED', 'REVOKED', 'FAILED', 'CLOSED', 'LATE'].includes(s)) return 'error';
  return 'neutral';
}
