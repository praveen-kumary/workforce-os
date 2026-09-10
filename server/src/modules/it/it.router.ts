import { Router } from 'express';
import { itService } from './it.service';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireRole, Role } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validate';
import {
  assignDeviceSchema,
  provisionAppSchema,
  createTicketSchema,
  updateTicketStatusSchema,
} from './it.schema';

const router = Router();

// All IT routes require authentication
router.use(authenticate);

// ─── Devices ────────────────────────────────────────────
router.get('/devices', async (req, res) => {
  try {
    const devices = await itService.getAllDevices();
    res.json(devices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/devices/assign',
  requireRole([Role.IT_ADMIN, Role.SUPER_ADMIN]),
  validateRequest(assignDeviceSchema),
  async (req, res) => {
    try {
      const { employeeId, deviceType, make, model } = req.body;
      const device = await itService.assignDevice(employeeId, deviceType, make, model);
      res.status(201).json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/devices/:id/lock',
  requireRole([Role.IT_ADMIN, Role.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const device = await itService.lockDevice(String(req.params.id));
      res.json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/devices/:id/unlock',
  requireRole([Role.IT_ADMIN, Role.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const device = await itService.unlockDevice(String(req.params.id));
      res.json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/devices/:id/wipe',
  requireRole([Role.IT_ADMIN, Role.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const device = await itService.wipeDevice(String(req.params.id));
      res.json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ─── App Catalog & SSO Access ───────────────────────────
router.get('/access', async (req, res) => {
  try {
    const access = await itService.getAllAppAccesses();
    res.json(access);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/catalog', async (req, res) => {
  try {
    const catalog = await itService.getAppCatalog();
    res.json(catalog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/access/provision',
  requireRole([Role.IT_ADMIN, Role.SUPER_ADMIN]),
  validateRequest(provisionAppSchema),
  async (req, res) => {
    try {
      const { employeeId, appName, accessLevel } = req.body;
      const access = await itService.provisionApp(employeeId, appName, accessLevel);
      res.status(201).json(access);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/access/:id/revoke',
  requireRole([Role.IT_ADMIN, Role.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const access = await itService.revokeApp(String(req.params.id));
      res.json(access);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ─── Security Policies ──────────────────────────────────
router.get('/security/policies', async (req, res) => {
  try {
    const policies = await itService.getSecurityPolicies();
    res.json(policies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/security/policies/:id/toggle',
  requireRole([Role.IT_ADMIN, Role.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const policy = await itService.toggleSecurityPolicy(String(req.params.id));
      res.json(policy);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ─── Support Desk ───────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await itService.getTickets();
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tickets', validateRequest(createTicketSchema), async (req: AuthRequest, res) => {
  try {
    const { title, description, category, priority, employeeId } = req.body;
    const ticketOwnerId = employeeId || req.user!.employeeId;
    const ticket = await itService.createTicket(ticketOwnerId, title, description, category, priority);
    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/tickets/:id/status', validateRequest(updateTicketStatusSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await itService.updateTicketStatus(String(req.params.id), status);
    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const itRouter = router;
