import { prisma } from '../../config/database';
import { notificationService } from '../core/notification.service';
import { logger } from '../../config/logger';

const hrLogger = logger.child({ module: 'hr-service' });

export class HRService {
  // ─── Leave Management ──────────────────────────────────
  async getAllLeaveRequests() {
    return prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: { firstName: true, lastName: true, department: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitLeaveRequest(data: {
    employeeId: string;
    leaveType: any;
    startDate: string;
    endDate: string;
    daysCount: number;
    notes?: string;
  }) {
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        daysCount: data.daysCount,
        notes: data.notes,
        status: 'PENDING',
      },
    });

    // Update pending balance
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: data.employeeId, leaveType: data.leaveType },
    });
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: Number(balance.pendingDays) + data.daysCount },
      });
    }

    hrLogger.info('Leave request submitted', { leaveId: leave.id, employeeId: data.employeeId, type: data.leaveType });
    return leave;
  }

  async approveLeave(leaveId: string, approverId: string) {
    return prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: { status: 'APPROVED', approvedBy: approverId },
      });

      const balance = await tx.leaveBalance.findFirst({
        where: { employeeId: leave.employeeId, leaveType: leave.leaveType },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: Number(balance.usedDays) + Number(leave.daysCount),
            pendingDays: Math.max(0, Number(balance.pendingDays) - Number(leave.daysCount)),
          },
        });
      }

      await notificationService.onLeaveApproved(leave.employeeId, leave.leaveType, Number(leave.daysCount));
      hrLogger.info('Leave approved', { leaveId, approverId });
      return leave;
    });
  }

  async denyLeave(leaveId: string, approverId: string) {
    const leave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: 'REJECTED', approvedBy: approverId },
    });

    // Release pending balance
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: leave.employeeId, leaveType: leave.leaveType },
    });
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: Math.max(0, Number(balance.pendingDays) - Number(leave.daysCount)) },
      });
    }

    await notificationService.onLeaveRejected(leave.employeeId, leave.leaveType);
    hrLogger.info('Leave denied', { leaveId, approverId });
    return leave;
  }

  // ─── Onboarding Management ─────────────────────────────
  async getOnboardingTasks() {
    return prisma.onboardingTask.findMany({
      include: {
        employee: {
          select: { firstName: true, lastName: true, department: true, avatarUrl: true },
        },
        template: { select: { name: true } },
      },
      orderBy: { employeeId: 'asc' },
    });
  }

  async completeOnboardingTask(taskId: string) {
    return prisma.onboardingTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async saveOnboardingTemplate(name: string, department: string, steps: any) {
    return prisma.onboardingTemplate.create({
      data: {
        name,
        department,
        steps: typeof steps === 'string' ? steps : JSON.stringify(steps),
      },
    });
  }

  async getOnboardingTemplates() {
    return prisma.onboardingTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async generateOnboardingTasks(employeeId: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return;

    let templates = await prisma.onboardingTemplate.findMany({
      where: {
        OR: [
          { department: employee.department },
          { department: 'All' },
        ],
        isActive: true,
      },
    });

    if (templates.length === 0) {
      const defaultTemplate = await prisma.onboardingTemplate.create({
        data: {
          name: `${employee.department} Onboarding Pipeline`,
          department: employee.department,
          steps: JSON.stringify([
            'Submit I-9 and W-4 Tax Forms',
            'Sign Employee Handbook & NDA',
            'Enroll in Company Benefits Plan',
            'Complete Security & Compliance Training',
            'Setup 1Password & Multi-Factor Auth',
            'Schedule 30-Day Check-in with Manager',
          ]),
        },
      });
      templates = [defaultTemplate];
    }

    for (const template of templates) {
      const steps = typeof template.steps === 'string' ? JSON.parse(template.steps) : template.steps;
      if (Array.isArray(steps)) {
        for (let i = 0; i < steps.length; i++) {
          await prisma.onboardingTask.create({
            data: {
              employeeId,
              templateId: template.id,
              stepName: steps[i],
              stepOrder: i + 1,
              status: 'PENDING',
            },
          });
        }
      }
    }

    hrLogger.info('Onboarding tasks generated', { employeeId, templateCount: templates.length });
  }

  // ─── Performance Reviews & Goals ───────────────────────
  async getPerformanceReviews() {
    return prisma.performanceReview.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, department: true, roleTitle: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReview(data: { employeeId: string; cycleName: string; rating?: number; feedback?: string; reviewerId?: string }) {
    return prisma.performanceReview.create({
      data: {
        employeeId: data.employeeId,
        cycleName: data.cycleName,
        rating: data.rating,
        feedback: data.feedback,
        status: data.rating ? 'COMPLETED' : 'SELF_REVIEW',
        reviewerId: data.reviewerId || 'Manager',
        submittedAt: data.rating ? new Date() : undefined,
      },
    });
  }

  async getGoals() {
    return prisma.goalOKR.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, department: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateGoalProgress(goalId: string, progress: number, status?: string) {
    return prisma.goalOKR.update({
      where: { id: goalId },
      data: {
        progress,
        status: status || (progress === 100 ? 'COMPLETED' : progress < 40 ? 'BEHIND' : 'ON_TRACK'),
      },
    });
  }

  // ─── Benefits Administration ───────────────────────────
  async getBenefitsCatalog() {
    let plans = await prisma.benefitPlan.findMany({
      include: { _count: { select: { enrollments: true } } },
    });

    if (plans.length === 0) {
      await this.seedDefaultBenefits();
      plans = await prisma.benefitPlan.findMany({
        include: { _count: { select: { enrollments: true } } },
      });
    }

    return plans;
  }

  async getBenefitEnrollments() {
    return prisma.benefitEnrollment.findMany({
      include: {
        plan: true,
        employee: { select: { firstName: true, lastName: true, department: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async enrollBenefit(employeeId: string, planId: string, coverageTier = 'INDIVIDUAL') {
    return prisma.benefitEnrollment.create({
      data: { employeeId, planId, coverageTier, status: 'ENROLLED' },
    });
  }

  // ─── Document Center ───────────────────────────────────
  async getDocuments() {
    return prisma.document.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, department: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(data: { employeeId: string; title: string; category: string }) {
    return prisma.document.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        category: data.category,
        status: 'PENDING_SIGNATURE',
      },
    });
  }

  async signDocument(documentId: string, signedBy: string) {
    return prisma.document.update({
      where: { id: documentId },
      data: { status: 'SIGNED', signedAt: new Date(), signedBy },
    });
  }

  private async seedDefaultBenefits() {
    const plans = [
      {
        name: 'BlueCross Platinum PPO 500',
        type: 'HEALTH_INSURANCE' as const,
        provider: 'BlueCross BlueShield',
        description: 'Comprehensive health coverage with low $500 deductible, nationwide network and zero copay telemedicine.',
        monthlyCost: 620,
        employerContrib: 550,
      },
      {
        name: 'Delta Dental Premier Complete',
        type: 'DENTAL' as const,
        provider: 'Delta Dental',
        description: '100% preventive dental care, $2,500 annual max coverage with orthodontia support.',
        monthlyCost: 65,
        employerContrib: 65,
      },
      {
        name: 'VSP Vision Choice Plus',
        type: 'VISION' as const,
        provider: 'VSP Vision Care',
        description: 'Annual eye exam covered in full, $250 frame allowance and discounted laser vision correction.',
        monthlyCost: 28,
        employerContrib: 28,
      },
      {
        name: 'Fidelity 401(k) + 5% Match',
        type: 'RETIREMENT_401K' as const,
        provider: 'Fidelity Investments',
        description: 'Pre-tax & Roth 401(k) options with immediate 100% employer match up to 5% of salary.',
        monthlyCost: 0,
        employerContrib: 400,
      },
    ];

    for (const plan of plans) {
      await prisma.benefitPlan.create({ data: plan });
    }
  }
}

export const hrService = new HRService();
