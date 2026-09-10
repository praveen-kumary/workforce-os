import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export enum Role {
  SUPER_ADMIN = 'super_admin',
  HR_ADMIN = 'hr_admin',
  IT_ADMIN = 'it_admin',
  FIN_ADMIN = 'fin_admin',
  SALES_ADMIN = 'sales_admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

interface FieldAccess {
  visible: string[] | '*';
  editable?: string[];
  hidden?: string[];
}

export const FIELD_PERMISSIONS: Record<string, { employee?: FieldAccess, customer?: FieldAccess, invoice?: FieldAccess }> = {
  [Role.SUPER_ADMIN]: {
    employee: { visible: '*', editable: ['*'] },
    customer: { visible: '*', editable: ['*'] },
    invoice: { visible: '*', editable: ['*'] }
  },
  [Role.HR_ADMIN]: {
    employee: {
      visible: '*',
      editable: ['department', 'roleTitle', 'managerId', 'status', 'employmentType'],
    },
    customer: { visible: ['id', 'name', 'industry'] }, // Read-only basic info
  },
  [Role.FIN_ADMIN]: {
    employee: { visible: '*', editable: ['salary', 'taxSlab', 'bankName', 'accountNumber', 'routingNumber'] },
    customer: { visible: '*' },
    invoice: { visible: '*', editable: ['*'] }
  },
  [Role.SALES_ADMIN]: {
    employee: { visible: ['id', 'firstName', 'lastName', 'email', 'department'] },
    customer: { visible: '*', editable: ['*'] },
    invoice: { visible: ['id', 'invoiceNum', 'amount', 'status', 'issueDate', 'dueDate'] } // Read-only invoices for sales
  },
  [Role.EMPLOYEE]: {
    employee: {
      visible: ['id', 'firstName', 'lastName', 'email', 'department', 'roleTitle', 'managerId', 'avatarUrl'],
      hidden: ['salary', 'taxSlab', 'bankName', 'accountNumber', 'routingNumber'],
      editable: ['avatarUrl', 'phone'],
    },
  },
};

export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role as Role) && req.user.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
};

export const filterFields = (role: string, entityType: 'employee' | 'customer' | 'invoice', data: any) => {
  const permissions = FIELD_PERMISSIONS[role]?.[entityType];
  
  if (!permissions) return {};
  if (permissions.visible === '*') {
    if (permissions.hidden) {
      const result = { ...data };
      for (const key of permissions.hidden) delete result[key];
      return result;
    }
    return data;
  }

  const result: any = {};
  if (Array.isArray(permissions.visible)) {
    for (const key of permissions.visible) {
      if (data[key] !== undefined) {
        result[key] = data[key];
      }
    }
  }
  return result;
};
