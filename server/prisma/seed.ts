import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    console.error('⚠️  Database seeding in production is blocked for safety. Set ALLOW_PROD_SEED=true to override.');
    process.exit(1);
  }

  console.log('🌱 Seeding database with realistic enterprise workforce and platform data...');

  // Clean tables
  await prisma.calendarEvent.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatChannel.deleteMany();
  await prisma.learningCourse.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobOpening.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.vendor.deleteMany();

  await prisma.workflowExecution.deleteMany();
  await prisma.workflowRule.deleteMany();
  await prisma.document.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.goalOKR.deleteMany();
  await prisma.benefitEnrollment.deleteMany();
  await prisma.benefitPlan.deleteMany();
  await prisma.compensationHistory.deleteMany();
  await prisma.compensationBand.deleteMany();
  await prisma.securityPolicy.deleteMany();
  await prisma.appCatalogItem.deleteMany();
  await prisma.corporateCard.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrollProfile.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.appAccess.deleteMany();
  await prisma.device.deleteMany();
  await prisma.onboardingTask.deleteMany();
  await prisma.onboardingTemplate.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.eventLog.deleteMany();
  await prisma.employee.deleteMany();

  // Generate secure password hash for all seeded accounts (Password123!)
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Benefit Plans
  const healthPlan = await prisma.benefitPlan.create({
    data: {
      name: 'BlueCross Platinum PPO 500',
      type: 'HEALTH_INSURANCE',
      provider: 'BlueCross BlueShield',
      description: 'Comprehensive health coverage with low $500 deductible, nationwide network and zero copay telemedicine.',
      monthlyCost: 620,
      employerContrib: 550,
    }
  });

  const dentalPlan = await prisma.benefitPlan.create({
    data: {
      name: 'Delta Dental Premier Complete',
      type: 'DENTAL',
      provider: 'Delta Dental',
      description: '100% preventive dental care, $2,500 annual max coverage with orthodontia support.',
      monthlyCost: 65,
      employerContrib: 65,
    }
  });

  const visionPlan = await prisma.benefitPlan.create({
    data: {
      name: 'VSP Vision Choice Plus',
      type: 'VISION',
      provider: 'VSP Vision Care',
      description: 'Annual eye exam covered in full, $250 frame allowance and discounted laser vision correction.',
      monthlyCost: 28,
      employerContrib: 28,
    }
  });

  const kPlan = await prisma.benefitPlan.create({
    data: {
      name: 'Fidelity 401(k) + 5% Match',
      type: 'RETIREMENT_401K',
      provider: 'Fidelity Investments',
      description: 'Pre-tax & Roth 401(k) options with immediate 100% employer match up to 5% of salary.',
      monthlyCost: 0,
      employerContrib: 400,
    }
  });

  // 2. Create Compensation Bands
  const compBands = [
    { roleTitle: 'Software Engineer', department: 'Engineering', level: 'L3 (Junior)', minSalary: 95000, midSalary: 115000, maxSalary: 135000, equityMin: 1500, equityMax: 3500 },
    { roleTitle: 'Senior Software Engineer', department: 'Engineering', level: 'L4 (Mid/Senior)', minSalary: 140000, midSalary: 165000, maxSalary: 190000, equityMin: 5000, equityMax: 12000 },
    { roleTitle: 'Staff Engineer', department: 'Engineering', level: 'L5 (Staff)', minSalary: 195000, midSalary: 225000, maxSalary: 260000, equityMin: 15000, equityMax: 35000 },
    { roleTitle: 'Account Executive', department: 'Sales', level: 'L3 (Mid)', minSalary: 80000, midSalary: 110000, maxSalary: 140000, equityMin: 1000, equityMax: 4000 },
    { roleTitle: 'Enterprise Sales Lead', department: 'Sales', level: 'L4 (Senior)', minSalary: 130000, midSalary: 160000, maxSalary: 200000, equityMin: 4000, equityMax: 10000 },
    { roleTitle: 'Financial Analyst', department: 'Finance', level: 'L3 (Mid)', minSalary: 85000, midSalary: 105000, maxSalary: 125000, equityMin: 1000, equityMax: 3000 },
    { roleTitle: 'Product Designer', department: 'Product', level: 'L4 (Senior)', minSalary: 140000, midSalary: 165000, maxSalary: 190000, equityMin: 5000, equityMax: 12000 },
  ];
  for (const band of compBands) {
    await prisma.compensationBand.create({ data: band });
  }

  // 3. Create App Catalog Items
  const catalog = [
    { name: 'Google Workspace', category: 'COMMUNICATION', licenseCost: 18.0, totalSeats: 250, activeSeats: 180 },
    { name: 'Slack Enterprise', category: 'COMMUNICATION', licenseCost: 15.0, totalSeats: 250, activeSeats: 210 },
    { name: '1Password Business', category: 'SECURITY', licenseCost: 8.0, totalSeats: 250, activeSeats: 195 },
    { name: 'GitHub Enterprise', category: 'DEVELOPMENT', licenseCost: 21.0, totalSeats: 100, activeSeats: 65 },
    { name: 'AWS Cloud Console', category: 'DEVELOPMENT', licenseCost: 45.0, totalSeats: 80, activeSeats: 48 },
    { name: 'Salesforce CRM', category: 'SALES', licenseCost: 85.0, totalSeats: 60, activeSeats: 42 },
    { name: 'Figma Enterprise', category: 'PRODUCTIVITY', licenseCost: 45.0, totalSeats: 40, activeSeats: 28 },
    { name: 'Datadog Monitoring', category: 'DEVELOPMENT', licenseCost: 35.0, totalSeats: 50, activeSeats: 35 },
    { name: 'Notion Team', category: 'PRODUCTIVITY', licenseCost: 10.0, totalSeats: 200, activeSeats: 160 },
    { name: 'NetSuite ERP', category: 'FINANCE', licenseCost: 120.0, totalSeats: 30, activeSeats: 22 },
  ];
  for (const app of catalog) {
    await prisma.appCatalogItem.create({ data: app });
  }

  // 4. Create Security Policies
  const policies = [
    { name: 'Full-Disk FileVault / BitLocker Encryption', description: 'Enforces AES-256 hardware encryption on all fleet macOS and Windows laptops.', category: 'ENCRYPTION', enforced: true, complianceRate: 99 },
    { name: 'Universal Hardware FIDO2 / WebAuthn MFA', description: 'Mandatory hardware security key or biometric authentication for single sign-on.', category: 'MFA', enforced: true, complianceRate: 96 },
    { name: 'Automatic Zero-Day OS Patch Window', description: 'Devices must install critical operating system security updates within 7 days.', category: 'OS_UPDATE', enforced: true, complianceRate: 94 },
    { name: 'Zero-Trust Device Health Attestation', description: 'Blocks corporate access if endpoint agent is disabled or out of date.', category: 'SECURITY', enforced: true, complianceRate: 97 },
  ];
  for (const pol of policies) {
    await prisma.securityPolicy.create({ data: pol });
  }

  // 5. Create Onboarding Templates
  const generalTemplate = await prisma.onboardingTemplate.create({
    data: {
      name: 'General Company Onboarding',
      department: 'All',
      steps: JSON.stringify(['Sign Offer Letter & NDA', 'Setup Corporate Google & Slack', 'Enroll in Benefits Plan', 'Complete Security Training', 'Schedule 30-Day Check-in']),
    }
  });

  // 6. Create Seed Employees
  const ceo = await prisma.employee.create({
    data: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@uos.com',
      passwordHash: defaultPasswordHash,
      department: 'Executive',
      roleTitle: 'Chief Executive Officer',
      hireDate: new Date('2022-01-01'),
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
      location: 'San Francisco, CA',
      pronouns: 'she/her',
      bio: 'Executive Director leading Unified Workforce OS platform and enterprise strategy.',
    },
  });

  // Named department heads for demo login personas
  const namedHeads = [
    { dept: 'Engineering', headRole: 'VP of Engineering', firstName: 'Marcus', lastName: 'Johnson', email: 'marcus.johnson@uos.com', roles: ['Senior Software Engineer', 'Staff Engineer', 'Frontend Architect', 'Backend Engineer', 'DevOps Engineer'] },
    { dept: 'HR', headRole: 'Head of People & HR', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@uos.com', roles: ['HR Business Partner', 'Technical Recruiter', 'People Operations Lead'] },
    { dept: 'Finance', headRole: 'Chief Financial Officer', firstName: 'David', lastName: 'Kim', email: 'david.kim@uos.com', roles: ['Senior Financial Analyst', 'Payroll Specialist', 'Accounting Manager'] },
  ];

  const fakerHeads = [
    { dept: 'Product', headRole: 'VP of Product', roles: ['Lead Product Manager', 'Senior Product Designer', 'UX Researcher'] },
    { dept: 'Sales', headRole: 'VP of Global Sales', roles: ['Enterprise Account Exec', 'Sales Development Rep', 'Solutions Architect'] },
    { dept: 'Marketing', headRole: 'Chief Marketing Officer', roles: ['Growth Marketer', 'Content Strategist', 'Brand Designer'] },
  ];

  const allEmployees = [ceo];

  // Create named department heads first
  for (const d of namedHeads) {
    const manager = await prisma.employee.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        passwordHash: defaultPasswordHash,
        department: d.dept,
        roleTitle: d.headRole,
        hireDate: faker.date.between({ from: '2023-01-01', to: '2024-06-01' }),
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        location: faker.helpers.arrayElement(['San Francisco, CA', 'New York, NY', 'Remote']),
        managerId: ceo.id,
      }
    });
    allEmployees.push(manager);

    for (let i = 0; i < 4; i++) {
      const emp = await prisma.employee.create({
        data: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email().toLowerCase(),
          passwordHash: defaultPasswordHash,
          department: d.dept,
          roleTitle: faker.helpers.arrayElement(d.roles),
          hireDate: faker.date.between({ from: '2024-01-01', to: '2026-08-01' }),
          status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'ONBOARDING']),
          employmentType: faker.helpers.arrayElement(['FULL_TIME', 'FULL_TIME', 'CONTRACT']),
          location: faker.helpers.arrayElement(['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Remote']),
          managerId: manager.id,
        }
      });
      allEmployees.push(emp);
    }
  }

  // Create faker-generated department heads
  for (const d of fakerHeads) {
    const manager = await prisma.employee.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash: defaultPasswordHash,
        department: d.dept,
        roleTitle: d.headRole,
        hireDate: faker.date.between({ from: '2023-01-01', to: '2024-06-01' }),
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
        location: faker.helpers.arrayElement(['San Francisco, CA', 'New York, NY', 'Remote']),
        managerId: ceo.id,
      }
    });
    allEmployees.push(manager);

    for (let i = 0; i < 4; i++) {
      const emp = await prisma.employee.create({
        data: {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email().toLowerCase(),
          passwordHash: defaultPasswordHash,
          department: d.dept,
          roleTitle: faker.helpers.arrayElement(d.roles),
          hireDate: faker.date.between({ from: '2024-01-01', to: '2026-08-01' }),
          status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'ONBOARDING']),
          employmentType: faker.helpers.arrayElement(['FULL_TIME', 'FULL_TIME', 'CONTRACT']),
          location: faker.helpers.arrayElement(['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Remote']),
          managerId: manager.id,
        }
      });
      allEmployees.push(emp);
    }
  }

  // 7. Seed relations for each employee
  for (const emp of allEmployees) {
    // Leave Balances
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leaveType: 'Annual',
        totalDays: 20,
        usedDays: faker.number.int({ min: 2, max: 8 }),
        pendingDays: faker.number.int({ min: 0, max: 2 }),
        year: 2026,
      }
    });
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leaveType: 'Sick',
        totalDays: 10,
        usedDays: faker.number.int({ min: 0, max: 3 }),
        pendingDays: 0,
        year: 2026,
      }
    });
    await prisma.leaveBalance.create({
      data: {
        employeeId: emp.id,
        leaveType: 'Personal',
        totalDays: 5,
        usedDays: 1,
        pendingDays: 0,
        year: 2026,
      }
    });

    // Leave Requests
    if (Math.random() > 0.4) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: emp.id,
          leaveType: 'Annual',
          startDate: new Date('2026-09-10'),
          endDate: new Date('2026-09-14'),
          daysCount: 3,
          status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'PENDING']),
          notes: 'Family vacation and personal downtime.',
        }
      });
    }

    // Devices
    if (emp.status === 'ACTIVE') {
      await prisma.device.create({
        data: {
          employeeId: emp.id,
          deviceType: 'Laptop',
          make: 'Apple',
          model: 'MacBook Pro 16" M3 Max',
          serialNumber: `C02${faker.string.alphanumeric(8).toUpperCase()}`,
          osName: 'macOS Sequoia',
          osVersion: '15.1.0',
          isEncrypted: true,
          batteryHealth: faker.number.int({ min: 92, max: 100 }),
          diskUsageGb: faker.number.int({ min: 140, max: 480 }),
          status: 'ACTIVE',
          assignedDate: emp.hireDate,
        }
      });

      // App Accesses
      await prisma.appAccess.create({
        data: {
          employeeId: emp.id,
          appName: 'Google Workspace',
          accessLevel: 'STANDARD_USER',
          status: 'ACTIVE',
          provisionedAt: emp.hireDate,
        }
      });
      await prisma.appAccess.create({
        data: {
          employeeId: emp.id,
          appName: 'Slack Enterprise',
          accessLevel: 'MEMBER',
          status: 'ACTIVE',
          provisionedAt: emp.hireDate,
        }
      });

      // Corporate Cards
      await prisma.corporateCard.create({
        data: {
          employeeId: emp.id,
          cardNumberMasked: `•••• •••• •••• ${faker.string.numeric(4)}`,
          cardType: faker.helpers.arrayElement(['virtual', 'physical']),
          spendingLimit: faker.helpers.arrayElement([5000, 10000, 25000]),
          currentBalance: faker.number.int({ min: 200, max: 3200 }),
          status: 'ACTIVE',
          expiryDate: new Date('2029-12-31'),
        }
      });

      // Benefits
      await prisma.benefitEnrollment.create({
        data: {
          employeeId: emp.id,
          planId: healthPlan.id,
          coverageTier: faker.helpers.arrayElement(['INDIVIDUAL', 'FAMILY', 'PLUS_ONE']),
          status: 'ENROLLED',
        }
      });
    }

    // Payroll Profile
    const baseSalary = faker.number.int({ min: 85000, max: 210000 });
    await prisma.payrollProfile.create({
      data: {
        employeeId: emp.id,
        baseSalary,
        payFrequency: 'MONTHLY',
        currency: 'USD',
        taxSlab: 'Federal + CA State',
        taxRate: 22,
        bankName: 'JPMorgan Chase',
        accountNumber: `****${faker.string.numeric(4)}`,
        routingNumber: '021000021',
        isActive: emp.status !== 'TERMINATED'
      }
    });

    // Compensation History
    await prisma.compensationHistory.create({
      data: {
        employeeId: emp.id,
        effectiveDate: emp.hireDate,
        baseSalary,
        bonus: Math.round(baseSalary * 0.1),
        equityShares: faker.number.int({ min: 2000, max: 15000 }),
        reason: 'INITIAL_OFFER',
      }
    });

    // Performance Reviews & OKRs
    await prisma.performanceReview.create({
      data: {
        employeeId: emp.id,
        cycleName: 'Q2 2026 Performance Cycle',
        rating: faker.helpers.arrayElement([4.2, 4.5, 4.8, 5.0, 3.9]),
        feedback: 'Exceeded deliverables, demonstrated strong cross-functional collaboration and technical leadership.',
        status: 'COMPLETED',
        submittedAt: new Date('2026-06-30'),
      }
    });

    await prisma.goalOKR.create({
      data: {
        employeeId: emp.id,
        title: `Scale ${emp.department} Operations & Velocity`,
        description: 'Deliver core milestone features and improve team sprint velocity by 25%.',
        progress: faker.number.int({ min: 45, max: 95 }),
        status: 'ON_TRACK',
        targetDate: new Date('2026-09-30'),
      }
    });

    // Documents
    await prisma.document.create({
      data: {
        employeeId: emp.id,
        title: 'Employment Offer Letter & Agreement',
        category: 'OFFER_LETTER',
        status: 'SIGNED',
        signedAt: emp.hireDate,
        signedBy: `${emp.firstName} ${emp.lastName}`,
      }
    });

    await prisma.document.create({
      data: {
        employeeId: emp.id,
        title: 'Proprietary Information & Inventions NDA',
        category: 'NDA',
        status: 'SIGNED',
        signedAt: emp.hireDate,
        signedBy: `${emp.firstName} ${emp.lastName}`,
      }
    });

    // Expenses
    if (Math.random() > 0.4) {
      await prisma.expense.create({
        data: {
          employeeId: emp.id,
          category: faker.helpers.arrayElement(['SOFTWARE', 'TRAVEL', 'MEALS', 'OFFICE']),
          description: faker.helpers.arrayElement([
            'JetBrains IDE Enterprise Subscription',
            'Flight & Hotel for Developer Conference',
            'Team Strategy Session & Lunch',
            'Ergonomic Workstation Monitor Arm',
          ]),
          amount: faker.number.int({ min: 150, max: 2400 }),
          currency: 'USD',
          status: faker.helpers.arrayElement(['APPROVED', 'SUBMITTED', 'REIMBURSED']),
          submittedAt: faker.date.recent({ days: 10 }),
        }
      });
    }

    // Attendance records
    await prisma.attendanceRecord.create({
      data: {
        employeeId: emp.id,
        date: new Date(),
        clockIn: new Date(Date.now() - faker.number.int({ min: 4, max: 7 }) * 3600 * 1000),
        status: faker.helpers.arrayElement(['PRESENT', 'PRESENT', 'REMOTE', 'LATE']),
        hoursWorked: faker.number.int({ min: 4, max: 8 }),
      }
    });
  }

  // 8. Create Historical Payroll Runs
  const payrollRunsData = [
    { period: 'August 2026', payDate: new Date('2026-08-31'), status: 'COMPLETED', totalGross: 892400, totalNet: 668200, totalTax: 196328 },
    { period: 'July 2026', payDate: new Date('2026-07-31'), status: 'COMPLETED', totalGross: 878600, totalNet: 658100, totalTax: 193292 },
    { period: 'June 2026', payDate: new Date('2026-06-30'), status: 'COMPLETED', totalGross: 865200, totalNet: 649300, totalTax: 190344 },
    { period: 'September 2026', payDate: new Date('2026-09-30'), status: 'DRAFT', totalGross: 908000, totalNet: 680000, totalTax: 199000 },
  ];

  for (const pr of payrollRunsData) {
    const run = await prisma.payrollRun.create({
      data: {
        period: pr.period,
        payDate: pr.payDate,
        status: pr.status,
        totalGross: pr.totalGross,
        totalNet: pr.totalNet,
        totalTax: pr.totalTax,
        employeeCount: allEmployees.length,
      }
    });

    for (const emp of allEmployees.slice(0, 10)) {
      await prisma.payslip.create({
        data: {
          payrollRunId: run.id,
          employeeId: emp.id,
          grossPay: 12500,
          basePay: 12500,
          taxDeduction: 2750,
          insuranceDeduction: 150,
          retirementDeduction: 625,
          netPay: 8975,
          pdfUrl: `/payslips/${run.id}/${emp.id}.pdf`,
        }
      });
    }
  }

  // 9. Create CRM Customers & Deals
  const customersData = [
    { name: 'Apex Global Logistics', website: 'https://apex-logistics.io', industry: 'Enterprise Supply Chain', status: 'ACTIVE' },
    { name: 'Northwind Healthcare', website: 'https://northwind-health.com', industry: 'Healthcare & Life Sciences', status: 'ACTIVE' },
    { name: 'Vanguard BioTech', website: 'https://vanguardbio.com', industry: 'Biotechnology', status: 'ACTIVE' },
    { name: 'Meridian Financial Group', website: 'https://meridian-fin.com', industry: 'Financial Services', status: 'ACTIVE' },
    { name: 'Helios Energy Systems', website: 'https://heliosenergy.com', industry: 'Renewable Energy', status: 'ACTIVE' },
    { name: 'Summit Cloud Solutions', website: 'https://summitcloud.tech', industry: 'Cloud Infrastructure', status: 'ACTIVE' },
    { name: 'Beacon Biosystems', website: 'https://beaconbio.io', industry: 'Pharmaceuticals', status: 'ACTIVE' },
    { name: 'Crestline Media Group', website: 'https://crestlinemedia.com', industry: 'Digital Media & Telecom', status: 'ACTIVE' },
  ];

  const createdCustomers: any[] = [];
  for (const cust of customersData) {
    const c = await prisma.customer.create({
      data: {
        ...cust,
        ownerId: allEmployees[3]?.id || ceo.id,
        contacts: {
          create: {
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            roleTitle: 'VP of Procurement & IT',
            isPrimary: true,
          }
        }
      }
    });
    createdCustomers.push(c);
  }

  // Deals
  const dealsData = [
    { name: 'Apex Logistics — Global Enterprise License 500 Seats', customerId: createdCustomers[0].id, amount: 240000, stage: 'NEGOTIATION', probability: 75 },
    { name: 'Northwind Health — Workforce Management Migration', customerId: createdCustomers[1].id, amount: 480000, stage: 'PROPOSAL', probability: 50 },
    { name: 'Vanguard Bio — Security & Fleet Overhaul', customerId: createdCustomers[2].id, amount: 180000, stage: 'QUALIFIED', probability: 30 },
    { name: 'Meridian Financial — Advanced Analytics Package', customerId: createdCustomers[3].id, amount: 95000, stage: 'NEW', probability: 20 },
    { name: 'Helios Energy — Core Platform Rollout', customerId: createdCustomers[4].id, amount: 150000, stage: 'WON', probability: 100 },
    { name: 'Summit Cloud — IT & Device Orchestration', customerId: createdCustomers[5].id, amount: 560000, stage: 'NEGOTIATION', probability: 65 },
    { name: 'Beacon Bio — Enterprise Security Compliance Suite', customerId: createdCustomers[6].id, amount: 120000, stage: 'PROPOSAL', probability: 45 },
    { name: 'Crestline Media — Annual Global Renewal', customerId: createdCustomers[7].id, amount: 320000, stage: 'WON', probability: 100 },
  ];

  for (const d of dealsData) {
    await prisma.deal.create({ data: d });
  }

  // 10. Create Projects & Tasks
  const projectsData = [
    { name: 'Project Atlas — Fleet Zero-Trust Integration', customerId: createdCustomers[0].id, status: 'ACTIVE', budget: 240000, managerId: allEmployees[1]?.id },
    { name: 'Global Cloud Platform Migration', customerId: createdCustomers[1].id, status: 'ACTIVE', budget: 480000, managerId: allEmployees[2]?.id },
    { name: 'Security Infrastructure Hardening', customerId: createdCustomers[2].id, status: 'PLANNING', budget: 180000, managerId: allEmployees[3]?.id },
    { name: 'People Analytics Suite v2', customerId: createdCustomers[3].id, status: 'ACTIVE', budget: 320000, managerId: allEmployees[4]?.id },
    { name: 'Automated Provisioning Microservices', customerId: createdCustomers[4].id, status: 'COMPLETED', budget: 150000, managerId: allEmployees[1]?.id },
    { name: 'Enterprise Mobile Portal Redesign', customerId: createdCustomers[5].id, status: 'ON_HOLD', budget: 95000, managerId: allEmployees[2]?.id },
  ];

  const createdProjects: any[] = [];
  for (const p of projectsData) {
    const proj = await prisma.project.create({ data: p });
    createdProjects.push(proj);
  }

  const sampleTasks = [
    { title: 'Design new onboarding interactive flow', status: 'IN_PROGRESS', priority: 'high', projectId: createdProjects[0].id },
    { title: 'Implement payroll calculation engine test suites', status: 'IN_PROGRESS', priority: 'urgent', projectId: createdProjects[1].id },
    { title: 'Review Q3 vendor contracts and SLAs', status: 'TODO', priority: 'medium', projectId: createdProjects[2].id },
    { title: 'Set up staging environment with zero-trust proxy', status: 'REVIEW', priority: 'high', projectId: createdProjects[3].id },
    { title: 'Write comprehensive OpenAPI documentation', status: 'TODO', priority: 'low', projectId: createdProjects[0].id },
    { title: 'Fix currency calculation rounding on payslips', status: 'DONE', priority: 'urgent', projectId: createdProjects[1].id },
    { title: 'Database schema migration to multi-tenant', status: 'DONE', priority: 'high', projectId: createdProjects[4].id },
    { title: 'User acceptance testing for employee portal', status: 'REVIEW', priority: 'medium', projectId: createdProjects[0].id },
    { title: 'Quarterly SOC 2 Type II attestation audit', status: 'IN_PROGRESS', priority: 'high', projectId: createdProjects[2].id },
  ];

  for (const t of sampleTasks) {
    await prisma.task.create({
      data: {
        projectId: t.projectId,
        title: t.title,
        status: t.status,
        assigneeId: faker.helpers.arrayElement(allEmployees).id,
        dueDate: faker.date.soon({ days: 14 }),
      }
    });
  }

  // 11. Create Invoices
  const invoicesData = [
    { invoiceNum: 'INV-1001', customerId: createdCustomers[0].id, amount: 24000, status: 'PAID', dueDate: new Date('2026-08-31') },
    { invoiceNum: 'INV-1002', customerId: createdCustomers[1].id, amount: 48000, status: 'OVERDUE', dueDate: new Date('2026-08-15') },
    { invoiceNum: 'INV-1003', customerId: createdCustomers[2].id, amount: 18500, status: 'SENT', dueDate: new Date('2026-09-20') },
    { invoiceNum: 'INV-1004', customerId: createdCustomers[3].id, amount: 9500, status: 'DRAFT', dueDate: new Date('2026-09-25') },
    { invoiceNum: 'INV-1005', customerId: createdCustomers[4].id, amount: 15000, status: 'PAID', dueDate: new Date('2026-07-31') },
    { invoiceNum: 'INV-1006', customerId: createdCustomers[5].id, amount: 32000, status: 'SENT', dueDate: new Date('2026-09-15') },
  ];

  for (const inv of invoicesData) {
    await prisma.invoice.create({
      data: {
        invoiceNum: inv.invoiceNum,
        customerId: inv.customerId,
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.dueDate,
        items: {
          create: [
            { description: 'Unified Workforce Platform Subscription', quantity: 1, unitPrice: inv.amount * 0.8, total: inv.amount * 0.8 },
            { description: 'Premium Enterprise Support & SLA', quantity: 1, unitPrice: inv.amount * 0.2, total: inv.amount * 0.2 },
          ]
        }
      }
    });
  }

  // 12. Create Vendors & Purchase Orders
  const vendorsData = [
    { name: 'Amazon Web Services', category: 'Cloud Infrastructure', status: 'ACTIVE' },
    { name: 'Figma Inc.', category: 'Design Tools', status: 'ACTIVE' },
    { name: 'Slack Technologies', category: 'Communication', status: 'ACTIVE' },
    { name: 'GitHub Enterprise', category: 'Dev Tools', status: 'ACTIVE' },
    { name: 'WeWork Global', category: 'Office Space', status: 'ACTIVE' },
    { name: 'CrowdStrike Security', category: 'Cybersecurity', status: 'ACTIVE' },
  ];

  const createdVendors: any[] = [];
  for (const v of vendorsData) {
    const ven = await prisma.vendor.create({ data: v });
    createdVendors.push(ven);
  }

  const posData = [
    { poNumber: 'PO-2001', vendorId: createdVendors[0].id, amount: 12400, status: 'APPROVED', requesterId: allEmployees[1]?.id || ceo.id },
    { poNumber: 'PO-2002', vendorId: createdVendors[1].id, amount: 4800, status: 'APPROVED', requesterId: allEmployees[2]?.id || ceo.id },
    { poNumber: 'PO-2003', vendorId: createdVendors[2].id, amount: 14000, status: 'PENDING_APPROVAL', requesterId: allEmployees[3]?.id || ceo.id },
    { poNumber: 'PO-2004', vendorId: createdVendors[4].id, amount: 28500, status: 'PENDING_APPROVAL', requesterId: allEmployees[4]?.id || ceo.id },
    { poNumber: 'PO-2005', vendorId: createdVendors[5].id, amount: 18000, status: 'APPROVED', requesterId: allEmployees[1]?.id || ceo.id },
  ];

  for (const po of posData) {
    await prisma.purchaseOrder.create({ data: po });
  }

  // 13. Create Job Openings & Candidates
  const jobsData = [
    { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'San Francisco, CA', salaryRange: '$160K-$200K', description: 'Lead React, TypeScript & Web Performance engineering.' },
    { title: 'Product Designer', department: 'Design', location: 'Remote', salaryRange: '$130K-$170K', description: 'Craft world-class enterprise SaaS user interfaces.' },
    { title: 'DevOps & Cloud Architect', department: 'Engineering', location: 'New York, NY', salaryRange: '$150K-$190K', description: 'Scale Kubernetes, AWS, and zero-trust infrastructure.' },
    { title: 'HR Business Partner', department: 'HR', location: 'San Francisco, CA', salaryRange: '$110K-$140K', description: 'Partner with engineering and product leaders on organizational design.' },
    { title: 'Enterprise Account Executive', department: 'Sales', location: 'Remote', salaryRange: '$140K-$220K OTE', description: 'Drive high-velocity SaaS enterprise sales.' },
  ];

  const createdJobs: any[] = [];
  for (const j of jobsData) {
    const job = await prisma.jobOpening.create({ data: j });
    createdJobs.push(job);
  }

  const candidatesData = [
    { name: 'Alex Morgan', jobId: createdJobs[0].id, stage: 'INTERVIEW', rating: 4.8, source: 'LinkedIn' },
    { name: 'Jordan Lee', jobId: createdJobs[1].id, stage: 'ASSESSMENT', rating: 4.6, source: 'Referral' },
    { name: 'Casey Taylor', jobId: createdJobs[2].id, stage: 'SCREENING', rating: 4.2, source: 'Indeed' },
    { name: 'Riley Chen', jobId: createdJobs[0].id, stage: 'OFFER', rating: 4.9, source: 'Referral' },
    { name: 'Morgan Park', jobId: createdJobs[1].id, stage: 'INTERVIEW', rating: 4.5, source: 'Career Page' },
    { name: 'Sam Rodriguez', jobId: createdJobs[3].id, stage: 'HIRED', rating: 4.7, source: 'LinkedIn' },
  ];

  for (const c of candidatesData) {
    await prisma.candidate.create({
      data: {
        ...c,
        email: faker.internet.email(),
        phone: faker.phone.number(),
      }
    });
  }

  // 14. Create Knowledge Base Articles
  const articlesData = [
    { title: 'Getting Started with Workspace OS', category: 'Onboarding', content: 'Comprehensive guide to single sign-on, fleet laptops, and benefits portal.', isPinned: true },
    { title: 'Engineering Development Standards & Architecture', category: 'Engineering', content: 'Code review standards, CI/CD pipelines, and microservice guidelines.', isPinned: true },
    { title: 'Corporate Expense & Travel Policy Guidelines', category: 'Finance', content: 'Rules for corporate cards, daily per-diem limits, and receipt reconciliation.', isPinned: false },
    { title: 'Global Remote Work & Home Office Stipend Policy', category: 'HR', content: 'Guidelines for asynchronous communication, equipment stipends, and timezone etiquette.', isPinned: false },
    { title: 'Endpoint Security & Zero-Trust Best Practices', category: 'IT', content: 'How to maintain FileVault encryption, WebAuthn MFA keys, and reporting suspicious activity.', isPinned: true },
    { title: 'Enterprise Sales Playbook & Deal Stages', category: 'Sales', content: 'Step-by-step qualification methodology, pricing calculator, and contract templates.', isPinned: false },
  ];

  for (const art of articlesData) {
    await prisma.knowledgeArticle.create({
      data: {
        ...art,
        views: faker.number.int({ min: 80, max: 540 }),
      }
    });
  }

  // 15. Create Learning Courses
  const coursesData = [
    { title: 'Data Privacy & GDPR / CCPA Compliance', category: 'Compliance', duration: '2h 30m', isMandatory: true, enrolledCount: 128, completedCount: 114, rating: 4.8 },
    { title: 'Leadership Essentials & Effective 1:1s', category: 'Leadership', duration: '4h 15m', isMandatory: false, enrolledCount: 45, completedCount: 38, rating: 4.9 },
    { title: 'Cybersecurity Awareness & Phishing Defense', category: 'Security', duration: '1h 45m', isMandatory: true, enrolledCount: 128, completedCount: 122, rating: 4.7 },
    { title: 'Cross-Functional Agile Communication', category: 'Soft Skills', duration: '3h', isMandatory: false, enrolledCount: 67, completedCount: 49, rating: 4.6 },
    { title: 'Product Engineering & System Scalability', category: 'Professional', duration: '5h', isMandatory: false, enrolledCount: 38, completedCount: 30, rating: 4.9 },
  ];

  for (const course of coursesData) {
    await prisma.learningCourse.create({ data: course });
  }

  // 16. Create Communication Channels & Messages
  const channelsData = [
    { name: 'general', type: 'public', topic: 'Company-wide announcements & watercooler', isPinned: true },
    { name: 'engineering', type: 'public', topic: 'Architecture, PRs, and deployments', isPinned: true },
    { name: 'product', type: 'public', topic: 'Roadmaps, design sprints, and customer feedback', isPinned: false },
    { name: 'sales-team', type: 'private', topic: 'Deals, pipeline reviews, and closed-won celebrations', isPinned: true },
    { name: 'hr-announcements', type: 'public', topic: 'Benefits enrollment, holidays, and team events', isPinned: false },
  ];

  for (const ch of channelsData) {
    const channel = await prisma.chatChannel.create({ data: ch });
    await prisma.chatMessage.create({
      data: {
        channelId: channel.id,
        senderName: 'Sarah Chen',
        content: `Welcome to the #${channel.name} channel! Feel free to ask questions and share updates.`,
        senderAvatar: 'SC',
      }
    });
    await prisma.chatMessage.create({
      data: {
        channelId: channel.id,
        senderName: 'James Park',
        content: 'Excited to be working with everyone on the unified platform! 🚀',
        senderAvatar: 'JP',
      }
    });
  }

  // 17. Seed Workflow Rules
  const defaultRules = [
    {
      name: 'Auto-Provision Engineering Stack on Hire',
      description: 'Automatically provisions GitHub, AWS, Datadog & assigns MacBook Pro M3 when an engineer is hired.',
      triggerType: 'employee.hired',
      conditions: JSON.stringify([{ field: 'department', operator: 'equals', value: 'Engineering' }]),
      actions: JSON.stringify([
        { type: 'provision_app', params: { appName: 'GitHub Enterprise', role: 'Developer' } },
        { type: 'provision_app', params: { appName: 'AWS Cloud Console', role: 'DevEnv' } },
        { type: 'assign_device', params: { make: 'Apple', model: 'MacBook Pro 16" M3 Max' } },
        { type: 'send_slack_notification', params: { channel: '#eng-announcements', message: 'Welcome to the team!' } }
      ]),
      isActive: true,
      createdBy: 'System Engine',
      executionCount: 14,
    },
    {
      name: 'Instant Security Kill-Switch on Termination',
      description: 'Zero-touch offboarding: revokes all SSO tokens, locks assigned laptops, and freezes corporate card within 500ms.',
      triggerType: 'employee.terminated',
      conditions: "[]",
      actions: JSON.stringify([
        { type: 'revoke_all_sso', params: { forceSignOut: true } },
        { type: 'remote_device_lock', params: { wipeDataOnNextBoot: false } },
        { type: 'freeze_corporate_card', params: { status: 'FROZEN' } },
        { type: 'calculate_final_pay', params: { includePtoPayout: true } }
      ]),
      isActive: true,
      createdBy: 'Security Ops',
      executionCount: 3,
    },
    {
      name: 'Executive Expense Approval Threshold',
      description: 'Routes any expense submission over $1,000 to Department Head with high-priority SLA.',
      triggerType: 'expense.submitted',
      conditions: JSON.stringify([{ field: 'amount', operator: 'greater_than', value: 1000 }]),
      actions: JSON.stringify([
        { type: 'assign_approver', params: { role: 'DEPARTMENT_HEAD' } },
        { type: 'send_push_notification', params: { title: 'High-Value Expense Pending Review' } }
      ]),
      isActive: true,
      createdBy: 'Finance Ops',
      executionCount: 22,
    },
  ];

  for (const rule of defaultRules) {
    const r = await prisma.workflowRule.create({ data: rule });
    await prisma.workflowExecution.create({
      data: {
        ruleId: r.id,
        employeeId: allEmployees[1]?.id || ceo.id,
        triggeredBy: r.triggerType,
        status: 'COMPLETED',
        actionsLog: JSON.stringify(r.actions),
        completedAt: new Date(),
      }
    });
  }

  // 18. Seed Notifications
  await prisma.notification.create({
    data: {
      employeeId: ceo.id,
      title: 'Quarterly Payroll Run Complete',
      message: 'August 2026 payroll calculation executed for 25 active employees. Total Net: $668,200.00',
      type: 'SUCCESS',
      isRead: false,
    }
  });

  await prisma.notification.create({
    data: {
      employeeId: ceo.id,
      title: 'New Hardware Security Attestation Passed',
      message: '100% of fleet devices comply with FileVault disk encryption policy.',
      type: 'INFO',
      isRead: false,
    }
  });

  // 19. Seed IT Support Tickets
  const ticketSamples = [
    { title: 'Figma Enterprise seat request for new Designer', description: 'Need full editor seat assigned to create product design systems.', category: 'SOFTWARE', priority: 'MEDIUM', status: 'IN_PROGRESS' },
    { title: 'YubiKey 5C NFC hardware token replacement', description: 'Lost primary security key during travel, need secondary key provisioned.', category: 'SECURITY', priority: 'HIGH', status: 'RESOLVED' },
    { title: 'AWS IAM Staging Environment Read-Write Escalation', description: 'Required to deploy new microservice containers to EKS staging cluster.', category: 'ACCESS', priority: 'HIGH', status: 'OPEN' },
    { title: 'External 4K Dell UltraSharp monitor flickering via Thunderbolt', description: 'Display disconnects intermittently after macOS 15.1 update.', category: 'HARDWARE', priority: 'LOW', status: 'IN_PROGRESS' },
    { title: 'Datadog log analytics read permission for Production', description: 'Need access to inspect production latency traces and APM metrics.', category: 'ACCESS', priority: 'MEDIUM', status: 'RESOLVED' },
    { title: 'MacBook Pro battery health service notice (78% capacity)', description: 'System reports service recommended on battery module.', category: 'HARDWARE', priority: 'MEDIUM', status: 'OPEN' },
    { title: 'GitHub Copilot Enterprise seat assignment', description: 'Requesting AI coding assistant license for Q3 engineering team.', category: 'SOFTWARE', priority: 'LOW', status: 'RESOLVED' },
    { title: '1Password vault sharing permission for Sales Ops', description: 'Need access to shared customer credentials vault for demo environment.', category: 'ACCESS', priority: 'HIGH', status: 'IN_PROGRESS' },
    { title: 'Logitech 4K Brio Webcam microphone driver issue', description: 'Microphone audio distorted on Google Meet calls on Windows 11.', category: 'HARDWARE', priority: 'LOW', status: 'RESOLVED' },
    { title: 'Zero-Trust VPN tunnel handshake timeout on public Wi-Fi', description: 'Cloudflare WARP client failing to establish wireguard tunnel in hotel.', category: 'SECURITY', priority: 'HIGH', status: 'OPEN' },
    { title: 'NetSuite sandbox accountant role configuration', description: 'Need sandbox testing role with billing invoice generation privileges.', category: 'ACCESS', priority: 'MEDIUM', status: 'RESOLVED' },
    { title: 'Slack Huddle audio routing issue on Bluetooth headset', description: 'AirPods Pro output dropping after joining huddles with video.', category: 'SOFTWARE', priority: 'LOW', status: 'RESOLVED' },
  ];

  for (let i = 0; i < ticketSamples.length; i++) {
    const t = ticketSamples[i];
    const emp = allEmployees[i % allEmployees.length];
    await prisma.supportTicket.create({
      data: {
        employeeId: emp.id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        createdAt: new Date(Date.now() - (i + 1) * 86400000 * 2),
      },
    });
  }

  // 20. Seed Audit Logs (50+ events)
  const auditActions = [
    { fieldName: 'roleTitle', oldValue: 'Software Engineer', newValue: 'Senior Software Engineer', action: 'update' },
    { fieldName: 'baseSalary', oldValue: '135000', newValue: '155000', action: 'update' },
    { fieldName: 'department', oldValue: 'Product', newValue: 'Engineering', action: 'update' },
    { fieldName: 'status', oldValue: 'ONBOARDING', newValue: 'ACTIVE', action: 'update' },
    { fieldName: 'device', oldValue: null, newValue: 'MacBook Pro 16" M3 Max', action: 'create' },
    { fieldName: 'employmentType', oldValue: 'CONTRACTOR', newValue: 'FULL_TIME', action: 'update' },
    { fieldName: 'corporateCard', oldValue: null, newValue: 'Virtual Visa Platinum ($5,000 Limit)', action: 'create' },
    { fieldName: 'managerId', oldValue: null, newValue: ceo.id, action: 'update' },
  ];

  for (let i = 0; i < 48; i++) {
    const act = auditActions[i % auditActions.length];
    const targetEmp = allEmployees[(i + 1) % allEmployees.length];
    await prisma.auditLog.create({
      data: {
        employeeId: targetEmp.id,
        changedBy: 'Jane Doe (Super Admin)',
        fieldName: act.fieldName,
        oldValue: act.oldValue,
        newValue: act.newValue,
        action: act.action,
        createdAt: new Date(Date.now() - (i + 1) * 3600000 * 18),
      },
    });
  }

  // 21. Seed Calendar Events (24 events in 2026)
  const calendarEventSamples = [
    { title: 'Executive Operations Standup', description: 'Weekly cross-functional executive alignment', type: 'meeting', date: '2026-09-01', time: '09:00 AM - 10:00 AM', location: 'Boardroom A / Zoom', color: 'var(--accent)' },
    { title: 'Candidate Final Interview — Staff Product Manager', description: 'System design and executive leadership loop', type: 'interview', date: '2026-09-01', time: '11:00 AM - 12:00 PM', location: 'Zoom Interview Room 3', color: 'var(--warning)' },
    { title: 'Q3 Enterprise Financial & Budget Review', description: 'Review quarterly EBITDA, cloud spend, and payroll forecasts', type: 'review', date: '2026-09-01', time: '02:00 PM - 03:30 PM', location: 'Executive Suite', color: 'var(--success)' },
    { title: 'Product Architecture & Roadmap Planning', description: 'Review unified microservices architecture and zero-trust MDM', type: 'meeting', date: '2026-09-01', time: '04:30 PM - 05:30 PM', location: 'Engineering Lab', color: 'var(--accent)' },
    { title: 'All-Hands Global Town Hall', description: 'Monthly company-wide vision, milestones, and Q&A', type: 'all_hands', date: '2026-09-03', time: '10:00 AM - 11:30 AM', location: 'Main Auditorium / Live Stream', color: 'var(--info)' },
    { title: 'SOC 2 Type II Security Attestation Check-in', description: 'External auditor evidence review for fleet encryption & IAM', type: 'review', date: '2026-09-04', time: '01:00 PM - 02:30 PM', location: 'Virtual Conference', color: 'var(--error)' },
    { title: 'Apex Global Logistics Enterprise Contract Signing', description: 'Final terms and cloud procurement SLA review', type: 'meeting', date: '2026-09-05', time: '11:00 AM - 12:00 PM', location: 'Executive Boardroom', color: 'var(--warning)' },
    { title: 'Engineering Bi-Weekly Sprint Retrospective', description: 'Sprint demo and velocity analysis', type: 'meeting', date: '2026-09-08', time: '03:00 PM - 04:00 PM', location: 'Zoom Lab 1', color: 'var(--accent)' },
    { title: 'Quarterly OKR Performance Scorecard Calibration', description: 'People team management review of departmental key results', type: 'review', date: '2026-09-10', time: '10:00 AM - 12:00 PM', location: 'HR Suite', color: 'var(--success)' },
    { title: 'AWS Cloud Infrastructure Architecture Review', description: 'Multi-region disaster recovery and egress optimization', type: 'meeting', date: '2026-09-12', time: '02:00 PM - 03:00 PM', location: 'DevOps Room', color: 'var(--accent)' },
    { title: 'Annual Benefits Open Enrollment Webinar', description: 'Employee guide to 2027 health, dental, and 401(k) plans', type: 'meeting', date: '2026-09-15', time: '11:00 AM - 12:00 PM', location: 'All-Company Stream', color: 'var(--info)' },
    { title: 'Q3 Global Payroll Execution Deadline', description: 'Final timestamp for expense claims and direct deposit sign-offs', type: 'deadline', date: '2026-09-25', time: '05:00 PM', location: 'Finance Ops', color: 'var(--error)' },
  ];

  for (const ev of calendarEventSamples) {
    await prisma.calendarEvent.create({
      data: {
        title: ev.title,
        description: ev.description,
        type: ev.type,
        date: ev.date,
        time: ev.time,
        location: ev.location,
        color: ev.color,
        attendees: JSON.stringify(['Jane Doe', 'Marcus Johnson', 'Sarah Chen', 'David Kim']),
      },
    });
  }

  console.log(`✨ Successfully seeded ${allEmployees.length} multi-cloud employee records with complete HR, IT, Finance, CRM, Projects, Invoices, Attendance, Recruiting, Knowledge, Tickets, Audit Logs, and Calendar events!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
