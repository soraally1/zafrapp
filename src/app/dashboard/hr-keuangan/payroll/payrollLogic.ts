import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getAllPayrollUsersWithProfile, generateMonthlyPayroll, processPayrollPayment } from '@/app/api/service/payrollService';
import { createOrUpdateProfile, getUserProfile } from '@/app/api/service/userProfileService';
import { formatCurrency, getComplianceData, downloadCompliancePDF } from './payrollUIService';
import { auth } from '@/lib/firebaseApi';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export function usePayrollPageLogic() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollUsers, setPayrollUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);
  const [isDefaultModalOpen, setIsDefaultModalOpen] = useState(false);
  const [defaultPayrollEmployee, setDefaultPayrollEmployee] = useState<any | null>(null);
  const [defaultPayrollData, setDefaultPayrollData] = useState<any | null>(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchPayrollUsers();
    // Listen for auth state changes and fetch user profile
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, [selectedMonth]);

  const fetchPayrollUsers = async () => {
    try {
      setLoading(true);
      const result = await getAllPayrollUsersWithProfile(selectedMonth);
      if (result.success) {
        setPayrollUsers(result.data || []);
      } else {
        setError('Gagal mengambil data penggajian');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data penggajian');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = (employee: any) => {
    setSelectedEmployee(employee);
    setSelectedPayroll(null);
    setIsModalOpen(true);
  };

  const handleEditPayroll = (payroll: any, employee: any) => {
    setSelectedPayroll(payroll);
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSavePayroll = async (data: Partial<any>) => {
    try {
      const userId = selectedEmployee?.user?.id || selectedPayroll?.user?.id;
      if (!userId) throw new Error('Tidak ada karyawan yang dipilih');
      const payrollData = {
        ...data,
        userId,
        employeeName: selectedEmployee?.profile?.name || selectedEmployee?.user?.name,
        position: selectedEmployee?.profile?.role || selectedEmployee?.user?.role,
        month: selectedMonth,
      };
      const { createOrUpdatePayroll } = await import('@/app/api/service/payrollService');
      const result = await createOrUpdatePayroll(userId, payrollData);
      if (result.success) {
        await fetchPayrollUsers();
      } else {
        throw new Error('Gagal menyimpan data penggajian');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data penggajian');
      throw err;
    }
  };

  const handleGenerateMonthlyPayroll = async () => {
    try {
      setLoading(true);
      const result = await generateMonthlyPayroll(selectedMonth);
      if (result.success) {
        await fetchPayrollUsers();
        showToast('success', 'Gaji bulanan berhasil diproses!');
      } else {
        setError('Gagal menghasilkan penggajian bulanan');
        showToast('error', 'Gagal menghasilkan penggajian bulanan');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghasilkan penggajian bulanan');
      showToast('error', 'Terjadi kesalahan saat menghasilkan penggajian bulanan');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (payrollId: string) => {
    try {
      const result = await processPayrollPayment(payrollId);
      if (result.success) {
        await fetchPayrollUsers();
        showToast('success', 'Pembayaran berhasil diproses!');
      } else {
        setError('Gagal memproses pembayaran');
        showToast('error', 'Gagal memproses pembayaran');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memproses pembayaran');
      showToast('error', 'Terjadi kesalahan saat memproses pembayaran');
    }
  };

  const handleOpenDefaultPayroll = async (employee: any) => {
    setDefaultPayrollEmployee(employee);
    // Fetch latest profile
    const profile = await getUserProfile(employee.user.id);
    setDefaultPayrollData(profile ? {
      defaultBasicSalary: (profile as any).defaultBasicSalary || 0,
      defaultAllowances: (profile as any).defaultAllowances || { transport: 0, meals: 0, housing: 0, other: 0 },
      defaultDeductions: (profile as any).defaultDeductions || { bpjs: 0, tax: 0, loans: 0, other: 0 },
    } : null);
    setIsDefaultModalOpen(true);
  };

  const handleSaveDefaultPayroll = async (form: any) => {
    if (!defaultPayrollEmployee) return;
    await createOrUpdateProfile(defaultPayrollEmployee.user.id, form);
    setIsDefaultModalOpen(false);
    await fetchPayrollUsers();
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenComplianceModal = () => {
    setComplianceData(getComplianceData(payrollUsers));
    setShowComplianceModal(true);
  };

  const handleDownloadCompliancePDF = () => {
    downloadCompliancePDF(complianceData, selectedMonth);
  };

  // Summary calculation
  const summary = (payrollUsers || []).reduce(
    (acc, curr) => {
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

  return {
    selectedMonth, setSelectedMonth,
    payrollUsers, loading, error,
    isModalOpen, setIsModalOpen,
    selectedEmployee, setSelectedEmployee,
    selectedPayroll, setSelectedPayroll,
    isDefaultModalOpen, setIsDefaultModalOpen,
    defaultPayrollEmployee, setDefaultPayrollEmployee,
    defaultPayrollData, setDefaultPayrollData,
    showComplianceModal, setShowComplianceModal,
    complianceData, setComplianceData,
    toast, setToast,
    handleCreatePayroll,
    handleEditPayroll,
    handleSavePayroll,
    handleGenerateMonthlyPayroll,
    handleProcessPayment,
    handleOpenDefaultPayroll,
    handleSaveDefaultPayroll,
    showToast,
    handleOpenComplianceModal,
    handleDownloadCompliancePDF,
    summary,
    formatCurrency,
    user,
    userProfile,
  };
} 