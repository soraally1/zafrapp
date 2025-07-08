// Logic layer for HR dashboard

export function aggregateSummary(payrolls: any[]) {
  // Example: aggregate payrolls to summary
  let totalIncome = 0;
  let totalExpense = 0;
  let totalZIS = 0;
  let cash = 0;
  payrolls.forEach((p: any) => {
    totalIncome += p.income || 0;
    totalExpense += p.expense || 0;
    totalZIS += p.zis || 0;
    cash += p.cash || 0;
  });
  return {
    income: totalIncome,
    expenses: totalExpense,
    zis: totalZIS,
    cash,
    net: totalIncome - totalExpense
  };
}

export function formatStats(stats: any[]) {
  // Example: format stats for display
  return stats.map((s: any) => ({
    label: s.label,
    value: s.value
  }));
}

// Aggregates payrollUsers to summary (for dashboard)
export function aggregatePayrollSummary(payrollUsers: any[]): {
  gaji: number;
  tunjangan: number;
  potongan: number;
  zakat: number;
  bersih: number;
} {
  return (payrollUsers || []).reduce(
    (acc: any, curr: any) => {
      const p = curr.payroll || {};
      acc.gaji += p.basicSalary || 0;
      acc.tunjangan += p.totalAllowances || 0;
      acc.potongan += p.totalDeductions || 0;
      acc.zakat += p.zakat || 0;
      acc.bersih += p.netSalary || 0;
      return acc;
    },
    { gaji: 0, tunjangan: 0, potongan: 0, zakat: 0, bersih: 0 }
  );
}

// Counts processed salary slips
export function countProcessedSlips(payrollUsers: any[]): number {
  return (payrollUsers || []).filter((u: any) => u.payroll).length;
}

// Add more logic functions as needed 