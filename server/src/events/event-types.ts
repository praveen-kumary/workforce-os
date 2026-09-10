export enum EmployeeEvent {
  HIRED = 'employee.hired',
  TERMINATED = 'employee.terminated',
  PROMOTED = 'employee.promoted',
  UPDATED = 'employee.updated',
}

export enum CRMEvent {
  DEAL_WON = 'crm.deal.won',
  DEAL_LOST = 'crm.deal.lost',
}

export interface DealWonPayload {
  dealId: string;
  customerId: string;
  amount: number;
}

export interface EmployeeHiredPayload {
  employeeId: string;
  department: string;
  roleTitle: string;
  email: string;
}

export interface EmployeeTerminatedPayload {
  employeeId: string;
  terminationDate: string;
}

export interface EventMessage<T = any> {
  eventName: string;
  body: {
    data: T;
    metadata?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}
