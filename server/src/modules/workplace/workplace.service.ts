import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export class WorkplaceService {
  // ─── Attendance ─────────────────────────────────────────
  async getAttendanceRecords(params?: { employeeId?: string; date?: string }) {
    const where: any = {};
    if (params?.employeeId) where.employeeId = params.employeeId;
    return prisma.attendanceRecord.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getTeamStatus() {
    const employees = await prisma.employee.findMany({
      include: {
        attendanceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: 20,
    });

    return employees.map((emp) => {
      const latestRecord = emp.attendanceRecords[0];
      const isClockedIn = latestRecord && !latestRecord.clockOut;
      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        role: emp.roleTitle,
        department: emp.department,
        status: isClockedIn ? (latestRecord.status.toLowerCase()) : 'offline',
        clockIn: latestRecord ? new Date(latestRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        hours: latestRecord?.hoursWorked ? `${Number(latestRecord.hoursWorked).toFixed(1)}h` : '—',
        avatarUrl: emp.avatarUrl,
      };
    });
  }

  async clockIn(employeeId: string, status = 'PRESENT', notes?: string) {
    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId,
        clockIn: new Date(),
        status,
        notes,
      },
      include: { employee: true },
    });
    logger.info(`Employee ${employeeId} clocked in at ${record.clockIn}`);
    return record;
  }

  async clockOut(employeeId: string) {
    const active = await prisma.attendanceRecord.findFirst({
      where: { employeeId, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });

    if (!active) {
      throw new Error('No active clock-in session found for this employee.');
    }

    const clockOutTime = new Date();
    const diffMs = clockOutTime.getTime() - new Date(active.clockIn).getTime();
    const hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    const updated = await prisma.attendanceRecord.update({
      where: { id: active.id },
      data: {
        clockOut: clockOutTime,
        hoursWorked,
      },
      include: { employee: true },
    });
    logger.info(`Employee ${employeeId} clocked out. Hours worked: ${hoursWorked}`);
    return updated;
  }

  // ─── Recruiting ─────────────────────────────────────────
  async getJobs() {
    return prisma.jobOpening.findMany({
      include: { candidates: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJob(data: {
    title: string;
    department: string;
    location: string;
    employmentType?: string;
    salaryRange: string;
    description?: string;
  }) {
    const job = await prisma.jobOpening.create({
      data: {
        title: data.title,
        department: data.department,
        location: data.location,
        employmentType: data.employmentType || 'Full-time',
        salaryRange: data.salaryRange,
        description: data.description,
        status: 'OPEN',
      },
      include: { candidates: true },
    });
    logger.info(`Job opening created: ${job.title}`);
    return job;
  }

  async getCandidates(jobId?: string) {
    const where = jobId ? { jobId } : {};
    return prisma.candidate.findMany({
      where,
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCandidate(data: {
    jobId: string;
    name: string;
    email: string;
    phone?: string;
    stage?: string;
    rating?: number;
    source?: string;
  }) {
    const candidate = await prisma.candidate.create({
      data: {
        jobId: data.jobId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        stage: data.stage || 'APPLIED',
        rating: data.rating ?? 4.0,
        source: data.source || 'LinkedIn',
      },
      include: { job: true },
    });
    logger.info(`Candidate added: ${candidate.name} for job ${candidate.jobId}`);
    return candidate;
  }

  async updateCandidateStage(id: string, stage: string) {
    return prisma.candidate.update({
      where: { id },
      data: { stage },
      include: { job: true },
    });
  }

  // ─── Knowledge Base ─────────────────────────────────────
  async getArticles(category?: string, search?: string) {
    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }
    return prisma.knowledgeArticle.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { views: 'desc' }],
    });
  }

  async createArticle(data: {
    title: string;
    category: string;
    content: string;
    authorName?: string;
    isPinned?: boolean;
  }) {
    const article = await prisma.knowledgeArticle.create({
      data: {
        title: data.title,
        category: data.category,
        content: data.content,
        authorName: data.authorName || 'System Team',
        isPinned: data.isPinned ?? false,
      },
    });
    logger.info(`Knowledge article created: ${article.title}`);
    return article;
  }

  // ─── Learning ───────────────────────────────────────────
  async getCourses() {
    return prisma.learningCourse.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCourse(data: {
    title: string;
    category: string;
    duration: string;
    description?: string;
    isMandatory?: boolean;
  }) {
    const course = await prisma.learningCourse.create({
      data: {
        title: data.title,
        category: data.category,
        duration: data.duration,
        description: data.description,
        isMandatory: data.isMandatory ?? false,
        enrolledCount: 1,
      },
    });
    logger.info(`Learning course created: ${course.title}`);
    return course;
  }

  // ─── Communication ──────────────────────────────────────
  async getChannels() {
    return prisma.chatChannel.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ isPinned: 'desc' }, { name: 'asc' }],
    });
  }

  async getMessages(channelId: string) {
    return prisma.chatMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async postMessage(channelId: string, senderName: string, content: string) {
    const msg = await prisma.chatMessage.create({
      data: {
        channelId,
        senderName,
        content,
        senderAvatar: senderName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
      },
    });
    return msg;
  }
  // ─── Calendar & Scheduling ──────────────────────────────
  async getCalendarEvents(date?: string) {
    const where: any = {};
    if (date) {
      where.date = date;
    }
    return prisma.calendarEvent.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
  }

  async createCalendarEvent(data: {
    title: string;
    description?: string;
    type?: string;
    date: string;
    time: string;
    location?: string;
    color?: string;
    attendees?: string[];
  }) {
    return prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || 'meeting',
        date: data.date,
        time: data.time,
        location: data.location || 'Virtual / Zoom',
        color: data.color || 'var(--accent)',
        attendees: JSON.stringify(data.attendees || ['Team']),
      },
    });
  }

  async deleteCalendarEvent(id: string) {
    return prisma.calendarEvent.delete({ where: { id } });
  }
}

export const workplaceService = new WorkplaceService();
