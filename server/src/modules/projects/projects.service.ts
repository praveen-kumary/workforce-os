import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export class ProjectsService {
  async getProjects() {
    return prisma.project.findMany({
      include: {
        customer: true,
        tasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProject(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        customer: true,
        tasks: true,
      },
    });
  }

  async createProject(data: {
    name: string;
    customerId?: string;
    managerId?: string;
    status?: string;
    budget?: number;
    startDate?: Date | string;
    endDate?: Date | string;
  }) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        customerId: data.customerId || null,
        managerId: data.managerId || null,
        status: data.status || 'PLANNING',
        budget: data.budget !== undefined ? data.budget : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: { customer: true, tasks: true },
    });
    logger.info(`Project created: ${project.name} (${project.id})`);
    return project;
  }

  async updateProject(id: string, data: any) {
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        budget: data.budget !== undefined ? Number(data.budget) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: { customer: true, tasks: true },
    });
  }

  async deleteProject(id: string) {
    await prisma.task.deleteMany({ where: { projectId: id } });
    return prisma.project.delete({ where: { id } });
  }

  // ─── Tasks ──────────────────────────────────────────────
  async getTasks(params?: { projectId?: string; assigneeId?: string; status?: string }) {
    const where: any = {};
    if (params?.projectId) where.projectId = params.projectId;
    if (params?.assigneeId) where.assigneeId = params.assigneeId;
    if (params?.status && params.status !== 'ALL') where.status = params.status;

    return prisma.task.findMany({
      where,
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    assigneeId?: string;
    dueDate?: Date | string;
  }) {
    const task = await prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description || null,
        status: data.status || 'TODO',
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: { project: true },
    });
    logger.info(`Task created: "${task.title}" for project ${task.projectId}`);
    return task;
  }

  async updateTaskStatus(id: string, status: string) {
    return prisma.task.update({
      where: { id },
      data: { status },
      include: { project: true },
    });
  }

  async updateTask(id: string, data: any) {
    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { project: true },
    });
  }

  async deleteTask(id: string) {
    return prisma.task.delete({ where: { id } });
  }
}

export const projectsService = new ProjectsService();
