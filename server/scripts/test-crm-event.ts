import { Queue } from 'bullmq';
import { redisClient } from '../src/config/redis';
import { WorkforceQueue } from '../src/events/queue-names';
import { CRMEvent } from '../src/events/event-types';
import { prisma } from '../src/config/database';

const financeQueue = new Queue(WorkforceQueue.FinanceEvents, { connection: redisClient });

async function run() {
  console.log('1. Creating a mock Customer...');
  const customer = await prisma.customer.create({
    data: {
      name: 'Globex Corporation',
      industry: 'Manufacturing',
      status: 'ACTIVE'
    }
  });

  console.log('2. Creating a Won Deal...');
  const deal = await prisma.deal.create({
    data: {
      customerId: customer.id,
      name: 'Q3 License Expansion',
      amount: 150000,
      stage: 'WON',
      probability: 100
    }
  });

  console.log('3. Firing DEAL_WON event to the Event Bus (BullMQ)...');
  await financeQueue.add(CRMEvent.DEAL_WON, {
    eventName: CRMEvent.DEAL_WON,
    body: {
      data: {
        dealId: deal.id,
        customerId: customer.id,
        amount: Number(deal.amount)
      }
    }
  });

  console.log('✅ Event fired! The Finance Worker should now automatically generate an Invoice.');
  console.log('Check the worker logs to verify.');
  
  process.exit(0);
}

run().catch(console.error);
