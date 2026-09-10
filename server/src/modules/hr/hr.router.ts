import { Router } from 'express';
import { hrService } from './hr.service';
import { authenticate } from '../../middleware/auth';
import { requireRole, Role } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validate';
import {
  submitLeaveSchema,
  leaveActionSchema,
  onboardingTemplateSchema,
  createReviewSchema,
  updateGoalProgressSchema,
  enrollBenefitSchema,
  createDocumentSchema,
  signDocumentSchema,
} from './hr.schema';

const router = Router();

// All HR routes require authentication
router.use(authenticate);

// ─── Leave Management ───────────────────────────────────
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await hrService.getAllLeaveRequests();
    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/leaves', validateRequest(submitLeaveSchema), async (req, res) => {
  try {
    const leave = await hrService.submitLeaveRequest(req.body);
    res.status(201).json(leave);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  '/leaves/:id/approve',
  requireRole([Role.HR_ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  validateRequest(leaveActionSchema),
  async (req, res) => {
    try {
      const { approverId } = req.body;
      const leave = await hrService.approveLeave(String(req.params.id), approverId || 'system');
      res.json(leave);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/leaves/:id/deny',
  requireRole([Role.HR_ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  validateRequest(leaveActionSchema),
  async (req, res) => {
    try {
      const { approverId } = req.body;
      const leave = await hrService.denyLeave(String(req.params.id), approverId || 'system');
      res.json(leave);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ─── Onboarding ─────────────────────────────────────────
router.get('/onboarding', async (req, res) => {
  try {
    const tasks = await hrService.getOnboardingTasks();
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/onboarding/tasks/:id/complete', async (req, res) => {
  try {
    const task = await hrService.completeOnboardingTask(String(req.params.id));
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post(
  '/onboarding/template',
  requireRole([Role.HR_ADMIN, Role.SUPER_ADMIN]),
  validateRequest(onboardingTemplateSchema),
  async (req, res) => {
    try {
      const { name, department, steps } = req.body;
      const template = await hrService.saveOnboardingTemplate(name, department, steps);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/onboarding/template', async (req, res) => {
  try {
    const templates = await hrService.getOnboardingTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Performance Reviews & Goals ────────────────────────
router.get('/performance/reviews', async (req, res) => {
  try {
    const reviews = await hrService.getPerformanceReviews();
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/performance/reviews',
  requireRole([Role.HR_ADMIN, Role.SUPER_ADMIN, Role.MANAGER]),
  validateRequest(createReviewSchema),
  async (req, res) => {
    try {
      const review = await hrService.createReview(req.body);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get('/performance/goals', async (req, res) => {
  try {
    const goals = await hrService.getGoals();
    res.json(goals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/performance/goals/:id/progress', validateRequest(updateGoalProgressSchema), async (req, res) => {
  try {
    const { progress, status } = req.body;
    const goal = await hrService.updateGoalProgress(String(req.params.id), Number(progress), status);
    res.json(goal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Benefits ───────────────────────────────────────────
router.get('/benefits/catalog', async (req, res) => {
  try {
    const catalog = await hrService.getBenefitsCatalog();
    res.json(catalog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/benefits/enrollments', async (req, res) => {
  try {
    const enrollments = await hrService.getBenefitEnrollments();
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/benefits/enroll',
  requireRole([Role.HR_ADMIN, Role.SUPER_ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.IT_ADMIN, Role.FIN_ADMIN, Role.SALES_ADMIN]),
  validateRequest(enrollBenefitSchema),
  async (req, res) => {
    try {
      const { employeeId, planId, coverageTier } = req.body;
      const enrollment = await hrService.enrollBenefit(employeeId, planId, coverageTier);
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ─── Documents ──────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const docs = await hrService.getDocuments();
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/documents',
  requireRole([Role.HR_ADMIN, Role.SUPER_ADMIN]),
  validateRequest(createDocumentSchema),
  async (req, res) => {
    try {
      const doc = await hrService.createDocument(req.body);
      res.status(201).json(doc);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post('/documents/:id/sign', validateRequest(signDocumentSchema), async (req, res) => {
  try {
    const { signedBy } = req.body;
    const doc = await hrService.signDocument(String(req.params.id), signedBy || 'Employee');
    res.json(doc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const hrRouter = router;
