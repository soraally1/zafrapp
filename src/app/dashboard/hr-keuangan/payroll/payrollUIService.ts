// Payroll UI Service: utilities for payroll page
import jsPDF from 'jspdf';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const nisab = 5000000;

export function getComplianceData(payrollUsers: any[]) {
  let totalZakat = 0, zakatCount = 0, shouldZakatCount = 0;
  const nonCompliant: { user: any; profile: any; payroll: any }[] = [];
  (payrollUsers || []).forEach(({ user, profile, payroll }: { user: any; profile: any; payroll: any }) => {
    if (!payroll) return;
    const totalIncome = (payroll.basicSalary || 0) + (payroll.totalAllowances || 0);
    const shouldPayZakat = totalIncome >= nisab;
    if (shouldPayZakat) shouldZakatCount++;
    if ((payroll.zakat || 0) > 0) {
      totalZakat += payroll.zakat;
      zakatCount++;
    } else if (shouldPayZakat) {
      nonCompliant.push({ user, profile, payroll });
    }
  });
  return {
    totalZakat,
    zakatCount,
    shouldZakatCount,
    nonCompliant,
    payrollUsers,
  };
}

export function downloadCompliancePDF(complianceData: any, selectedMonth: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Laporan Kepatuhan Syariah Penggajian', 10, 15);
  doc.setFontSize(12);
  doc.text(`Bulan: ${selectedMonth}`, 10, 25);
  doc.text(`Total Zakat: Rp${complianceData.totalZakat.toLocaleString('id-ID')}`, 10, 35);
  doc.text(`Karyawan Wajib Zakat: ${complianceData.shouldZakatCount}`, 10, 45);
  doc.text(`Karyawan Sudah Zakat: ${complianceData.zakatCount}`, 10, 55);
  doc.text('Karyawan Tidak Patuh:', 10, 65);
  let y = 75;
  complianceData.nonCompliant.forEach((item: { profile: any }, idx: number) => {
    doc.text(`${idx + 1}. ${item.profile?.name || '-'} (${item.profile?.role || '-'})`, 12, y);
    y += 8;
  });
  doc.save(`Laporan_Kepatuhan_Syariah_${selectedMonth}.pdf`);
} 