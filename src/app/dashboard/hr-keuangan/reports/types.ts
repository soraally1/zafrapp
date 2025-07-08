import { Timestamp } from "firebase/firestore";

export interface Transaction {
  id: string;
  date: string;
  desc: string;
  category: string;
  amount: number;
  aiStatus?: 'Halal' | 'Haram' | 'Syubhat' | 'pending';
  aiExplanation?: string;
  createdAt?: Timestamp;
}

export interface LedgerEntry {
  account: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface BalanceEntry {
  account: string;
  amount: number;
}

export interface ProfitLossEntry {
  desc: string;
  amount: number;
}

export interface CashFlowEntry {
  desc: string;
  amount: number;
}

export interface ZisEntry {
  desc: string;
  amount: number;
}

export interface SummaryData {
  income: number;
  expenses: number;
  zis: number;
  net: number;
  cash: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
} 