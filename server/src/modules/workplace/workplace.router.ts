import { Router } from 'express';
import { workplaceService } from './workplace.service';
import { authenticate, AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── Attendance ─────────────────────────────────────────
router.get('/attendance', async (req, res) => {
  try {
    const { employeeId, date } = req.query;
    const records = await workplaceService.getAttendanceRecords({
      employeeId: employeeId ? String(employeeId) : undefined,
      date: date ? String(date) : undefined,
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/attendance/team', async (_req, res) => {
  try {
    const team = await workplaceService.getTeamStatus();
    res.json(team);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/attendance/clock-in', async (req: AuthRequest, res) => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID is required' });
    const record = await workplaceService.clockIn(employeeId, req.body.status, req.body.notes);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/attendance/clock-out', async (req: AuthRequest, res) => {
  try {
    const employeeId = req.body.employeeId || req.user?.employeeId;
    if (!employeeId) return res.status(400).json({ error: 'Employee ID is required' });
    const record = await workplaceService.clockOut(employeeId);
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Recruiting ─────────────────────────────────────────
router.get('/recruiting/jobs', async (_req, res) => {
  try {
    const jobs = await workplaceService.getJobs();
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recruiting/jobs', async (req, res) => {
  try {
    const job = await workplaceService.createJob(req.body);
    res.status(201).json(job);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/recruiting/candidates', async (req, res) => {
  try {
    const { jobId } = req.query;
    const candidates = await workplaceService.getCandidates(jobId ? String(jobId) : undefined);
    res.json(candidates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recruiting/candidates', async (req, res) => {
  try {
    const candidate = await workplaceService.createCandidate(req.body);
    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/recruiting/candidates/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    const candidate = await workplaceService.updateCandidateStage(String(req.params.id), stage);
    res.json(candidate);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Knowledge Base ─────────────────────────────────────
router.get('/knowledge', async (req, res) => {
  try {
    const { category, search } = req.query;
    const articles = await workplaceService.getArticles(
      category ? String(category) : undefined,
      search ? String(search) : undefined
    );
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/knowledge', async (req, res) => {
  try {
    const article = await workplaceService.createArticle(req.body);
    res.status(201).json(article);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Learning ───────────────────────────────────────────
router.get('/learning', async (_req, res) => {
  try {
    const courses = await workplaceService.getCourses();
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/learning', async (req, res) => {
  try {
    const course = await workplaceService.createCourse(req.body);
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Communication ──────────────────────────────────────
router.get('/channels', async (_req, res) => {
  try {
    const channels = await workplaceService.getChannels();
    res.json(channels);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/channels/:id/messages', async (req, res) => {
  try {
    const messages = await workplaceService.getMessages(String(req.params.id));
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/channels/:id/messages', async (req: AuthRequest, res) => {
  try {
    const senderName = req.body.senderName || req.user?.email || 'User';
    const message = await workplaceService.postMessage(String(req.params.id), senderName, req.body.content);
    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Calendar & Scheduling ──────────────────────────────
router.get('/calendar', async (req, res) => {
  try {
    const { date } = req.query;
    const events = await workplaceService.getCalendarEvents(date ? String(date) : undefined);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/calendar', async (req, res) => {
  try {
    const event = await workplaceService.createCalendarEvent(req.body);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/calendar/:id', async (req, res) => {
  try {
    await workplaceService.deleteCalendarEvent(String(req.params.id));
    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export const workplaceRouter = router;
