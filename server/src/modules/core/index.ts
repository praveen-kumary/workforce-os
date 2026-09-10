import { IModule } from '../module.interface';
import { employeeRouter } from './employee.router';
import { coreRouter } from './core.router';
import { workflowRouter } from './workflow.router';
import { authRouter } from './auth.router';
import { analyticsRouter } from './analytics.router';
import { auditRouter } from './audit.router';
import { Router } from 'express';

const combinedRouter = Router();

// Auth routes — no auth middleware needed
combinedRouter.use('/auth', authRouter);

// Analytics & Audit routes (auth applied internally)
combinedRouter.use('/analytics', analyticsRouter);
combinedRouter.use('/audit', auditRouter);

// Workflow routes
combinedRouter.use('/workflows', workflowRouter);

// Core routes (settings, notifications, search)
combinedRouter.use('/', coreRouter);

// Employee routes (CRUD + stats + org-chart + profile)
combinedRouter.use('/employees', employeeRouter);

export class CoreModule implements IModule {
  name = 'core';
  routes = combinedRouter;
}
