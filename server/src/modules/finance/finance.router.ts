import { Router } from 'express';
import { financeService } from './finance.service';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireRole, Role } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validate';
import {
  executePayrollRunSchema,
  submitExpenseSchema,
  issueCardSchema,
  updateCardLimitSchema,
} from './finance.schema';

const router = Router();

// All Finance routes require authentication
router.use(authenticate);

// ─── Payroll ────────────────────────────────────────────
router.get('/payroll', async (req, res) => {
  try {
    const runs = await financeService.getAllPayrollRuns();
    res.json(runs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/payroll/run',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN]),
  validateRequest(executePayrollRunSchema),
  async (req, res) => {
    try {
      const { period } = req.body;
      const run = await financeService.executePayrollRun(
        period || `Q3 — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
      );
      res.json(run);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ─── Expenses ───────────────────────────────────────────
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await financeService.getAllExpenses();
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/expenses', validateRequest(submitExpenseSchema), async (req: AuthRequest, res) => {
  try {
    const { category, description, amount, employeeId } = req.body;
    const expenseOwnerId = employeeId || req.user!.employeeId;
    const expense = await financeService.submitExpense(expenseOwnerId, category, description, amount);
    res.json(expense);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/expenses/:id/approve',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  async (req: AuthRequest, res) => {
    try {
      const approverId = req.user?.employeeId || 'system';
      const expense = await financeService.approveExpense(String(req.params.id), approverId);
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/expenses/:id/reject',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  async (req: AuthRequest, res) => {
    try {
      const approverId = req.user?.employeeId || 'system';
      const expense = await financeService.rejectExpense(String(req.params.id), approverId);
      res.json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ─── Corporate Cards ────────────────────────────────────
router.get('/cards', async (req, res) => {
  try {
    const cards = await financeService.getAllCorporateCards();
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/cards/issue',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN]),
  validateRequest(issueCardSchema),
  async (req, res) => {
    try {
      const { employeeId, cardType, spendingLimit } = req.body;
      const card = await financeService.issueCorporateCard(employeeId, cardType, spendingLimit);
      res.status(201).json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/cards/:id/toggle-freeze',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN, Role.IT_ADMIN]),
  async (req, res) => {
    try {
      const card = await financeService.toggleCardFreeze(String(req.params.id));
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.put(
  '/cards/:id/limit',
  requireRole([Role.FIN_ADMIN, Role.SUPER_ADMIN]),
  validateRequest(updateCardLimitSchema),
  async (req, res) => {
    try {
      const { spendingLimit } = req.body;
      const card = await financeService.updateCardLimit(String(req.params.id), Number(spendingLimit));
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ─── Compensation Bands ─────────────────────────────────
router.get('/compensation/bands', async (req, res) => {
  try {
    const bands = await financeService.getCompensationBands();
    res.json(bands);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const financeRouter = router;
