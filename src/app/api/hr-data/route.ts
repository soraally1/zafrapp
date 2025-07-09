import { NextRequest } from 'next/server';
import { getAllPayrolls, getMonthlyPayrolls, getAllPayrollUsersWithProfile } from '../service/payrollService';
import { getAllTransactions } from '../service/firebaseTransactionService';
import { getAllUserProfiles } from '../service/userProfileService';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const payrollResult = await getAllPayrolls();
    const monthlyPayrollsResult = await getMonthlyPayrolls(currentMonth);
    const payrollUsersWithProfileResult = await getAllPayrollUsersWithProfile(currentMonth);
    const transactions = await getAllTransactions();
    const profiles = await getAllUserProfiles();
    return new Response(
      JSON.stringify({
        payrolls: payrollResult.success ? payrollResult.data : [],
        monthlyPayrolls: monthlyPayrollsResult.success ? monthlyPayrollsResult.data : [],
        payrollUsersWithProfile: payrollUsersWithProfileResult.success ? payrollUsersWithProfileResult.data : [],
        transactions,
        profiles,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch HR data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 