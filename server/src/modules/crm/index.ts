import { IModule } from '../module.interface';
import { crmRouter } from './crm.router';

export class CRMModule implements IModule {
  name = 'crm';
  routes = crmRouter;
}
