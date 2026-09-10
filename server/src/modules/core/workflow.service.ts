import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorkflowService {
  async getWorkflows() {
    const rules = await prisma.workflowRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { executions: true } },
      },
    });

    return rules.map((r) => ({
      ...r,
      conditions: typeof r.conditions === 'string' ? JSON.parse(r.conditions || '[]') : r.conditions,
      actions: typeof r.actions === 'string' ? JSON.parse(r.actions || '[]') : r.actions,
    }));
  }

  async getWorkflowById(id: string) {
    const r = await prisma.workflowRule.findUniqueOrThrow({
      where: { id },
      include: { executions: { take: 10, orderBy: { startedAt: 'desc' } } },
    });

    return {
      ...r,
      conditions: typeof r.conditions === 'string' ? JSON.parse(r.conditions || '[]') : r.conditions,
      actions: typeof r.actions === 'string' ? JSON.parse(r.actions || '[]') : r.actions,
    };
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    triggerType: string;
    conditions: any[];
    actions: any[];
    createdBy?: string;
  }) {
    return prisma.workflowRule.create({
      data: {
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        conditions: JSON.stringify(data.conditions || []),
        actions: JSON.stringify(data.actions || []),
        createdBy: data.createdBy || 'Super Admin',
        isActive: true,
      },
    });
  }

  async toggleWorkflow(id: string) {
    const rule = await prisma.workflowRule.findUniqueOrThrow({ where: { id } });
    return prisma.workflowRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  async deleteWorkflow(id: string) {
    return prisma.workflowRule.delete({ where: { id } });
  }

  async getExecutions(take = 20) {
    const executions = await prisma.workflowExecution.findMany({
      take,
      orderBy: { startedAt: 'desc' },
      include: {
        rule: { select: { name: true, triggerType: true } },
        employee: { select: { firstName: true, lastName: true, department: true } },
      },
    });

    return executions.map((e) => ({
      ...e,
      actionsLog: typeof e.actionsLog === 'string' ? JSON.parse(e.actionsLog || '[]') : e.actionsLog,
    }));
  }

  async testExecuteWorkflow(ruleId: string, employeeId: string) {
    const rule = await prisma.workflowRule.findUniqueOrThrow({ where: { id: ruleId } });
    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: employeeId } });

    // Execute actions simulation
    const actions: any[] = typeof rule.actions === 'string' ? JSON.parse(rule.actions || '[]') : (rule.actions as any);
    const actionLogs = actions.map((act) => ({
      action: act.type || 'custom_action',
      details: act.params || {},
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    }));

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        ruleId: rule.id,
        employeeId: employee.id,
        triggeredBy: `Manual Test (${rule.triggerType})`,
        status: 'COMPLETED',
        actionsLog: JSON.stringify(actionLogs),
        completedAt: new Date(),
      },
    });

    // Update execution count on rule
    await prisma.workflowRule.update({
      where: { id: ruleId },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
      },
    });

    return execution;
  }

  async seedDefaultWorkflows() {
    const count = await prisma.workflowRule.count();
    if (count > 0) return;

    const defaultRules = [
      {
        name: 'Auto-Provision Dev Stack on Hire',
        description: 'Provisions GitHub, AWS, Datadog & assigns MacBook Pro M3 when a developer joins.',
        triggerType: 'employee.hired',
        conditions: JSON.stringify([{ field: 'department', operator: 'equals', value: 'Engineering' }]),
        actions: JSON.stringify([
          { type: 'provision_app', params: { appName: 'GitHub Enterprise', role: 'Developer' } },
          { type: 'provision_app', params: { appName: 'AWS Cloud Console', role: 'DevEnv' } },
          { type: 'assign_device', params: { make: 'Apple', model: 'MacBook Pro 16" M3 Max' } },
          { type: 'send_slack_notification', params: { channel: '#eng-announcements', message: 'Welcome to the team!' } },
        ]),
        isActive: true,
        createdBy: 'System Engine',
      },
      {
        name: 'Instant Security Kill-Switch on Termination',
        description: 'Revokes all SSO tokens, locks assigned laptops, and freezes corporate card instantly.',
        triggerType: 'employee.terminated',
        conditions: '[]',
        actions: JSON.stringify([
          { type: 'revoke_all_sso', params: { forceSignOut: true } },
          { type: 'remote_device_lock', params: { wipeDataOnNextBoot: false } },
          { type: 'freeze_corporate_card', params: { status: 'FROZEN' } },
          { type: 'calculate_final_pay', params: { includePtoPayout: true } },
        ]),
        isActive: true,
        createdBy: 'Security Ops',
      },
    ];

    for (const rule of defaultRules) {
      await prisma.workflowRule.create({ data: rule });
    }
  }
}

export const workflowService = new WorkflowService();
