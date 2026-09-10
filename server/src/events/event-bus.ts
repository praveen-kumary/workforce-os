import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';
import { WorkforceQueue } from './queue-names';
import { EventMessage } from './event-types';

class EventBus {
  private queues: Map<WorkforceQueue, Queue> = new Map();

  constructor() {
    for (const queueName of Object.values(WorkforceQueue)) {
      this.queues.set(
        queueName,
        new Queue(queueName, { connection: redisClient })
      );
    }
  }

  async emit<T>(
    eventName: string,
    data: T,
    metadata?: Record<string, any>
  ): Promise<void> {
    const message: EventMessage<T> = {
      eventName,
      body: { data, metadata },
    };

    // We dispatch to all queues. Each worker will decide if it needs to process the event.
    // In a more advanced implementation, we would map events to specific queues based on subscribers.
    for (const queue of this.queues.values()) {
      await queue.add(eventName, message, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
    }
  }
}

export const eventBus = new EventBus();
