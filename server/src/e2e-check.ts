import app from './app';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import { tokenService } from './modules/core/token.service';

const prisma = new PrismaClient();

async function runE2ECheck() {
  console.log('🚀 Starting Comprehensive End-to-End Test Matrix with Authenticated JWT Session...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  const baseUrl = `http://localhost:${port}`;

  const ceo = await prisma.employee.findFirst({ where: { roleTitle: 'Chief Executive Officer' } });
  const { accessToken: authToken } = tokenService.generateTokenPair({
    employeeId: ceo?.id || 'admin-001',
    role: 'SUPER_ADMIN',
    email: ceo?.email || 'admin@uos.com',
  });

  let passed = 0;
  let failed = 0;

  async function checkEndpoint(name: string, url: string, expectedStatus = 200) {
    try {
      const res = await fetch(`${baseUrl}${url}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.status === expectedStatus) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data).length : 1;
        console.log(`✅ [${res.status}] ${name} -> ${url} (${count} items/properties)`);
        passed++;
        return data;
      } else {
        const errBody = await res.text();
        console.error(`❌ [${res.status}] ${name} -> ${url} (expected ${expectedStatus}): ${errBody}`);
        failed++;
        return null;
      }
    } catch (err: any) {
      console.error(`❌ [ERROR] ${name} -> ${url}: ${err.message}`);
      failed++;
      return null;
    }
  }

  // 1. Health & Core
  await checkEndpoint('Health Check', '/health');
  await checkEndpoint('Core Stats', '/api/core/stats');
  await checkEndpoint('Unified Approvals', '/api/core/approvals');
  await checkEndpoint('Employees List', '/api/core/employees?pageSize=5');

  // 2. HR Module
  await checkEndpoint('HR Leaves', '/api/hr/leaves');
  await checkEndpoint('HR Performance Reviews', '/api/hr/performance/reviews');
  await checkEndpoint('HR OKR Goals', '/api/hr/performance/goals');
  await checkEndpoint('HR Benefits Catalog', '/api/hr/benefits/catalog');
  await checkEndpoint('HR Documents', '/api/hr/documents');

  // 3. IT Module
  await checkEndpoint('IT Fleet Devices', '/api/it/devices');
  await checkEndpoint('IT App Catalog', '/api/it/catalog');
  await checkEndpoint('IT App Accesses', '/api/it/access');
  await checkEndpoint('IT Security Policies', '/api/it/security/policies');
  await checkEndpoint('IT Support Tickets', '/api/it/tickets');

  // 4. Finance Module
  await checkEndpoint('Finance Payroll Runs', '/api/finance/payroll');
  await checkEndpoint('Finance Expenses', '/api/finance/expenses');
  await checkEndpoint('Finance Corporate Cards', '/api/finance/cards');
  await checkEndpoint('Finance Comp Bands', '/api/finance/compensation/bands');

  // 5. CRM Module
  await checkEndpoint('CRM Customers', '/api/crm/customers');
  await checkEndpoint('CRM Deals', '/api/crm/deals');
  await checkEndpoint('CRM Pipeline Stats', '/api/crm/pipeline');

  // 6. Projects Module
  await checkEndpoint('Projects List', '/api/projects');
  await checkEndpoint('Projects Tasks', '/api/projects/tasks/all');

  // 7. Procurement Module
  await checkEndpoint('Procurement Invoices', '/api/procurement/invoices');
  await checkEndpoint('Procurement Vendors', '/api/procurement/vendors');
  await checkEndpoint('Procurement Purchase Orders', '/api/procurement/purchase-orders');

  // 8. Workplace Module
  await checkEndpoint('Workplace Attendance', '/api/workplace/attendance');
  await checkEndpoint('Workplace Team Status', '/api/workplace/attendance/team');
  await checkEndpoint('Workplace Job Requisitions', '/api/workplace/recruiting/jobs');
  await checkEndpoint('Workplace Candidates', '/api/workplace/recruiting/candidates');
  await checkEndpoint('Workplace Knowledge Articles', '/api/workplace/knowledge');
  await checkEndpoint('Workplace Learning Courses', '/api/workplace/learning');
  await checkEndpoint('Workplace Chat Channels', '/api/workplace/channels');

  server.close();
  await prisma.$disconnect();

  console.log(`\n==============================================`);
  console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==============================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ECheck().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
