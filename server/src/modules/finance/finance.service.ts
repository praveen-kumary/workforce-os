import { randomInt } from 'crypto';
import { prisma } from '../../config/database';
import { PayrollEngine } from './payroll-calc';
import { notificationService } from '../core/notification.service';
import { logger } from '../../config/logger';

const finLogger = logger.child({ module: 'finance-service' });

/**
 * Generate a masked card number (no faker dependency).
 */
function generateMaskedCard(): string {
  const last4 = randomInt(1000, 10000).toString();
  return `**** **** **** ${last4}`;
}

/**
 * Generate a masked bank account number.
 */
function generateMaskedAccount(): string {
  const last4 = randomInt(1000, 10000).toString();
  return `****${last4}`;
}

export class FinanceService {
  // ─── Payroll Engine ─────────────────────────────────────
  async getAllPayrollRuns() {
    return prisma.payrollRun.findMany({
      include: {
        payslips: {
          include: {
            employee: { select: { firstName: true, lastName: true, department: true, email: true, roleTitle: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async executePayrollRun(periodName: string) {
    return prisma.$transaction(async (tx) => {
      let activeProfiles = await tx.payrollProfile.findMany({
        where: { isActive: true },
        include: { employee: true },
      });

      // Create profiles for existing employees if none exist
      if (activeProfiles.length === 0) {
        const employees = await tx.employee.findMany({
          where: { status: { in: ['ACTIVE', 'ONBOARDING'] } },
        });

        const salaryRanges: Record<string, [number, number]> = {
          Engineering: [95000_00, 185000_00],
          Sales: [80000_00, 150000_00],
          Finance: [85000_00, 145000_00],
          HR: [75000_00, 130000_00],
          Marketing: [70000_00, 140000_00],
          Product: [90000_00, 170000_00],
        };

        for (const emp of employees) {
          const range = salaryRanges[emp.department] || [75000_00, 150000_00];
          const baseSalary = randomInt(range[0], range[1]);

          await tx.payrollProfile.create({
            data: {
              employeeId: emp.id,
              baseSalary,
              payFrequency: 'MONTHLY',
              currency: 'USD',
              taxSlab: 'Federal + CA State',
              taxRate: 22,
              bankName: 'JPMorgan Chase',
              accountNumber: generateMaskedAccount(),
              routingNumber: '021000021',
              isActive: true,
            },
          });
        }

        activeProfiles = await tx.payrollProfile.findMany({
          where: { isActive: true },
          include: { employee: true },
        });
      }

      let totalGross = 0;
      let totalNet = 0;
      let totalTax = 0;

      const run = await tx.payrollRun.create({
        data: {
          period: periodName,
          payDate: new Date(),
          status: 'COMPLETED',
          totalGross: 0,
          totalNet: 0,
          totalTax: 0,
          employeeCount: activeProfiles.length,
        },
      });

      for (const profile of activeProfiles) {
        const result = PayrollEngine.calculatePaycheck({
          baseSalary: Number(profile.baseSalary),
          payFrequency: profile.payFrequency,
          taxRate: Number(profile.taxRate),
        });

        totalGross += result.grossPay;
        totalNet += result.netPay;
        totalTax += result.taxDeduction;

        const healthDeduction = 15000; // $150
        const retirementDeduction = Math.round(result.grossPay * 0.05); // 5% 401k
        const finalNet = result.netPay - healthDeduction - retirementDeduction;

        await tx.payslip.create({
          data: {
            payrollRunId: run.id,
            employeeId: profile.employeeId,
            grossPay: result.grossPay,
            basePay: result.grossPay,
            taxDeduction: result.taxDeduction,
            insuranceDeduction: healthDeduction,
            retirementDeduction,
            otherDeductions: 0,
            netPay: finalNet,
            pdfUrl: `/payslips/${run.id}/${profile.employeeId}.pdf`,
          },
        });

        // Notify each employee about their payslip
        await notificationService.onPayrollProcessed(profile.employeeId, periodName, finalNet);
      }

      finLogger.info('Payroll run completed', {
        runId: run.id,
        period: periodName,
        employeeCount: activeProfiles.length,
        totalGross,
        totalNet,
        totalTax,
      });

      return tx.payrollRun.update({
        where: { id: run.id },
        data: { totalGross, totalNet, totalTax },
        include: {
          payslips: {
            include: {
              employee: { select: { firstName: true, lastName: true, department: true } },
            },
          },
        },
      });
    });
  }

  async createPayrollProfile(employeeId: string) {
    const baseSalary = randomInt(80000_00, 180000_00);
    return prisma.payrollProfile.create({
      data: {
        employeeId,
        baseSalary,
        payFrequency: 'MONTHLY',
        currency: 'USD',
        taxSlab: 'Standard',
        taxRate: 22,
        bankName: 'JPMorgan Chase',
        accountNumber: generateMaskedAccount(),
        routingNumber: '021000021',
        isActive: true,
      },
    });
  }

  // ─── Expenses ──────────────────────────────────────────
  async getAllExpenses() {
    return prisma.expense.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, department: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitExpense(employeeId: string, category: string, description: string, amount: number) {
    const expense = await prisma.expense.create({
      data: {
        employeeId,
        category,
        description,
        amount,
        currency: 'USD',
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
    finLogger.info('Expense submitted', { expenseId: expense.id, employeeId, amount, category });
    return expense;
  }

  async approveExpense(expenseId: string, approverId: string) {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED', approvedBy: approverId },
    });
    await notificationService.onExpenseApproved(expense.employeeId, Number(expense.amount));
    finLogger.info('Expense approved', { expenseId, approverId });
    return expense;
  }

  async rejectExpense(expenseId: string, approverId: string) {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'REJECTED', approvedBy: approverId },
    });
    await notificationService.onExpenseRejected(expense.employeeId, Number(expense.amount));
    finLogger.info('Expense rejected', { expenseId, approverId });
    return expense;
  }

  // ─── Corporate Cards ───────────────────────────────────
  async getAllCorporateCards() {
    let cards = await prisma.corporateCard.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, department: true, email: true, avatarUrl: true } },
      },
      orderBy: { issuedDate: 'desc' },
    });

    if (cards.length === 0) {
      await this.seedDefaultCorporateCards();
      cards = await prisma.corporateCard.findMany({
        include: {
          employee: { select: { firstName: true, lastName: true, department: true, email: true, avatarUrl: true } },
        },
        orderBy: { issuedDate: 'desc' },
      });
    }

    return cards;
  }

  async issueCorporateCard(employeeId: string, cardType = 'virtual', spendingLimit = 500000) {
    const existing = await prisma.corporateCard.findUnique({ where: { employeeId } });
    if (existing) return existing;

    return prisma.corporateCard.create({
      data: {
        employeeId,
        cardNumberMasked: generateMaskedCard(),
        cardType,
        spendingLimit,
        currentBalance: randomInt(12000, 185000),
        status: 'ACTIVE',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async toggleCardFreeze(cardId: string) {
    const card = await prisma.corporateCard.findUniqueOrThrow({ where: { id: cardId } });
    const newStatus = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    return prisma.corporateCard.update({
      where: { id: cardId },
      data: { status: newStatus },
    });
  }

  async updateCardLimit(cardId: string, spendingLimit: number) {
    return prisma.corporateCard.update({
      where: { id: cardId },
      data: { spendingLimit },
    });
  }

  // ─── Compensation Bands ────────────────────────────────
  async getCompensationBands() {
    let bands = await prisma.compensationBand.findMany({ orderBy: { department: 'asc' } });
    if (bands.length === 0) {
      await this.seedDefaultCompBands();
      bands = await prisma.compensationBand.findMany({ orderBy: { department: 'asc' } });
    }
    return bands;
  }

  private async seedDefaultCorporateCards() {
    const employees = await prisma.employee.findMany({ take: 6 });
    for (const emp of employees) {
      const existingCard = await prisma.corporateCard.findUnique({ where: { employeeId: emp.id } });
      if (existingCard) continue;

      await prisma.corporateCard.create({
        data: {
          employeeId: emp.id,
          cardNumberMasked: generateMaskedCard(),
          cardType: Math.random() > 0.5 ? 'virtual' : 'physical',
          spendingLimit: [250000, 500000, 1000000][randomInt(0, 3)],
          currentBalance: randomInt(8000, 140000),
          status: 'ACTIVE',
          issuedDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  private async seedDefaultCompBands() {
    const defaultBands = [
      { roleTitle: 'Software Engineer', department: 'Engineering', level: 'L3 (Junior)', minSalary: 95000, midSalary: 115000, maxSalary: 135000, equityMin: 1500, equityMax: 3500 },
      { roleTitle: 'Senior Software Engineer', department: 'Engineering', level: 'L4 (Mid/Senior)', minSalary: 140000, midSalary: 165000, maxSalary: 190000, equityMin: 5000, equityMax: 12000 },
      { roleTitle: 'Staff / Principal Engineer', department: 'Engineering', level: 'L5 (Staff)', minSalary: 195000, midSalary: 225000, maxSalary: 260000, equityMin: 15000, equityMax: 35000 },
      { roleTitle: 'Account Executive', department: 'Sales', level: 'L3 (Mid)', minSalary: 80000, midSalary: 110000, maxSalary: 140000, equityMin: 1000, equityMax: 4000 },
      { roleTitle: 'Enterprise Sales Lead', department: 'Sales', level: 'L4 (Senior)', minSalary: 130000, midSalary: 160000, maxSalary: 200000, equityMin: 4000, equityMax: 10000 },
      { roleTitle: 'Financial Analyst', department: 'Finance', level: 'L3 (Mid)', minSalary: 85000, midSalary: 105000, maxSalary: 125000, equityMin: 1000, equityMax: 3000 },
      { roleTitle: 'Product Manager', department: 'Product', level: 'L4 (Senior)', minSalary: 145000, midSalary: 170000, maxSalary: 195000, equityMin: 6000, equityMax: 14000 },
    ];

    for (const b of defaultBands) {
      await prisma.compensationBand.create({ data: b });
    }
  }
}

export const financeService = new FinanceService();
