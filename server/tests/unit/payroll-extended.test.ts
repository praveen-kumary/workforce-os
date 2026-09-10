import { PayrollEngine } from '../../src/modules/finance/payroll-calc';

describe('Workflow & Payroll Calculation Logic', () => {
  it('calculates semi-monthly payroll accurately', () => {
    const profile = {
      baseSalary: 12000000, // $120,000 in cents
      payFrequency: 'SEMIMONTHLY',
      taxRate: 20,
    };

    const result = PayrollEngine.calculatePaycheck(profile);

    // 120,000 / 24 periods = $5,000 gross per period
    expect(result.grossPay).toBe(500000);
    // 20% tax = $1,000
    expect(result.taxDeduction).toBe(100000);
    // Net = $4,000
    expect(result.netPay).toBe(400000);
  });

  it('handles custom tax brackets and deduction rules', () => {
    const profile = {
      baseSalary: 18000000, // $180,000
      payFrequency: 'MONTHLY',
      taxRate: 25,
    };

    const result = PayrollEngine.calculatePaycheck(profile);

    // 180,000 / 12 = $15,000 gross per month
    expect(result.grossPay).toBe(1500000);
    // 25% tax = $3,750
    expect(result.taxDeduction).toBe(375000);
    // Net = $11,250
    expect(result.netPay).toBe(1125000);
  });
});
