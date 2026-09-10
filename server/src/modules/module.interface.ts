import { Router } from 'express';

export interface IModule {
  name: string;
  routes: Router;
  // We can add subscribers and queues here later as we implement the event bus
}
