import { Router } from 'express';
import { workflowService } from './workflow.service';

const router = Router();

// GET /api/core/workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await workflowService.getWorkflows();
    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/core/workflows
router.post('/', async (req, res) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/core/workflows/:id/toggle
router.post('/:id/toggle', async (req, res) => {
  try {
    const workflow = await workflowService.toggleWorkflow(String(req.params.id));
    res.json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/core/workflows/:id
router.delete('/:id', async (req, res) => {
  try {
    await workflowService.deleteWorkflow(String(req.params.id));
    res.json({ message: 'Workflow deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/core/workflows/executions
router.get('/executions', async (req, res) => {
  try {
    const executions = await workflowService.getExecutions();
    res.json(executions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/core/workflows/:id/test
router.post('/:id/test', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId required for test' });
    const execution = await workflowService.testExecuteWorkflow(String(req.params.id), employeeId);
    res.json(execution);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const workflowRouter = router;
