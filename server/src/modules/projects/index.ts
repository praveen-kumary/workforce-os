import { IModule } from '../module.interface';
import { projectsRouter } from './projects.router';

export class ProjectsModule implements IModule {
  name = 'projects';
  routes = projectsRouter;
}
