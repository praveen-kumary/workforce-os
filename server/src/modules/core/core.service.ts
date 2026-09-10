import { prisma } from '../../config/database';

export class CoreService {
  async getNotifications(employeeId: string) {
    return prisma.notification.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllNotificationsRead(employeeId: string) {
    return prisma.notification.updateMany({
      where: { employeeId, isRead: false },
      data: { isRead: true },
    });
  }

  async getSettings() {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Unified Workforce OS',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          slackIntegration: false,
          googleWorkspace: false,
        },
      });
    }
    return settings;
  }

  async updateSettings(data: Record<string, unknown>) {
    const settings = await this.getSettings();
    return prisma.companySettings.update({
      where: { id: settings.id },
      data,
    });
  }

  async globalSearch(query: string) {
    if (!query || query.length < 2) return { employees: [], devices: [], tickets: [] };

    const sanitized = query.trim();

    const [employees, devices, tickets] = await Promise.all([
      prisma.employee.findMany({
        where: {
          OR: [
            { firstName: { contains: sanitized } },
            { lastName: { contains: sanitized } },
            { email: { contains: sanitized } },
            { department: { contains: sanitized } },
            { roleTitle: { contains: sanitized } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          roleTitle: true,
          avatarUrl: true,
          status: true,
        },
        take: 8,
      }),
      prisma.device.findMany({
        where: {
          OR: [
            { serialNumber: { contains: sanitized } },
            { make: { contains: sanitized } },
            { model: { contains: sanitized } },
          ],
        },
        include: {
          employee: { select: { firstName: true, lastName: true } },
        },
        take: 5,
      }),
      prisma.supportTicket.findMany({
        where: {
          OR: [
            { title: { contains: sanitized } },
            { category: { contains: sanitized } },
            { description: { contains: sanitized } },
          ],
        },
        include: {
          employee: { select: { firstName: true, lastName: true } },
        },
        take: 5,
      }),
    ]);

    return { employees, devices, tickets };
  }

  async getUnreadNotificationCount(employeeId: string): Promise<number> {
    return prisma.notification.count({
      where: { employeeId, isRead: false },
    });
  }

  async getUnifiedApprovals() {
    const [leaves, expenses, purchaseOrders] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: { status: 'PENDING' },
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.findMany({
        where: { status: { in: ['SUBMITTED', 'DRAFT'] } },
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: { vendor: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const unified = [
      ...leaves.map(l => ({
        id: l.id,
        type: 'leave',
        title: `${l.leaveType} Leave - ${Number(l.daysCount)} days`,
        requester: `${l.employee.firstName} ${l.employee.lastName}`,
        dept: l.employee.department,
        amount: '',
        submitted: l.createdAt,
        urgency: 'normal',
        details: `${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}`,
        status: l.status,
      })),
      ...expenses.map(e => ({
        id: e.id,
        type: 'expense',
        title: `${e.category}: ${e.description}`,
        requester: `${e.employee.firstName} ${e.employee.lastName}`,
        dept: e.employee.department,
        amount: `$${Number(e.amount).toLocaleString()}`,
        submitted: e.createdAt,
        urgency: Number(e.amount) > 1000 ? 'high' : 'normal',
        details: `Category: ${e.category}`,
        status: e.status,
      })),
      ...purchaseOrders.map(p => ({
        id: p.id,
        type: 'purchase',
        title: `PO #${p.poNumber} - ${p.vendor.name}`,
        requester: 'Procurement Ops',
        dept: 'Finance',
        amount: `$${Number(p.amount).toLocaleString()}`,
        submitted: p.createdAt,
        urgency: Number(p.amount) > 10000 ? 'high' : 'normal',
        details: `Vendor: ${p.vendor.name}`,
        status: p.status,
      })),
    ];

    return unified.sort((a, b) => new Date(b.submitted).getTime() - new Date(a.submitted).getTime());
  }
}

export const coreService = new CoreService();
