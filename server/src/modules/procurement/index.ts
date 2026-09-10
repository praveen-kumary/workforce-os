import { IModule } from '../module.interface';
import { procurementRouter } from './procurement.router';

export class ProcurementModule implements IModule {
  name = 'procurement';
  routes = procurementRouter;
}
