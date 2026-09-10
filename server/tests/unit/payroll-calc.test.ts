import { PayrollEngine, PayrollProfile } from '../../src/modules/finance/payroll-calc';

describe('PayrollEngine', () => {
  it('calculates monthly paycheck correctly for 120k salary with 20% tax', () => {
    const profile: PayrollProfile = {
      baseSalary: 12000000, // $120,000.00 in cents
      payFrequency: 'MONTHLY',
      taxRate: 20, // 20%
    };

    const result = PayrollEngine.calculatePaycheck(profile);

    // Expected Gross: 120,000 / 12 = 10,000.00 -> 1000000 cents
    expect(result.grossPay).toBe(1000000);
    
    // Expected Tax: 10,000 * 20% = 2,000.00 -> 200000 cents
    expect(result.taxDeduction).toBe(200000);
    
    // Expected Net: 8,000.00 -> 800000 cents
    expect(result.netPay).toBe(800000);
  });

  it('calculates bi-weekly paycheck correctly avoiding float precision errors', () => {
    const profile: PayrollProfile = {
      baseSalary: 7500000, // $75,000.00 in cents
      payFrequency: 'BIWEEKLY',
      taxRate: 15.5, // 15.5%
    };

    const result = PayrollEngine.calculatePaycheck(profile);

    // 7500000 / 26 = 288461.538... -> floored to 288461 cents ($2,884.61)
    expect(result.grossPay).toBe(288461);
    
    // 288461 * 0.155 = 44711.455 -> floored to 44711 cents ($447.11)
    expect(result.taxDeduction).toBe(44711);
    
    // 288461 - 44711 = 243750 cents ($2,437.50)
    expect(result.netPay).toBe(243750);
  });
});
