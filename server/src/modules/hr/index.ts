import { IModule } from '../module.interface';
import { hrRouter } from './hr.router';

export class HRModule implements IModule {
  name = 'hr';
  routes = hrRouter;
}
