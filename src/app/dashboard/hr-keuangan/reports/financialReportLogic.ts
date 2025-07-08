import { Timestamp } from "firebase/firestore";

// Define types inline to avoid import issues
interface Transaction {
  id: string;
  date: string;
  desc: string;
  category: string;
  amount: number;
  aiStatus?: 'Halal' | 'Haram' | 'Syubhat' | 'pending';
  aiExplanation?: string;
  createdAt?: Timestamp;
}

interface LedgerEntry {
  account: string;
  debit: number;
  credit: number;
  balance: number;
}

interface BalanceEntry {
  account: string;
  amount: number;
}

interface ProfitLossEntry {
  desc: string;
  amount: number;
}

interface CashFlowEntry {
  desc: string;
  amount: number;
}

interface ZisEntry {
  desc: string;
  amount: number;
}

interface SummaryData {
  income: number;
  expenses: number;
  zis: number;
  net: number;
  cash: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
}

// Financial report calculation functions
export const calculateLedgerData = (transactions: Transaction[]): LedgerEntry[] => {
  const accountMap: { [key: string]: { debit: number; credit: number; balance: number } } = {};
  
  transactions.forEach(tx => {
    const amount = tx.amount || 0;
    const category = tx.category;
    
    if (!accountMap[category]) {
      accountMap[category] = { debit: 0, credit: 0, balance: 0 };
    }
    
    // Determine if it's debit or credit based on category
    if (category.includes('Pendapatan') || category === 'ZIS') {
      accountMap[category].credit += amount;
      accountMap[category].balance += amount;
    } else {
      accountMap[category].debit += amount;
      accountMap[category].balance -= amount;
    }
  });
  
  return Object.entries(accountMap).map(([account, data]) => ({
    account,
    debit: data.debit,
    credit: data.credit,
    balance: data.balance
  }));
};

export const calculateBalanceData = (transactions: Transaction[]): BalanceEntry[] => {
  const assets: { [key: string]: number } = {};
  const liabilities: { [key: string]: number } = {};
  const equity: { [key: string]: number } = {};
  
  transactions.forEach(tx => {
    const amount = tx.amount || 0;
    const category = tx.category;
    
    if (category === 'Aset Tetap') {
      assets[category] = (assets[category] || 0) + amount;
    } else if (category.includes('Pendapatan')) {
      equity[category] = (equity[category] || 0) + amount;
    } else if (category.startsWith('Beban')) {
      equity[category] = (equity[category] || 0) - amount;
    }
  });
  
  // Calculate cash balance
  const totalIncome = transactions
    .filter(tx => tx.category.includes('Pendapatan'))
    .reduce((sum: number, tx) => sum + (tx.amount || 0), 0);
  
  const totalExpenses = transactions
    .filter(tx => tx.category.startsWith('Beban'))
    .reduce((sum: number, tx) => sum + (tx.amount || 0), 0);
  
  assets['Kas'] = totalIncome - totalExpenses;
  
  // Calculate total equity
  const totalEquity = Object.values(equity).reduce((sum: number, amount: number) => sum + amount, 0);
  equity['Modal'] = totalEquity;
  
  const result: BalanceEntry[] = [
    ...Object.entries(assets).map(([account, amount]) => ({ account, amount })),
    ...Object.entries(liabilities).map(([account, amount]) => ({ account, amount })),
    ...Object.entries(equity).filter(([account]) => account !== 'Modal').map(([account, amount]) => ({ account, amount })),
    ...Object.entries(equity).filter(([account]) => account === 'Modal').map(([account, amount]) => ({ account, amount }))
  ];
  
  return result;
};

