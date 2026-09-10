import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export class CRMService {
  async getCustomers() {
    return prisma.customer.findMany({
      include: {
        contacts: true,
        deals: true,
        projects: true,
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomer(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: true,
        deals: true,
        projects: true,
        invoices: true,
      },
    });
  }

  async createCustomer(data: {
    name: string;
    website?: string;
    industry?: string;
    status?: string;
    ownerId?: string;
    contact?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      roleTitle?: string;
    };
  }) {
    const { contact, ...customerData } = data;
    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        status: customerData.status || 'ACTIVE',
        contacts: contact
          ? {
              create: {
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                roleTitle: contact.roleTitle,
                isPrimary: true,
              },
            }
          : undefined,
      },
      include: { contacts: true, deals: true },
    });
    logger.info(`Customer created: ${customer.name} (${customer.id})`);
    return customer;
  }

  async updateCustomer(id: string, data: any) {
    return prisma.customer.update({
      where: { id },
      data,
      include: { contacts: true, deals: true },
    });
  }

  async deleteCustomer(id: string) {
    return prisma.customer.delete({
      where: { id },
    });
  }

  async getDeals() {
    return prisma.deal.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDeal(data: {
    customerId: string;
    name: string;
    amount: number;
    stage?: string;
    probability?: number;
    closeDate?: Date | string;
    ownerId?: string;
  }) {
    const deal = await prisma.deal.create({
      data: {
        customerId: data.customerId,
        name: data.name,
        amount: data.amount,
        stage: data.stage || 'NEW',
        probability: data.probability ?? 20,
        closeDate: data.closeDate ? new Date(data.closeDate) : null,
        ownerId: data.ownerId,
      },
      include: { customer: true },
    });
    logger.info(`Deal created: ${deal.name} for $${deal.amount}`);
    return deal;
  }

  async updateDealStage(id: string, stage: string, probability?: number) {
    return prisma.deal.update({
      where: { id },
      data: {
        stage,
        ...(probability !== undefined ? { probability } : {}),
      },
      include: { customer: true },
    });
  }

  async updateDeal(id: string, data: any) {
    return prisma.deal.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
      },
      include: { customer: true },
    });
  }

  async getPipelineStats() {
    const deals = await prisma.deal.findMany({
      include: { customer: true },
    });

    const totalPipeline = deals
      .filter((d: any) => d.stage !== 'WON' && d.stage !== 'LOST')
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

    const weightedPipeline = deals
      .filter((d: any) => d.stage !== 'WON' && d.stage !== 'LOST')
      .reduce((sum: number, d: any) => sum + (Number(d.amount) * d.probability) / 100, 0);

    const wonThisMonth = deals
      .filter((d: any) => d.stage === 'WON')
      .reduce((sum: number, d: any) => sum + Number(d.amount), 0);

    return {
      dealCount: deals.length,
      totalPipeline,
      weightedPipeline,
      wonThisMonth,
      deals,
    };
  }
}

export const crmService = new CRMService();
