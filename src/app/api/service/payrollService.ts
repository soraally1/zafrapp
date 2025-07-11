import { firestore as db } from "@/lib/firebaseAdmin";
import { getAllUsers } from "./firebaseUserService";
import { getUserProfile } from "./userProfileService";

export const GOLD_PRICE_PER_GRAM = 1200000; // Example: 1,200,000 IDR/gram (update as needed or fetch from API)
export const NISAB_GRAM = 85;
export const NISAB = GOLD_PRICE_PER_GRAM * NISAB_GRAM;

export interface PayrollData {
  id?: string;
  userId: string;
  employeeName: string;
  position: string;
  basicSalary: number;
  allowances: {
    transport: number;
    meals: number;
    housing: number;
    other: number;
  };
  deductions: {
    bpjs: number;
    tax: number;
    loans: number;
    other: number;
  };
  zakat: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  month: string; // Format: "YYYY-MM"
  status: "Draft" | "Pending" | "Paid";
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
  zakatPaid: boolean;
}

// Calculate zakat (2.5% of eligible amount if above nisab)
const calculateZakat = (totalIncome: number) => {
  if (totalIncome >= NISAB) {
    return totalIncome * 0.025; // 2.5% zakat rate
  }
  return 0;
};

// Calculate total allowances
const calculateTotalAllowances = (allowances: PayrollData['allowances']) => {
  return Object.values(allowances).reduce((sum, value) => sum + value, 0);
};

// Calculate total deductions
const calculateTotalDeductions = (deductions: PayrollData['deductions']) => {
  return Object.values(deductions).reduce((sum, value) => sum + value, 0);
};

// Create or update user payroll data
export async function createOrUpdatePayroll(userId: string, payrollData: Partial<PayrollData>) {
  try {
    const now = new Date().toISOString();
    const payrollRef = db.collection("payrolls").doc(`${userId}_${payrollData.month}`);
    const payrollSnap = await payrollRef.get();

    // Calculate totals
    const totalAllowances = calculateTotalAllowances(payrollData.allowances || { transport: 0, meals: 0, housing: 0, other: 0 });
    const totalDeductions = calculateTotalDeductions(payrollData.deductions || { bpjs: 0, tax: 0, loans: 0, other: 0 });
    const totalIncome = (payrollData.basicSalary || 0) + totalAllowances;
    const zakat = calculateZakat(totalIncome);
    const netSalary = totalIncome - totalDeductions - zakat;

    let zakatPaid = payrollData.zakatPaid;
    if (payrollSnap.exists) {
      // Preserve zakatPaid if already set, unless explicitly set in update
      const existing = payrollSnap.data();
      if (existing && typeof zakatPaid !== 'boolean') {
        zakatPaid = typeof existing.zakatPaid === 'boolean' ? existing.zakatPaid : false;
      }
    } else {
      // On creation, default to false if not set
      if (typeof zakatPaid !== 'boolean') zakatPaid = false;
    }

    const updatedPayrollData = {
      ...payrollData,
      totalAllowances,
      totalDeductions,
      zakat,
      netSalary,
      zakatPaid,
      updatedAt: now,
    };

    if (!payrollSnap.exists) {
      // Create new payroll record
      await payrollRef.set({
        ...updatedPayrollData,
        status: "Draft",
        createdAt: now,
      });
    } else {
      // Update existing payroll record
      await payrollRef.update(updatedPayrollData);
    }

    return { success: true, data: { id: payrollRef.id, ...updatedPayrollData } };
  } catch (error) {
    console.error("Error creating/updating payroll:", error);
    return { success: false, error };
  }
}

