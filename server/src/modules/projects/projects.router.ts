import { Router } from 'express';
import { projectsService } from './projects.service';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── Projects ────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const projects = await projectsService.getProjects();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await projectsService.getProject(String(req.params.id));
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const project = await projectsService.createProject(req.body);
    res.status(201).json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await projectsService.updateProject(String(req.params.id), req.body);
    res.json(project);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await projectsService.deleteProject(String(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Tasks ───────────────────────────────────────────────
router.get('/tasks/all', async (req, res) => {
  try {
    const { projectId, assigneeId, status } = req.query;
    const tasks = await projectsService.getTasks({
      projectId: projectId ? String(projectId) : undefined,
      assigneeId: assigneeId ? String(assigneeId) : undefined,
      status: status ? String(status) : undefined,
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const task = await projectsService.createTask(req.body);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const task = await projectsService.updateTaskStatus(String(req.params.id), status);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await projectsService.updateTask(String(req.params.id), req.body);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await projectsService.deleteTask(String(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const projectsRouter = router;
