import { randomBytes, randomInt } from 'crypto';
import { prisma } from '../../config/database';
import { notificationService } from '../core/notification.service';
import { logger } from '../../config/logger';

const itLogger = logger.child({ module: 'it-service' });

/**
 * Generate a production-safe serial number (no faker dependency).
 */
function generateSerialNumber(): string {
  return `SN-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export class ITService {
  async getAllDevices() {
    return prisma.device.findMany({
      include: {
        employee: {
          select: { firstName: true, lastName: true, department: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { assignedDate: 'desc' },
    });
  }

  async assignDevice(employeeId: string, deviceType = 'Laptop', make = 'Apple', model = 'MacBook Pro 16" M3 Max') {
    const device = await prisma.device.create({
      data: {
        employeeId,
        deviceType,
        make,
        model,
        serialNumber: generateSerialNumber(),
        osName: make === 'Apple' ? 'macOS Sequoia' : 'Windows 11 Pro',
        osVersion: make === 'Apple' ? '15.1' : '24H2',
        isEncrypted: true,
        batteryHealth: randomInt(90, 101),
        diskUsageGb: randomInt(45, 420),
        status: 'ACTIVE',
        assignedDate: new Date(),
        lastCheckIn: new Date(),
      },
    });

    // Notify employee
    await notificationService.onDeviceAssigned(employeeId, `${make} ${model}`);
    itLogger.info('Device assigned', { employeeId, deviceType, make, model, deviceId: device.id });

    return device;
  }

  async lockDevice(deviceId: string) {
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: { status: 'LOCKED' },
      include: { employee: { select: { id: true } } },
    });
    itLogger.info('Device locked', { deviceId });
    return device;
  }

  async wipeDevice(deviceId: string) {
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: { status: 'WIPED' },
    });
    itLogger.info('Device wiped', { deviceId });
    return device;
  }

  async unlockDevice(deviceId: string) {
    return prisma.device.update({
      where: { id: deviceId },
      data: { status: 'ACTIVE' },
    });
  }

  // ─── App Access & SSO Catalog ───────────────────────────
  async getAllAppAccesses() {
    return prisma.appAccess.findMany({
      include: {
        employee: {
          select: { firstName: true, lastName: true, department: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { provisionedAt: 'desc' },
    });
  }

  async getAppCatalog() {
    let apps = await prisma.appCatalogItem.findMany({
      orderBy: { name: 'asc' },
    });

    if (apps.length === 0) {
      await this.seedDefaultAppCatalog();
      apps = await prisma.appCatalogItem.findMany({ orderBy: { name: 'asc' } });
    }

    return apps;
  }

  async provisionApp(employeeId: string, appName: string, accessLevel = 'Member') {
    const existing = await prisma.appAccess.findFirst({
      where: { employeeId, appName, status: 'ACTIVE' },
    });
    if (existing) return existing;

    const access = await prisma.appAccess.create({
      data: {
        employeeId,
        appName,
        accessLevel,
        status: 'ACTIVE',
        provisionedAt: new Date(),
      },
    });

    await prisma.appCatalogItem.updateMany({
      where: { name: appName },
      data: { activeSeats: { increment: 1 } },
    });

    itLogger.info('App provisioned', { employeeId, appName, accessLevel });
    return access;
  }

  async revokeApp(accessId: string) {
    const access = await prisma.appAccess.update({
      where: { id: accessId },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    await prisma.appCatalogItem.updateMany({
      where: { name: access.appName },
      data: { activeSeats: { decrement: 1 } },
    });

    itLogger.info('App revoked', { accessId, appName: access.appName });
    return access;
  }

  async autoProvisionApps(employeeId: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return;

    const appsToProvision = ['Google Workspace', 'Slack', '1Password', 'Zoom'];

    if (employee.department === 'Engineering') {
      appsToProvision.push('GitHub Enterprise', 'AWS Console', 'Datadog', 'Jira Software');
    } else if (employee.department === 'Sales') {
      appsToProvision.push('Salesforce CRM', 'ZoomInfo', 'HubSpot', 'Gong.io');
    } else if (employee.department === 'Finance') {
      appsToProvision.push('NetSuite ERP', 'Expensify', 'Ramp');
    } else if (employee.department === 'Marketing') {
      appsToProvision.push('Figma Enterprise', 'Notion', 'Webflow');
    } else if (employee.department === 'HR') {
      appsToProvision.push('BambooHR', 'Lattice', 'Culture Amp');
    }

    for (const app of appsToProvision) {
      await this.provisionApp(employeeId, app, 'Member');
    }

    itLogger.info('Auto-provisioned apps', { employeeId, count: appsToProvision.length });
  }

  // ─── Security & Policies ────────────────────────────────
  async getSecurityPolicies() {
    let policies = await prisma.securityPolicy.findMany();
    if (policies.length === 0) {
      await this.seedDefaultSecurityPolicies();
      policies = await prisma.securityPolicy.findMany();
    }
    return policies;
  }

  async toggleSecurityPolicy(id: string) {
    const policy = await prisma.securityPolicy.findUniqueOrThrow({ where: { id } });
    return prisma.securityPolicy.update({
      where: { id },
      data: { enforced: !policy.enforced },
    });
  }

  // ─── Support Desk ──────────────────────────────────────
  async getTickets() {
    return prisma.supportTicket.findMany({
      include: {
        employee: {
          select: { firstName: true, lastName: true, department: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTicket(employeeId: string, title: string, description: string, category: string, priority: string) {
    const ticket = await prisma.supportTicket.create({
      data: {
        employeeId,
        title,
        description,
        category,
        priority: (priority as any) || 'MEDIUM',
        status: 'OPEN',
      },
    });
    itLogger.info('Ticket created', { ticketId: ticket.id, category, priority });
    return ticket;
  }

  async updateTicketStatus(ticketId: string, status: string) {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: status as any },
      include: { employee: { select: { id: true } } },
    });

    // Notify the ticket owner
    if (ticket.employee?.id) {
      await notificationService.onTicketUpdated(ticket.employee.id, ticket.title, status);
    }

    return ticket;
  }

  private async seedDefaultAppCatalog() {
    const catalog = [
      { name: 'Google Workspace', category: 'COMMUNICATION', licenseCost: 18.0, totalSeats: 250, activeSeats: 180 },
      { name: 'Slack Enterprise', category: 'COMMUNICATION', licenseCost: 15.0, totalSeats: 250, activeSeats: 210 },
      { name: '1Password Business', category: 'SECURITY', licenseCost: 8.0, totalSeats: 250, activeSeats: 195 },
      { name: 'GitHub Enterprise', category: 'DEVELOPMENT', licenseCost: 21.0, totalSeats: 100, activeSeats: 65 },
      { name: 'AWS Cloud Console', category: 'DEVELOPMENT', licenseCost: 45.0, totalSeats: 80, activeSeats: 48 },
      { name: 'Salesforce CRM', category: 'SALES', licenseCost: 85.0, totalSeats: 60, activeSeats: 42 },
      { name: 'Figma Enterprise', category: 'PRODUCTIVITY', licenseCost: 45.0, totalSeats: 40, activeSeats: 28 },
      { name: 'Datadog Monitoring', category: 'DEVELOPMENT', licenseCost: 35.0, totalSeats: 50, activeSeats: 35 },
      { name: 'Notion Team', category: 'PRODUCTIVITY', licenseCost: 10.0, totalSeats: 200, activeSeats: 160 },
      { name: 'NetSuite ERP', category: 'FINANCE', licenseCost: 120.0, totalSeats: 30, activeSeats: 22 },
    ];

    for (const item of catalog) {
      await prisma.appCatalogItem.create({ data: item });
    }
  }

  private async seedDefaultSecurityPolicies() {
    const policies = [
      {
        name: 'Full-Disk FileVault / BitLocker Encryption',
        description: 'Enforces AES-256 hardware encryption on all fleet macOS and Windows laptops.',
        category: 'ENCRYPTION',
        enforced: true,
        complianceRate: 99,
      },
      {
        name: 'Universal Hardware FIDO2 / WebAuthn MFA',
        description: 'Mandatory hardware security key or biometric authentication for single sign-on.',
        category: 'MFA',
        enforced: true,
        complianceRate: 96,
      },
      {
        name: 'Automatic Zero-Day OS Patch Window',
        description: 'Devices must install critical operating system security updates within 7 days.',
        category: 'OS_UPDATE',
        enforced: true,
        complianceRate: 94,
      },
      {
        name: 'Zero-Trust Device Health Attestation',
        description: 'Blocks corporate access if antivirus or endpoint agent is disabled or out of date.',
        category: 'SECURITY',
        enforced: true,
        complianceRate: 97,
      },
    ];

    for (const policy of policies) {
      await prisma.securityPolicy.create({ data: policy });
    }
  }
}

export const itService = new ITService();
