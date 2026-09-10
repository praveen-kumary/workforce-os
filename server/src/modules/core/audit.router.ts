import { Router } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/core/audit — Paginated audit logs
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 25));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.action) where.action = req.query.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: { firstName: true, lastName: true, department: true, avatarUrl: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const auditRouter = router;
