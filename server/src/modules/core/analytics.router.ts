import { Router } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/core/analytics/headcount — Employees grouped by department and status
router.get('/headcount', async (req, res) => {
  try {
    const byDepartment = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true },
      where: { status: { in: ['ACTIVE', 'ONBOARDING', 'ON_LEAVE'] } },
      orderBy: { _count: { id: 'desc' } },
    });

    const byStatus = await prisma.employee.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const byEmploymentType = await prisma.employee.groupBy({
      by: ['employmentType'],
      _count: { id: true },
      where: { status: { in: ['ACTIVE', 'ONBOARDING'] } },
    });

    const byLocation = await prisma.employee.groupBy({
      by: ['location'],
      _count: { id: true },
      where: { status: { in: ['ACTIVE', 'ONBOARDING'] } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    res.json({
      byDepartment: byDepartment.map(d => ({ name: d.department, value: d._count.id })),
      byStatus: byStatus.map(s => ({ name: s.status, value: s._count.id })),
      byEmploymentType: byEmploymentType.map(e => ({ name: e.employmentType, value: e._count.id })),
      byLocation: byLocation.map(l => ({ name: l.location, value: l._count.id })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/core/analytics/payroll-trend — Monthly payroll totals from PayrollRun
router.get('/payroll-trend', async (req, res) => {
  try {
    const runs = await prisma.payrollRun.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { payDate: 'asc' },
      select: {
        period: true,
        payDate: true,
        totalGross: true,
        totalNet: true,
        totalTax: true,
        employeeCount: true,
      },
    });

    const trend = runs.map(run => ({
      period: run.period,
      date: run.payDate,
      gross: Number(run.totalGross) / 100,
      net: Number(run.totalNet) / 100,
      tax: Number(run.totalTax) / 100,
      headcount: run.employeeCount,
    }));

    res.json(trend);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/core/analytics/leave-utilization — Aggregated leave balances
router.get('/leave-utilization', async (req, res) => {
  try {
    const balances = await prisma.leaveBalance.findMany({
      where: { year: new Date().getFullYear() },
      include: {
        employee: { select: { department: true, status: true } },
      },
    });

    // Aggregate by department
    const deptMap = new Map<string, { total: number; used: number; pending: number; count: number }>();
    for (const b of balances) {
      if (b.employee.status === 'TERMINATED') continue;
      const dept = b.employee.department;
      const existing = deptMap.get(dept) || { total: 0, used: 0, pending: 0, count: 0 };
      existing.total += Number(b.totalDays);
      existing.used += Number(b.usedDays);
      existing.pending += Number(b.pendingDays);
      existing.count += 1;
      deptMap.set(dept, existing);
    }

    const byDepartment = Array.from(deptMap.entries()).map(([name, data]) => ({
      name,
      totalDays: data.total,
      usedDays: data.used,
      pendingDays: data.pending,
      employees: data.count,
      utilizationRate: data.total > 0 ? Math.round((data.used / data.total) * 100) : 0,
    }));

    // Aggregate by leave type
    const typeMap = new Map<string, { total: number; used: number }>();
    for (const b of balances) {
      if (b.employee.status === 'TERMINATED') continue;
      const existing = typeMap.get(b.leaveType) || { total: 0, used: 0 };
      existing.total += Number(b.totalDays);
      existing.used += Number(b.usedDays);
      typeMap.set(b.leaveType, existing);
    }

    const byType = Array.from(typeMap.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      used: data.used,
      utilization: data.total > 0 ? Math.round((data.used / data.total) * 100) : 0,
    }));

    res.json({ byDepartment, byType });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/core/analytics/expense-breakdown — Expenses by category
router.get('/expense-breakdown', async (req, res) => {
  try {
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const byStatus = await prisma.expense.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: { id: true },
    });

    res.json({
      byCategory: byCategory.map(c => ({
        name: c.category,
        amount: Number(c._sum.amount || 0) / 100,
        count: c._count.id,
      })),
      byStatus: byStatus.map(s => ({
        name: s.status,
        amount: Number(s._sum.amount || 0) / 100,
        count: s._count.id,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/core/analytics/device-compliance — Fleet health
router.get('/device-compliance', async (req, res) => {
  try {
    const totalDevices = await prisma.device.count({ where: { status: 'ACTIVE' } });
    const encryptedDevices = await prisma.device.count({ where: { status: 'ACTIVE', isEncrypted: true } });

    const byOS = await prisma.device.groupBy({
      by: ['osName'],
      _count: { id: true },
      where: { status: 'ACTIVE' },
    });

    const avgBattery = await prisma.device.aggregate({
      _avg: { batteryHealth: true },
      where: { status: 'ACTIVE' },
    });

    const policies = await prisma.securityPolicy.findMany();
    const avgCompliance = policies.length > 0
      ? Math.round(policies.reduce((sum, p) => sum + p.complianceRate, 0) / policies.length)
      : 0;

    res.json({
      totalDevices,
      encryptedDevices,
      encryptionRate: totalDevices > 0 ? Math.round((encryptedDevices / totalDevices) * 100) : 0,
      avgBatteryHealth: Math.round(avgBattery._avg.batteryHealth || 0),
      avgPolicyCompliance: avgCompliance,
      byOS: byOS.map(os => ({ name: os.osName, count: os._count.id })),
      policies: policies.map(p => ({
        name: p.name,
        category: p.category,
        enforced: p.enforced,
        complianceRate: p.complianceRate,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const analyticsRouter = router;
