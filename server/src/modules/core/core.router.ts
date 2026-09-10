import { Router } from 'express';
import { prisma } from '../../config/database';
import { coreService } from './core.service';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();

// ─── Notifications ──────────────────────────────────────
router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
  try {
    const employeeId = (req.query.employeeId as string) || req.user?.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });
    const notifications = await coreService.getNotifications(employeeId);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/notifications/count', authenticate, async (req: AuthRequest, res) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'Not authenticated' });
    const count = await coreService.getUnreadNotificationCount(employeeId);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await coreService.markNotificationRead(String(req.params.id));
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'Not authenticated' });
    await coreService.markAllNotificationsRead(employeeId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Settings ───────────────────────────────────────────
router.get('/settings', authenticate, async (req, res) => {
  try {
    const settings = await coreService.getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', authenticate, async (req, res) => {
  try {
    const settings = await coreService.updateSettings(req.body);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Global Search ──────────────────────────────────────
router.get('/search', authenticate, async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== 'string') return res.json({ employees: [], devices: [], tickets: [] });
    const results = await coreService.globalSearch(String(q));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Stats Alias ─────────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const [totalEmployees, activeDevices, activeWorkflows, pendingLeaves] = await Promise.all([
      prisma.employee.count({ where: { status: { not: 'TERMINATED' } } }),
      prisma.device.count({ where: { status: 'ACTIVE' } }),
      prisma.workflowRule.count({ where: { isActive: true } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      kpis: {
        totalEmployees,
        activeDevices,
        activeWorkflows,
        pendingLeaves,
        systemHealth: '100%',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Unified Approvals Queue ────────────────────────────
router.get('/approvals', authenticate, async (_req, res) => {
  try {
    const approvals = await coreService.getUnifiedApprovals();
    res.json(approvals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const coreRouter = router;

