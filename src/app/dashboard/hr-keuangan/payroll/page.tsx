"use client";

import { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiCheckCircle, FiClock, FiEdit2, FiSend, FiAlertCircle, FiX, FiFileText } from 'react-icons/fi';
import { MdOutlineAttachMoney, MdOutlineCardGiftcard, MdOutlineRemoveCircleOutline, MdOutlineMosque, MdOutlineSavings } from 'react-icons/md';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import PayrollModal from '@/app/components/PayrollModal';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { usePayrollPageLogic } from './payrollLogic';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type DefaultPayroll = {
  defaultBasicSalary: number;
  defaultAllowances: { transport: number; meals: number; housing: number; other: number };
  defaultDeductions: { bpjs: number; tax: number; loans: number; other: number };
};

interface DefaultPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: DefaultPayroll) => Promise<void>;
  defaultPayroll: DefaultPayroll | null;
  employee: any;
}

function DefaultPayrollModal({ isOpen, onClose, onSave, defaultPayroll, employee }: DefaultPayrollModalProps) {
  const [form, setForm] = useState<DefaultPayroll>(defaultPayroll || {
    defaultBasicSalary: 0,
    defaultAllowances: { transport: 0, meals: 0, housing: 0, other: 0 },
    defaultDeductions: { bpjs: 0, tax: 0, loans: 0, other: 0 },
  });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setForm(defaultPayroll || {
      defaultBasicSalary: 0,
      defaultAllowances: { transport: 0, meals: 0, housing: 0, other: 0 },
      defaultDeductions: { bpjs: 0, tax: 0, loans: 0, other: 0 },
    });
  }, [defaultPayroll, employee]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Kelola Default Gaji</h2>
        <div className="mb-2 text-sm text-gray-600 font-semibold">{employee?.profile?.name || employee?.user?.name}</div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          await onSave(form);
          setLoading(false);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gaji Pokok</label>
            <input type="number" min={0} className="w-full px-3 py-2 border rounded-xl" value={form.defaultBasicSalary} onChange={e => setForm((f) => ({ ...f, defaultBasicSalary: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tunjangan</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} placeholder="Transport" className="px-2 py-1 border rounded" value={form.defaultAllowances.transport} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, transport: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Makan" className="px-2 py-1 border rounded" value={form.defaultAllowances.meals} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, meals: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Tempat Tinggal" className="px-2 py-1 border rounded" value={form.defaultAllowances.housing} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, housing: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Lainnya" className="px-2 py-1 border rounded" value={form.defaultAllowances.other} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, other: Number(e.target.value) } }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Potongan</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} placeholder="BPJS" className="px-2 py-1 border rounded" value={form.defaultDeductions.bpjs} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, bpjs: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Pajak" className="px-2 py-1 border rounded" value={form.defaultDeductions.tax} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, tax: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Pinjaman" className="px-2 py-1 border rounded" value={form.defaultDeductions.loans} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, loans: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Lainnya" className="px-2 py-1 border rounded" value={form.defaultDeductions.other} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, other: Number(e.target.value) } }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 border rounded-xl" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="px-4 py-2 bg-[#00C570] text-white rounded-xl" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const logic = usePayrollPageLogic();
  const {
    selectedMonth, setSelectedMonth,
    payrollUsers, loading, error,
    isModalOpen, setIsModalOpen,
    selectedEmployee, 
    selectedPayroll,
    isDefaultModalOpen, setIsDefaultModalOpen,
    defaultPayrollEmployee, 
    defaultPayrollData, 
    showComplianceModal, setShowComplianceModal,
    complianceData, 
    toast,
    handleCreatePayroll,
    handleEditPayroll,
    handleSavePayroll,
    handleGenerateMonthlyPayroll,
    handleProcessPayment,
    handleOpenDefaultPayroll,
    handleOpenComplianceModal,
    handleDownloadCompliancePDF,
    summary,
    formatCurrency,
    userProfile,
  } = logic;

  // Use real user data for Topbar
  const userData = userProfile
    ? {
        name: userProfile.name || 'User',
        role: userProfile.role || '',
        photo: userProfile.photo || undefined,
      }
    : { name: '', role: '', photo: undefined };

  // Chart Data and Options
  const chartData = {
    labels: [
      "Gaji Pokok",
      "Tunjangan",
      "Potongan",
      "Zakat",
      "Gaji Bersih"
    ],
    datasets: [
      {
        label: "Statistik Gaji Bulan Ini",
        data: [
          summary.gaji,
          summary.tunjangan,
          summary.potongan,
          summary.zakat,
          summary.bersih
        ],
        backgroundColor: [
          "#3B82F6",
          "#22C55E",
          "#EF4444",
          "#A78BFA",
          "#00C570"
        ],
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 13 } },
      },
      y: {
        grid: { color: "#F3F4F6" },
        ticks: {
          font: { size: 13 },
          callback: (tickValue: string | number) => formatCurrency(Number(tickValue)),
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <Sidebar active="Payroll" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar
          userName={userData.name}
          userRole={userData.role}
          userPhoto={userData.photo}
          loading={false}
        />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Penggajian Syariah</h1>
              <p className="text-gray-600">Kelola gaji, tunjangan, potongan, dan zakat karyawan secara sederhana dan transparan.</p>
            </div>
            <button
              onClick={handleOpenComplianceModal}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition font-semibold"
            >
              <FiFileText /> Laporan Kepatuhan Syariah
            </button>
          </div>

          {/* Chart + Controls Row */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Chart Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex-1 min-w-0 flex flex-col justify-between">
              <h2 className="text-base font-semibold text-gray-700 mb-2">Statistik Gaji Bulan Ini</h2>
              <Bar data={chartData} options={chartOptions} height={220} />
            </div>
            {/* Controls Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col justify-center md:w-96 w-full min-w-[220px]">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Bulan</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C570] bg-white w-full"
                />
              </div>
              <button
                onClick={handleGenerateMonthlyPayroll}
                className="bg-[#00C570] text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-all flex items-center gap-2 font-semibold shadow-sm w-full"
                disabled={loading}
              >
                <FiDownload />
                Proses Gaji Bulanan
              </button>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm">
              <MdOutlineAttachMoney className="text-2xl text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Gaji Pokok</span>
              <span className="font-bold text-lg text-gray-800">{formatCurrency(summary.gaji)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm">
              <MdOutlineCardGiftcard className="text-2xl text-green-500 mb-1" />
              <span className="text-xs text-gray-500">Tunjangan</span>
              <span className="font-bold text-lg text-gray-800">{formatCurrency(summary.tunjangan)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm">
              <MdOutlineRemoveCircleOutline className="text-2xl text-red-500 mb-1" />
              <span className="text-xs text-gray-500">Potongan</span>
              <span className="font-bold text-lg text-gray-800">{formatCurrency(summary.potongan)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm">
              <MdOutlineMosque className="text-2xl text-purple-500 mb-1" />
              <span className="text-xs text-gray-500">Zakat</span>
              <span className="font-bold text-lg text-gray-800">{formatCurrency(summary.zakat)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm">
              <MdOutlineSavings className="text-2xl text-[#00C570] mb-1" />
              <span className="text-xs text-gray-500">Gaji Bersih</span>
              <span className="font-bold text-lg text-[#00C570]">{formatCurrency(summary.bersih)}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-medium">Karyawan</th>
                  <th className="px-4 py-3 text-left font-medium">Jabatan</th>
                  <th className="px-4 py-3 text-right font-medium">Gaji</th>
                  <th className="px-4 py-3 text-right font-medium">Tunjangan</th>
                  <th className="px-4 py-3 text-right font-medium">Potongan</th>
                  <th className="px-4 py-3 text-right font-medium">Zakat</th>
                  <th className="px-4 py-3 text-right font-medium">Bersih</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(payrollUsers || []).map((item) => {
                  const { user, profile, payroll } = item;
                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">{profile?.name || user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{profile?.role || user.role}</td>
                      <td className="px-4 py-3 text-right">{payroll ? formatCurrency(payroll.basicSalary) : "-"}</td>
                      <td className="px-4 py-3 text-right">{payroll ? formatCurrency(payroll.totalAllowances) : "-"}</td>
                      <td className="px-4 py-3 text-right">{payroll ? formatCurrency(payroll.totalDeductions) : "-"}</td>
                      <td className="px-4 py-3 text-right">{payroll ? formatCurrency(payroll.zakat) : "-"}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#00C570]">{payroll ? formatCurrency(payroll.netSalary) : "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {payroll ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                              ${payroll.status === "Paid"
                                ? "bg-green-50 text-green-600"
                                : payroll.status === "Pending"
                                ? "bg-yellow-50 text-yellow-600"
                                : "bg-gray-50 text-gray-500"}
                            `}
                          >
                            {payroll.status === "Paid" && <FiCheckCircle className="text-green-500" title="Dibayar" />}
                            {payroll.status === "Pending" && <FiClock className="text-yellow-500" title="Menunggu" />}
                            {payroll.status === "Paid"
                              ? "Dibayar"
                              : payroll.status === "Pending"
                              ? "Menunggu"
                              : "Draft"}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {payroll ? (
                            <>
                              <button
                                onClick={() => handleEditPayroll(payroll, item)}
                                className="p-2 rounded-full hover:bg-blue-50 text-blue-600"
                                title="Edit Data Gaji"
                              >
                                <FiEdit2 />
                              </button>
                              {payroll.status === "Pending" && (
                                <button
                                  onClick={() => handleProcessPayment(payroll.id!)}
                                  className="p-2 rounded-full hover:bg-green-50 text-green-600"
                                  title="Proses Pembayaran"
                                >
                                  <FiSend />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleCreatePayroll(item)}
                              className="p-2 rounded-full hover:bg-[#E6FFF4] text-[#00C570]"
                              title="Tambah Data Gaji"
                            >
                              <FiPlus />
                            </button>
                          )}
                          <button onClick={() => handleOpenDefaultPayroll(item)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Kelola Default Gaji">
                            <FiEdit2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PayrollModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSavePayroll}
            payrollData={selectedPayroll?.payroll || undefined}
            employeeData={selectedEmployee?.profile ? {
              id: selectedEmployee.user.id,
              name: selectedEmployee.profile.name,
              position: selectedEmployee.profile.role
            } : {
              id: selectedEmployee?.user?.id,
              name: selectedEmployee?.user?.name,
              position: selectedEmployee?.user?.role
            }}
          />

          <PayrollModal
            isOpen={isDefaultModalOpen}
            onClose={() => setIsDefaultModalOpen(false)}
            mode="default"
            defaultData={defaultPayrollData}
            employeeData={defaultPayrollEmployee?.profile ? {
              id: defaultPayrollEmployee.user.id,
              name: defaultPayrollEmployee.profile.name,
              position: defaultPayrollEmployee.profile.role
            } : {
              id: defaultPayrollEmployee?.user?.id,
              name: defaultPayrollEmployee?.user?.name,
              position: defaultPayrollEmployee?.user?.role
            }}
          />

          {/* Compliance Modal */}
          {showComplianceModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowComplianceModal(false)}><FiX size={22} /></button>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><FiFileText className="text-purple-600" /> Laporan Kepatuhan Syariah</h2>
                <div className="mb-2 text-gray-600">Bulan: <b>{selectedMonth}</b></div>
                <div className="mb-4">
                  <div>Total Zakat: <b className="text-green-700">{formatCurrency(complianceData?.totalZakat || 0)}</b></div>
                  <div>Karyawan Wajib Zakat: <b>{complianceData?.shouldZakatCount || 0}</b></div>
                  <div>Karyawan Sudah Zakat: <b>{complianceData?.zakatCount || 0}</b></div>
                </div>
                <div className="mb-4">
                  <div className="font-semibold mb-1">Karyawan Tidak Patuh Zakat:</div>
                  {complianceData?.nonCompliant?.length === 0 ? (
                    <div className="text-green-600 flex items-center gap-1"><FiCheckCircle /> Semua karyawan patuh zakat</div>
                  ) : (
                    <ul className="list-disc pl-5">
                      {complianceData?.nonCompliant.map((item: { profile: any }, idx: number) => (
                        <li key={idx} className="text-red-600">{item.profile?.name || '-'} ({item.profile?.role || '-'})</li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={handleDownloadCompliancePDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition font-semibold"
                >
                  <FiDownload /> Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toast && (
            <div className={`fixed top-6 right-6 z-[100] px-4 py-2 rounded-xl shadow-lg text-white font-semibold flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {toast.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />} {toast.message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
