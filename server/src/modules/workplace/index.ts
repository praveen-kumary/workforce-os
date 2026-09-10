import { IModule } from '../module.interface';
import { workplaceRouter } from './workplace.router';

export class WorkplaceModule implements IModule {
  name = 'workplace';
  routes = workplaceRouter;
}
