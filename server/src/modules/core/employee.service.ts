import { prisma } from '../../config/database';
import { eventBus } from '../../events/event-bus';
import { EmployeeEvent, EmployeeHiredPayload, EmployeeTerminatedPayload } from '../../events/event-types';
import { auditService } from './audit.service';

export class EmployeeService {
  async createEmployee(data: any, changedBy: string) {
    const employee = await prisma.employee.create({
      data: {
        ...data,
      }
    });

    await auditService.trackChanges({
      employeeId: employee.id,
      oldValues: {},
      newValues: employee,
      changedBy,
      action: 'create'
    });

    // Medusa Pattern: Event Emission
    const payload: EmployeeHiredPayload = {
      employeeId: employee.id,
      department: employee.department,
      roleTitle: employee.roleTitle,
      email: employee.email,
    };
    
    await eventBus.emit(EmployeeEvent.HIRED, payload, { transactionId: employee.id });

    return employee;
  }

  async updateEmployee(id: string, data: any, changedBy: string) {
    const oldEmployee = await prisma.employee.findUniqueOrThrow({ where: { id } });
    
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data
    });

    await auditService.trackChanges({
      employeeId: id,
      oldValues: oldEmployee,
      newValues: updatedEmployee,
      changedBy,
      action: 'update'
    });

    // Check specific status changes for event propagation
    if (oldEmployee.status !== 'TERMINATED' && updatedEmployee.status === 'TERMINATED') {
      const payload: EmployeeTerminatedPayload = {
        employeeId: id,
        terminationDate: new Date().toISOString()
      };
      await eventBus.emit(EmployeeEvent.TERMINATED, payload, { transactionId: id });
    } else if (oldEmployee.roleTitle !== updatedEmployee.roleTitle) {
      await eventBus.emit(EmployeeEvent.PROMOTED, {
        employeeId: id,
        oldRole: oldEmployee.roleTitle,
        newRole: updatedEmployee.roleTitle
      });
    }

    return updatedEmployee;
  }

  async getEmployee(id: string) {
    return prisma.employee.findUniqueOrThrow({ 
      where: { id },
      include: { manager: true, subordinates: true } 
    });
  }

  async getEmployeeProfile360(id: string) {
    return prisma.employee.findUniqueOrThrow({
      where: { id },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, roleTitle: true, email: true, avatarUrl: true }
        },
        subordinates: {
          select: { id: true, firstName: true, lastName: true, roleTitle: true, email: true, avatarUrl: true, department: true }
        },
        devices: {
          orderBy: { assignedDate: 'desc' }
        },
        appAccesses: {
          orderBy: { provisionedAt: 'desc' }
        },
        payrollProfile: true,
        payslips: {
          take: 6,
          orderBy: { createdAt: 'desc' }
        },
        expenses: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        corporateCard: true,
        leaveRequests: {
          orderBy: { createdAt: 'desc' }
        },
        leaveBalances: true,
        onboardingTasks: {
          orderBy: { stepOrder: 'asc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        performanceReviews: {
          orderBy: { createdAt: 'desc' }
        },
        goals: {
          orderBy: { createdAt: 'desc' }
        },
        benefitEnrollments: {
          include: { plan: true }
        },
        compensationHistories: {
          orderBy: { effectiveDate: 'desc' }
        },
        auditLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async offboardEmployee(id: string, options: { reason?: string; lastDate?: string; revokeAccess?: boolean; returnDevices?: boolean; changedBy: string }) {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        terminationDate: options.lastDate ? new Date(options.lastDate) : new Date(),
      }
    });

    if (options.revokeAccess) {
      await prisma.appAccess.updateMany({
        where: { employeeId: id },
        data: { status: 'REVOKED', revokedAt: new Date() }
      });
    }

    if (options.returnDevices) {
      await prisma.device.updateMany({
        where: { employeeId: id },
        data: { status: 'LOCKED' }
      });
    }

    // Freeze corporate card
    await prisma.corporateCard.updateMany({
      where: { employeeId: id },
      data: { status: 'FROZEN' }
    });

    await auditService.trackChanges({
      employeeId: id,
      oldValues: { status: 'ACTIVE' },
      newValues: { status: 'TERMINATED', reason: options.reason },
      changedBy: options.changedBy,
      action: 'offboard'
    });

    const payload: EmployeeTerminatedPayload = {
      employeeId: id,
      terminationDate: new Date().toISOString()
    };
    await eventBus.emit(EmployeeEvent.TERMINATED, payload, { transactionId: id });

    return employee;
  }

  async getEmployees(params: {
    search?: string;
    department?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Department filter
    if (params.department && params.department !== 'ALL') {
      where.department = params.department;
    }

    // Status filter
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    // Search across name, email, department, role
    if (params.search && params.search.length >= 2) {
      where.OR = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { email: { contains: params.search } },
        { roleTitle: { contains: params.search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          devices: { select: { id: true, status: true, deviceType: true } },
          appAccesses: { select: { id: true, appName: true, status: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}

export const employeeService = new EmployeeService();