export const calculateProfitLossData = (transactions: Transaction[]): ProfitLossEntry[] => {
  const incomeCategories = transactions
    .filter(tx => tx.category.includes('Pendapatan'))
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + (tx.amount || 0);
      return acc;
    }, {} as { [key: string]: number });
  
  const expenseCategories = transactions
    .filter(tx => tx.category.startsWith('Beban'))
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + (tx.amount || 0);
      return acc;
    }, {} as { [key: string]: number });
  
  const totalIncome = Object.values(incomeCategories).reduce((sum: number, amount: number) => sum + amount, 0);
  const totalExpenses = Object.values(expenseCategories).reduce((sum: number, amount: number) => sum + amount, 0);
  const netIncome = totalIncome - totalExpenses;
  
  const result: ProfitLossEntry[] = [
    ...Object.entries(incomeCategories).map(([desc, amount]) => ({ desc, amount })),
    ...Object.entries(expenseCategories).map(([desc, amount]) => ({ desc, amount: -amount })),
    { desc: "Laba Bersih", amount: netIncome }
  ];
  
  return result;
};

export const calculateCashFlowData = (transactions: Transaction[]): CashFlowEntry[] => {
  const operatingIncome = transactions
    .filter(tx => tx.category.includes('Pendapatan'))
    .reduce((sum: number, tx) => sum + (tx.amount || 0), 0);
  
  const operatingExpenses = transactions
    .filter(tx => tx.category.startsWith('Beban'))
    .reduce((sum: number, tx) => sum + (tx.amount || 0), 0);
  
  const netOperatingCash = operatingIncome - operatingExpenses;
  
  // Assume initial cash balance
  const initialCash = 5000000;
  const finalCash = initialCash + netOperatingCash;
  
  const result: CashFlowEntry[] = [
    { desc: "Saldo Awal", amount: initialCash },
    { desc: "Penerimaan Kas Operasional", amount: operatingIncome },
    { desc: "Pengeluaran Kas Operasional", amount: -operatingExpenses },
    { desc: "Saldo Akhir", amount: finalCash }
  ];
  
  return result;
};

export const calculateZisData = (transactions: Transaction[]): ZisEntry[] => {
  const zisTransactions = transactions.filter(tx => tx.category === 'ZIS');
  
  if (zisTransactions.length === 0) {
    return [];
  }
  
  const zisIncome = zisTransactions
    .filter(tx => tx.amount > 0)
    .reduce((sum: number, tx) => sum + (tx.amount || 0), 0);
  
  const zisExpenses = zisTransactions
    .filter(tx => tx.amount < 0)
    .reduce((sum: number, tx) => sum + Math.abs(tx.amount || 0), 0);
  
  const zisBalance = zisIncome - zisExpenses;
  
  const result: ZisEntry[] = [
    { desc: "Penerimaan ZIS", amount: zisIncome },
    { desc: "Distribusi ZIS", amount: -zisExpenses },
    { desc: "Saldo ZIS", amount: zisBalance }
  ];
  
  return result;
};

export const calculateSummary = (transactions: Transaction[]): SummaryData => {
  const result = transactions.reduce((acc, tx) => {
    const amount = tx.amount || 0;
    if (tx.category === "Pendapatan" || tx.category === "Pendapatan Lain") {
      acc.income += amount;
    } else if (tx.category.startsWith("Beban")) {
      acc.expenses += Math.abs(amount);
    } else if (tx.category === "ZIS") {
      acc.zis += amount;
    }
    return acc;
  }, { income: 0, expenses: 0, zis: 0 });

  const net = result.income - result.expenses;
  const cash = result.income - result.expenses; // Simplified cash calculation

  return { ...result, net, cash };
};

export const calculateChartData = (transactions: Transaction[]): ChartData => {
  const monthMap: { [month: string]: { income: number; expense: number } } = {};
  transactions.forEach((tx) => {
    const month = tx.date.slice(0, 7); // YYYY-MM
    if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
    const amount = tx.amount || 0;
    if (tx.category.includes("Pendapatan")) {
      monthMap[month].income += amount;
    } else if (tx.category.startsWith("Beban")) {
      monthMap[month].expense += Math.abs(amount);
    }
  });
  const months = Object.keys(monthMap).sort();
  return {
    labels: months,
    datasets: [
      {
        label: "Pendapatan",
        data: months.map((m) => monthMap[m].income),
        backgroundColor: "#00C570",
      },
      {
        label: "Pengeluaran",
        data: months.map((m) => monthMap[m].expense),
        backgroundColor: "#EF4444",
      },
    ],
  };
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Export the Transaction type for use in other files
export type { Transaction }; 