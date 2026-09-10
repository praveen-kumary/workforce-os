import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export class ProcurementService {
  // ─── Invoices ───────────────────────────────────────────
  async getInvoices() {
    return prisma.invoice.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoice(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async createInvoice(data: {
    customerId: string;
    invoiceNum?: string;
    amount?: number;
    status?: string;
    dueDate: Date | string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const items = data.items || [];
    const totalAmount =
      data.amount !== undefined
        ? Number(data.amount)
        : items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const invoiceNum =
      data.invoiceNum || `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNum,
        customerId: data.customerId,
        amount: totalAmount,
        status: data.status || 'DRAFT',
        dueDate: new Date(data.dueDate),
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { customer: true, items: true },
    });
    logger.info(`Invoice created: ${invoice.invoiceNum} for $${invoice.amount}`);
    return invoice;
  }

  async updateInvoiceStatus(id: string, status: string) {
    return prisma.invoice.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });
  }

  // ─── Vendors ────────────────────────────────────────────
  async getVendors() {
    return prisma.vendor.findMany({
      include: {
        purchaseOrders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVendor(data: { name: string; category: string; status?: string }) {
    const vendor = await prisma.vendor.create({
      data: {
        name: data.name,
        category: data.category,
        status: data.status || 'ACTIVE',
      },
      include: { purchaseOrders: true },
    });
    logger.info(`Vendor created: ${vendor.name}`);
    return vendor;
  }

  async updateVendor(id: string, data: any) {
    return prisma.vendor.update({
      where: { id },
      data,
      include: { purchaseOrders: true },
    });
  }

  async deleteVendor(id: string) {
    return prisma.vendor.delete({ where: { id } });
  }

  // ─── Purchase Orders ────────────────────────────────────
  async getPurchaseOrders() {
    return prisma.purchaseOrder.findMany({
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseOrder(data: {
    vendorId: string;
    requesterId: string;
    amount: number;
    status?: string;
    poNumber?: string;
  }) {
    const poNumber = data.poNumber || `PO-${Math.floor(2000 + Math.random() * 8000)}`;
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: data.vendorId,
        requesterId: data.requesterId,
        amount: Number(data.amount),
        status: data.status || 'PENDING_APPROVAL',
      },
      include: { vendor: true },
    });
    logger.info(`Purchase Order created: ${po.poNumber} for $${po.amount}`);
    return po;
  }

  async approvePurchaseOrder(id: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { vendor: true },
    });
  }

  async rejectPurchaseOrder(id: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { vendor: true },
    });
  }

  async updatePurchaseOrderStatus(id: string, status: string) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: { vendor: true },
    });
  }
}

export const procurementService = new ProcurementService();
