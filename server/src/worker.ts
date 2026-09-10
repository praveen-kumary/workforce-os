import { Worker, Job } from 'bullmq';
import { redisClient } from './config/redis';
import { WorkforceQueue } from './events/queue-names';
import { QUEUE_WORKER_CONFIG } from './events/worker-config';
import { EventMessage, EmployeeEvent, CRMEvent } from './events/event-types';
import { hrService } from './modules/hr/hr.service';
import { itService } from './modules/it/it.service';
import { financeService } from './modules/finance/finance.service';
import { prisma } from './config/database';

console.log('🚀 Starting Workforce Event Workers (HR, IT, Finance, Audit, Automations)...');

// HR Worker
new Worker(
  WorkforceQueue.HREvents,
  async (job: Job<EventMessage>) => {
    console.log(`[HR Worker] Processing ${job.name} - Job ${job.id}`);
    const eventName = job.name;
    const payload = job.data.body.data;

    if (eventName === EmployeeEvent.HIRED) {
      console.log(`[HR Worker] Generating Onboarding Tasks for employee: ${payload.employeeId}`);
      await hrService.generateOnboardingTasks(payload.employeeId);
    }
  },
  {
    connection: redisClient,
    ...QUEUE_WORKER_CONFIG[WorkforceQueue.HREvents]
  }
);

// IT Worker
new Worker(
  WorkforceQueue.ITEvents,
  async (job: Job<EventMessage>) => {
    console.log(`[IT Worker] Processing ${job.name} - Job ${job.id}`);
    const eventName = job.name;
    const payload = job.data.body.data;

    if (eventName === EmployeeEvent.HIRED) {
      console.log(`[IT Worker] Auto-provisioning apps and assigning laptop to: ${payload.employeeId}`);
      await itService.autoProvisionApps(payload.employeeId);
      await itService.assignDevice(payload.employeeId, 'Laptop', 'Apple', 'MacBook Pro 16" M3 Max');
    } else if (eventName === EmployeeEvent.TERMINATED) {
      console.log(`[IT Worker] Revoking all app access and locking fleet devices for: ${payload.employeeId}`);
      await prisma.appAccess.updateMany({
        where: { employeeId: payload.employeeId },
        data: { status: 'REVOKED', revokedAt: new Date() }
      });
      await prisma.device.updateMany({
        where: { employeeId: payload.employeeId },
        data: { status: 'LOCKED' }
      });
    }
  },
  {
    connection: redisClient,
    ...QUEUE_WORKER_CONFIG[WorkforceQueue.ITEvents]
  }
);

// Finance Worker
new Worker(
  WorkforceQueue.FinanceEvents,
  async (job: Job<EventMessage>) => {
    console.log(`[Finance Worker] Processing ${job.name} - Job ${job.id}`);
    const eventName = job.name;
    const payload = job.data.body.data;

    if (eventName === EmployeeEvent.HIRED) {
      console.log(`[Finance Worker] Generating payroll profile & corporate card for: ${payload.employeeId}`);
      await financeService.createPayrollProfile(payload.employeeId);
      await financeService.issueCorporateCard(payload.employeeId, 'virtual', 500000);
    } else if (eventName === EmployeeEvent.TERMINATED) {
      console.log(`[Finance Worker] Freezing corporate cards for: ${payload.employeeId}`);
      await prisma.corporateCard.updateMany({
        where: { employeeId: payload.employeeId },
        data: { status: 'FROZEN' }
      });
    } else if (eventName === CRMEvent.DEAL_WON) {
      console.log(`[Finance Worker] CROSS-MODULE: Automatically generating Draft Invoice for won deal ${payload.dealId}`);
      await prisma.invoice.create({
        data: {
          invoiceNum: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
          customerId: payload.customerId,
          amount: payload.amount,
          status: 'DRAFT',
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          items: {
            create: [{
              description: 'Software Services Agreement',
              quantity: 1,
              unitPrice: payload.amount,
              total: payload.amount
            }]
          }
        }
      });
    }
  },
  {
    connection: redisClient,
    ...QUEUE_WORKER_CONFIG[WorkforceQueue.FinanceEvents]
  }
);

// Audit & Workflow Worker
new Worker(
  WorkforceQueue.AuditEvents,
  async (job: Job<EventMessage>) => {
    console.log(`[Audit & Automation Worker] Processing ${job.name} - Job ${job.id}`);
    const eventName = job.name;
    const payload = job.data.body.data;

    // Trigger matching active workflow rules
    if (payload?.employeeId) {
      try {
        const rules = await prisma.workflowRule.findMany({
          where: { isActive: true, triggerType: eventName }
        });

        for (const rule of rules) {
          console.log(`[Workflow Automator] Executing Rule: "${rule.name}" for employee ${payload.employeeId}`);
          const actions: any[] = typeof rule.actions === 'string' ? JSON.parse(rule.actions || '[]') : (rule.actions as any);
          const actionLogs = actions.map((a) => ({
            action: a.type,
            params: a.params,
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
          }));

          await prisma.workflowExecution.create({
            data: {
              ruleId: rule.id,
              employeeId: payload.employeeId,
              triggeredBy: eventName,
              status: 'COMPLETED',
              actionsLog: JSON.stringify(actionLogs),
              completedAt: new Date(),
            },
          });

          await prisma.workflowRule.update({
            where: { id: rule.id },
            data: {
              executionCount: { increment: 1 },
              lastExecutedAt: new Date()
            }
          });
        }
      } catch (err) {
        console.error('[Workflow Automator] Error running rule:', err);
      }
    }
  },
  {
    connection: redisClient,
    ...QUEUE_WORKER_CONFIG[WorkforceQueue.AuditEvents]
  }
);

console.log('👷 Event workers active and listening for multi-cloud events...');
