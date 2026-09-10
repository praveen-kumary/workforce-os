import { Router } from 'express';
import { crmService } from './crm.service';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── Customers ───────────────────────────────────────────
router.get('/customers', async (_req, res) => {
  try {
    const customers = await crmService.getCustomers();
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await crmService.getCustomer(String(req.params.id));
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const customer = await crmService.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await crmService.updateCustomer(String(req.params.id), req.body);
    res.json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await crmService.deleteCustomer(String(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Deals & Pipeline ────────────────────────────────────
router.get('/deals', async (_req, res) => {
  try {
    const deals = await crmService.getDeals();
    res.json(deals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pipeline', async (_req, res) => {
  try {
    const stats = await crmService.getPipelineStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/deals', async (req, res) => {
  try {
    const deal = await crmService.createDeal(req.body);
    res.status(201).json(deal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/deals/:id/stage', async (req, res) => {
  try {
    const { stage, probability } = req.body;
    const deal = await crmService.updateDealStage(String(req.params.id), stage, probability);
    res.json(deal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/deals/:id', async (req, res) => {
  try {
    const deal = await crmService.updateDeal(String(req.params.id), req.body);
    res.json(deal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const crmRouter = router;
