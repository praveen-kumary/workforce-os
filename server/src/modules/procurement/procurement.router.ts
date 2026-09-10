import { Router } from 'express';
import { procurementService } from './procurement.service';
import { authenticate } from '../../middleware/auth';
import { requireRole, Role } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

// ─── Invoices ───────────────────────────────────────────
router.get('/invoices', async (_req, res) => {
  try {
    const invoices = await procurementService.getInvoices();
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await procurementService.getInvoice(String(req.params.id));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/invoices',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.SALES_ADMIN]),
  async (req, res) => {
    try {
      const invoice = await procurementService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.patch(
  '/invoices/:id/status',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { status } = req.body;
      const invoice = await procurementService.updateInvoiceStatus(String(req.params.id), status);
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ─── Vendors ────────────────────────────────────────────
router.get('/vendors', async (_req, res) => {
  try {
    const vendors = await procurementService.getVendors();
    res.json(vendors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/vendors',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.IT_ADMIN]),
  async (req, res) => {
    try {
      const vendor = await procurementService.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.put(
  '/vendors/:id',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.IT_ADMIN]),
  async (req, res) => {
    try {
      const vendor = await procurementService.updateVendor(String(req.params.id), req.body);
      res.json(vendor);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete(
  '/vendors/:id',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN]),
  async (req, res) => {
    try {
      await procurementService.deleteVendor(String(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ─── Purchase Orders ────────────────────────────────────
router.get('/purchase-orders', async (_req, res) => {
  try {
    const pos = await procurementService.getPurchaseOrders();
    res.json(pos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/purchase-orders', async (req, res) => {
  try {
    const po = await procurementService.createPurchaseOrder(req.body);
    res.status(201).json(po);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  '/purchase-orders/:id/approve',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.IT_ADMIN]),
  async (req, res) => {
    try {
      const po = await procurementService.approvePurchaseOrder(String(req.params.id));
      res.json(po);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/purchase-orders/:id/reject',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.MANAGER, Role.IT_ADMIN]),
  async (req, res) => {
    try {
      const po = await procurementService.rejectPurchaseOrder(String(req.params.id));
      res.json(po);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.patch(
  '/purchase-orders/:id/status',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.IT_ADMIN]),
  async (req, res) => {
    try {
      const { status } = req.body;
      const po = await procurementService.updatePurchaseOrderStatus(String(req.params.id), status);
      res.json(po);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export const procurementRouter = router;
