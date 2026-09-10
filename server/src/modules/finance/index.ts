import { IModule } from '../module.interface';
import { financeRouter } from './finance.router';

export class FinanceModule implements IModule {
  name = 'finance';
  routes = financeRouter;
}
