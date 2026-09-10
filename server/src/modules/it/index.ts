import { IModule } from '../module.interface';
import { itRouter } from './it.router';

export class ITModule implements IModule {
  name = 'it';
  routes = itRouter;
}
