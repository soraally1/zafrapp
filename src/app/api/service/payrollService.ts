import { db } from "@/lib/firebaseApi";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { getAllUsers } from "./firebaseUserService";
import { getUserProfile } from "./userProfileService";

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
}

// Calculate zakat (2.5% of eligible amount if above nisab)
const calculateZakat = (totalIncome: number) => {
  const nisab = 5000000; // Example nisab value in IDR
  if (totalIncome >= nisab) {
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
    const payrollRef = doc(db, "payrolls", `${userId}_${payrollData.month}`);
    const payrollSnap = await getDoc(payrollRef);

    // Calculate totals
    const totalAllowances = calculateTotalAllowances(payrollData.allowances || { transport: 0, meals: 0, housing: 0, other: 0 });
    const totalDeductions = calculateTotalDeductions(payrollData.deductions || { bpjs: 0, tax: 0, loans: 0, other: 0 });
    const totalIncome = (payrollData.basicSalary || 0) + totalAllowances;
    const zakat = calculateZakat(totalIncome);
    const netSalary = totalIncome - totalDeductions - zakat;

    const updatedPayrollData = {
      ...payrollData,
      totalAllowances,
      totalDeductions,
      zakat,
      netSalary,
      updatedAt: now,
    };

    if (!payrollSnap.exists()) {
      // Create new payroll record
      await setDoc(payrollRef, {
        ...updatedPayrollData,
        status: "Draft",
        createdAt: now,
      });
    } else {
      // Update existing payroll record
      await updateDoc(payrollRef, updatedPayrollData);
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
    const payrollRef = doc(db, "payrolls", `${userId}_${month}`);
    const payrollSnap = await getDoc(payrollRef);
    
    if (payrollSnap.exists()) {
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
    const payrollsRef = collection(db, "payrolls");
    const q = query(payrollsRef, where("month", "==", month));
    const querySnapshot = await getDocs(q);
    
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
    const payrollsRef = collection(db, "payrolls");
    const q = query(payrollsRef, where("month", "==", month));
    const querySnapshot = await getDocs(q);
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
          await setDoc(doc(db, "payrolls", payrollId), {
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
          });
        }
      }
    });
    await Promise.all(createPromises);

    // Update status to "Pending" for all payrolls for the month
    const updatePromises = querySnapshot.docs.map(docSnap =>
      updateDoc(doc(db, "payrolls", docSnap.id), {
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
    const payrollRef = doc(db, "payrolls", payrollId);
    await updateDoc(payrollRef, {
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