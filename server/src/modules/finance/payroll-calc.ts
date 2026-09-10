import Decimal from 'decimal.js';

export interface PayrollProfile {
  baseSalary: number; // yearly base in cents
  payFrequency: 'MONTHLY' | 'BIWEEKLY' | 'SEMIMONTHLY' | string;
  taxRate: number; // percentage, e.g., 20 for 20%
}

export interface PayrollResult {
  grossPay: number;
  taxDeduction: number;
  netPay: number;
}

export class PayrollEngine {
  /**
   * Calculates the paycheck amounts for a single pay period.
   * All amounts are returned in cents to prevent float rounding errors.
   */
  static calculatePaycheck(profile: PayrollProfile): PayrollResult {
    const salary = new Decimal(profile.baseSalary);
    
    // Determine pay periods per year
    const freq = String(profile.payFrequency || 'MONTHLY').trim().toUpperCase();
    let periods = 12;
    if (freq === 'BIWEEKLY' || freq === 'BI_WEEKLY') {
      periods = 26;
    } else if (freq === 'SEMIMONTHLY' || freq === 'SEMI_MONTHLY') {
      periods = 24;
    } else {
      periods = 12;
    }
    
    // Gross pay per period
    const grossPay = salary.dividedBy(periods).floor();
    
    // Calculate tax based on percentage (e.g. 20% -> 0.20)
    const taxRate = new Decimal(profile.taxRate).dividedBy(100);
    const taxDeduction = grossPay.times(taxRate).floor();
    
    // Net pay
    const netPay = grossPay.minus(taxDeduction);

    return {
      grossPay: grossPay.toNumber(),
      taxDeduction: taxDeduction.toNumber(),
      netPay: netPay.toNumber(),
    };
  }
}
