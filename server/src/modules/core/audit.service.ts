import { prisma } from '../../config/database';
import { eventBus } from '../../events/event-bus';
import { EmployeeEvent } from '../../events/event-types';

export class AuditService {
  async trackChanges(params: {
    employeeId: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    changedBy: string;
    action: string;
  }) {
    const changes = Object.keys(params.newValues)
      .filter((key) => params.oldValues[key] !== params.newValues[key])
      .map((key) => ({
        employeeId: params.employeeId,
        fieldName: key,
        oldValue: String(params.oldValues[key] ?? ''),
        newValue: String(params.newValues[key]),
        changedBy: params.changedBy,
        action: params.action,
      }));

    if (changes.length > 0) {
      await prisma.auditLog.createMany({ data: changes });
      
      // Also emit a generic update event if not explicitly handled
      if (params.action === 'update') {
         await eventBus.emit(EmployeeEvent.UPDATED, {
           employeeId: params.employeeId,
           changes
         });
      }
    }
  }
}

export const auditService = new AuditService();