// Get user payroll by month
export async function getUserPayroll(userId: string, month: string) {
  try {
    const payrollRef = db.collection("payrolls").doc(`${userId}_${month}`);
    const payrollSnap = await payrollRef.get();
    
    if (payrollSnap.exists) {
      return { success: true, data: { id: payrollSnap.id, ...payrollSnap.data() } as PayrollData };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("Error fetching user payroll:", error);
    return { success: false, error };
  }
}

// Get all payrolls for a specific month
export async function getMonthlyPayrolls(month: string) {
  try {
    const payrollsRef = db.collection("payrolls");
    const q = payrollsRef.where("month", "==", month);
    const querySnapshot = await q.get();
    
    const payrolls: PayrollData[] = [];
    querySnapshot.forEach((doc) => {
      payrolls.push({ id: doc.id, ...doc.data() } as PayrollData);
    });
    
    return { success: true, data: payrolls };
  } catch (error) {
    console.error("Error fetching monthly payrolls:", error);
    return { success: false, error };
  }
}

// Generate payroll for all users for a specific month
export async function generateMonthlyPayroll(month: string) {
  try {
    const users = await getAllUsers();
    const payrollsRef = db.collection("payrolls");
    const q = payrollsRef.where("month", "==", month);
    const querySnapshot = await q.get();
    const existingPayrollIds = new Set(querySnapshot.docs.map(doc => doc.id));

    // For each user, if payroll does not exist, create it from default profile data
    const createPromises = users.map(async (user) => {
      const payrollId = `${user.id}_${month}`;
      if (!existingPayrollIds.has(payrollId)) {
        const profile = await getUserProfile(user.id);
        if (profile && (profile as any).defaultBasicSalary) {
          const allowances = (profile as any).defaultAllowances || { transport: 0, meals: 0, housing: 0, other: 0 };
          const deductions = (profile as any).defaultDeductions || { bpjs: 0, tax: 0, loans: 0, other: 0 };
          const totalAllowances = calculateTotalAllowances(allowances);
          const totalDeductions = calculateTotalDeductions(deductions);
          const totalIncome = (profile as any).defaultBasicSalary + totalAllowances;
          const zakat = calculateZakat(totalIncome);
          const netSalary = totalIncome - totalDeductions - zakat;
          await db.collection("payrolls").doc(payrollId).set({
            userId: user.id,
            employeeName: profile.name || user.name,
            position: profile.role || user.role,
            basicSalary: (profile as any).defaultBasicSalary,
            allowances,
            deductions,
            totalAllowances,
            totalDeductions,
            zakat,
            netSalary,
            month,
            status: "Pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            zakatPaid: false, // Always set zakatPaid on creation
          });
        }
      }
    });
    await Promise.all(createPromises);

    // Update status to "Pending" for all payrolls for the month
    const updatePromises = querySnapshot.docs.map(docSnap =>
      db.collection("payrolls").doc(docSnap.id).update({
        status: "Pending",
        updatedAt: new Date().toISOString()
      })
    );
    await Promise.all(updatePromises);

    // Return all payrolls for the month
    const refreshed = await getMonthlyPayrolls(month);
    return { success: true, data: refreshed.data };
  } catch (error) {
    console.error("Error generating monthly payroll:", error);
    return { success: false, error };
  }
}

// Process payment for a specific payroll
export async function processPayrollPayment(payrollId: string) {
  try {
    const payrollRef = db.collection("payrolls").doc(payrollId);
    await payrollRef.update({
      status: "Paid",
      paymentDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error processing payroll payment:", error);
    return { success: false, error };
  }
}

/**
 * Get all users with their profile and payroll data for a given month.
 * Returns: [{ user, profile, payroll }]
 */
export async function getAllPayrollUsersWithProfile(month: string) {
  try {
    const users = await getAllUsers();
    const results = await Promise.all(
      users.map(async (user) => {
        const profile = await getUserProfile(user.id);
        const payrollRes = await getUserPayroll(user.id, month);
        return {
          user,
          profile,
          payroll: payrollRes.success ? payrollRes.data : null,
        };
      })
    );
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching payroll users with profile:", error);
    return { success: false, error };
  }
}

// Get all payrolls, with an optional limit
export async function getAllPayrolls(limit?: number) {
  try {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("payrolls").orderBy("createdAt", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const querySnapshot = await query.get();
    
    const payrolls: PayrollData[] = [];
    querySnapshot.forEach((doc) => {
      payrolls.push({ id: doc.id, ...doc.data() } as PayrollData);
    });
    
    return { success: true, data: payrolls };
  } catch (error) {
    console.error("Error fetching all payrolls:", error);
    return { success: false, data: [], error };
  }
}

// Mark zakat as paid for a payroll
export async function markZakatPaid(payrollId: string): Promise<boolean> {
  try {
    const payrollRef = db.collection("payrolls").doc(payrollId);
    await payrollRef.update({ zakatPaid: true });
    return true;
  } catch (error) {
    console.error("Error marking zakat as paid:", error);
    return false;
  }
} 