import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

const notifLogger = logger.child({ module: 'notifications' });

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION_REQUIRED';

export interface CreateNotificationPayload {
  employeeId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

class NotificationService {
  /**
   * Create a single notification for an employee.
   */
  async create(payload: CreateNotificationPayload): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          employeeId: payload.employeeId,
          title: payload.title,
          message: payload.message,
          type: payload.type || 'INFO',
          link: payload.link,
        },
      });
    } catch (err) {
      notifLogger.error('Failed to create notification', { error: err, payload });
    }
  }

  /**
   * Notify multiple employees at once.
   */
  async broadcast(employeeIds: string[], payload: Omit<CreateNotificationPayload, 'employeeId'>): Promise<void> {
    try {
      await prisma.notification.createMany({
        data: employeeIds.map(id => ({
          employeeId: id,
          title: payload.title,
          message: payload.message,
          type: payload.type || 'INFO',
          link: payload.link,
        })),
      });
    } catch (err) {
      notifLogger.error('Failed to broadcast notifications', { error: err });
    }
  }

  /**
   * Notify all admins (super_admin, hr_admin, it_admin, fin_admin).
   */
  async notifyAdmins(payload: Omit<CreateNotificationPayload, 'employeeId'>): Promise<void> {
    const admins = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        roleTitle: {
          in: ['CEO', 'CTO', 'VP Engineering', 'VP HR', 'VP Finance', 'Director of HR', 'Head of IT'],
        },
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.broadcast(admins.map(a => a.id), payload);
    }
  }

  // ─── Event-Driven Notifications ─────────────────────────

  async onEmployeeHired(employeeId: string, name: string, department: string): Promise<void> {
    // Notify the new employee
    await this.create({
      employeeId,
      title: 'Welcome to the team! 🎉',
      message: `Welcome aboard! Your onboarding tasks are ready. Let's get you set up.`,
      type: 'SUCCESS',
      link: `/onboarding/new`,
    });

    // Notify admins
    await this.notifyAdmins({
      title: 'New Employee Joined',
      message: `${name} has joined the ${department} team.`,
      type: 'INFO',
      link: `/employees/${employeeId}`,
    });
  }

  async onLeaveApproved(employeeId: string, leaveType: string, days: number): Promise<void> {
    await this.create({
      employeeId,
      title: 'Leave Request Approved ✅',
      message: `Your ${leaveType} leave request for ${days} days has been approved.`,
      type: 'SUCCESS',
    });
  }

  async onLeaveRejected(employeeId: string, leaveType: string): Promise<void> {
    await this.create({
      employeeId,
      title: 'Leave Request Denied',
      message: `Your ${leaveType} leave request has been denied. Contact your manager for details.`,
      type: 'WARNING',
    });
  }

  async onExpenseApproved(employeeId: string, amount: number): Promise<void> {
    const formatted = `$${(amount / 100).toFixed(2)}`;
    await this.create({
      employeeId,
      title: 'Expense Approved 💰',
      message: `Your expense of ${formatted} has been approved and will be reimbursed.`,
      type: 'SUCCESS',
    });
  }

  async onExpenseRejected(employeeId: string, amount: number): Promise<void> {
    const formatted = `$${(amount / 100).toFixed(2)}`;
    await this.create({
      employeeId,
      title: 'Expense Rejected',
      message: `Your expense of ${formatted} has been rejected. Please review and resubmit if needed.`,
      type: 'WARNING',
    });
  }

  async onPayrollProcessed(employeeId: string, period: string, netPay: number): Promise<void> {
    const formatted = `$${(netPay / 100).toFixed(2)}`;
    await this.create({
      employeeId,
      title: 'Payslip Available 📄',
      message: `Your payslip for ${period} is ready. Net pay: ${formatted}.`,
      type: 'SUCCESS',
      link: '/finance',
    });
  }

  async onDeviceAssigned(employeeId: string, deviceModel: string): Promise<void> {
    await this.create({
      employeeId,
      title: 'Device Assigned 💻',
      message: `A ${deviceModel} has been assigned to you. Check your IT dashboard for details.`,
      type: 'INFO',
      link: '/it',
    });
  }

  async onTicketUpdated(employeeId: string, ticketTitle: string, newStatus: string): Promise<void> {
    await this.create({
      employeeId,
      title: `Ticket Update: ${newStatus}`,
      message: `Your ticket "${ticketTitle}" has been updated to ${newStatus}.`,
      type: newStatus === 'RESOLVED' ? 'SUCCESS' : 'INFO',
    });
  }
}

export const notificationService = new NotificationService();
