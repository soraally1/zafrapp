"use client";

import { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiCheckCircle, FiClock, FiEdit2, FiSend, FiAlertCircle, FiX, FiFileText, FiStar, FiHeart, FiTrendingUp } from 'react-icons/fi';
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
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

// Islamic quotes and Quranic verses for payroll
const ISLAMIC_QUOTES = [
  {
    quote: "وَآتُوا الْحَقَّ مِنْ أَمْوَالِكُمْ",
    translation: "Dan berikanlah hak-hak yang telah ditentukan kepada yang berhak",
    source: "QS. Al-Baqarah: 267"
  },
  {
    quote: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ",
    translation: "Sesungguhnya Allah menyuruh (kamu) berlaku adil dan berbuat kebajikan",
    source: "QS. An-Nahl: 90"
  },
  {
    quote: "وَلَا تَبْخَسُوا النَّاسَ أَشْيَاءَهُمْ",
    translation: "Dan janganlah kamu merugikan manusia pada hak-haknya",
    source: "QS. Hud: 85"
  }
];

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
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto border border-emerald-100">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span className="text-emerald-600">⚙️</span>
            Kelola Default Gaji
          </h2>
          <div className="text-sm text-gray-600 font-semibold">{employee?.profile?.name || employee?.user?.name}</div>
          <p className="text-xs text-gray-500 mt-1">"Dan berikanlah hak-hak yang telah ditentukan kepada yang berhak" - QS. Al-Baqarah: 267</p>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          await onSave(form);
          setLoading(false);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>💰</span>
              Gaji Pokok
            </label>
            <input type="number" min={0} className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultBasicSalary} onChange={e => setForm((f) => ({ ...f, defaultBasicSalary: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>🎁</span>
              Tunjangan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min={0} placeholder="Transport" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultAllowances.transport} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, transport: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Makan" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultAllowances.meals} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, meals: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Tempat Tinggal" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultAllowances.housing} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, housing: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Lainnya" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultAllowances.other} onChange={e => setForm((f) => ({ ...f, defaultAllowances: { ...f.defaultAllowances, other: Number(e.target.value) } }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span>📉</span>
              Potongan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min={0} placeholder="BPJS" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultDeductions.bpjs} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, bpjs: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Pajak" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultDeductions.tax} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, tax: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Pinjaman" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultDeductions.loans} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, loans: Number(e.target.value) } }))} />
              <input type="number" min={0} placeholder="Lainnya" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.defaultDeductions.other} onChange={e => setForm((f) => ({ ...f, defaultDeductions: { ...f.defaultDeductions, other: Number(e.target.value) } }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-semibold" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  // Always call usePayrollPageLogic at the top, before any return
  const logic = usePayrollPageLogic();
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        // No need to fetch profile here, handled in usePayrollPageLogic
        // Just check if user is authenticated
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);
  if (loadingUser) {
    return <div className="flex items-center justify-center min-h-screen bg-[#F6F8FA]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C570]"></div></div>;
  }
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex">
      <Sidebar active="Payroll" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar
          userName={userData.name}
          userRole={userData.role}
          userPhoto={userData.photo}
          loading={false}
        />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Islamic Quote Banner */}
          <div className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <FiStar className="text-yellow-300 text-xl" />
              <h2 className="text-lg font-semibold">Bismillahirrahmanirrahim</h2>
            </div>
            <div className="mb-2 text-right font-arabic text-2xl leading-relaxed">
              {ISLAMIC_QUOTES[0].quote}
            </div>
            <div className="text-sm opacity-90 mb-1">
              {ISLAMIC_QUOTES[0].translation}
            </div>
            <div className="text-xs opacity-75 font-medium">
              {ISLAMIC_QUOTES[0].source}
            </div>
          </div>

          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-emerald-600">💰</span>
                Penggajian Syariah
              </h1>
              <p className="text-gray-600">Kelola gaji, tunjangan, potongan, dan zakat karyawan secara adil dan transparan sesuai prinsip syariah.</p>
            </div>
            <button
              onClick={handleOpenComplianceModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition font-semibold"
            >
              <FiFileText /> Laporan Kepatuhan Syariah
            </button>
          </div>

          {/* Chart + Controls Row */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Chart Card */}
            <div className="bg-white rounded-xl shadow-md p-6 flex-1 min-w-0 flex flex-col justify-between border border-emerald-100">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <FiTrendingUp className="text-emerald-600" />
                  Statistik Gaji Bulan Ini
                </h2>
                <p className="text-sm text-gray-500">"Sesungguhnya Allah menyuruh (kamu) berlaku adil dan berbuat kebajikan" - QS. An-Nahl: 90</p>
              </div>
              <Bar data={chartData} options={chartOptions} height={220} />
            </div>
            {/* Controls Card */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-center md:w-96 w-full min-w-[220px] border border-emerald-100">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <span>📅</span>
                  Pilih Bulan
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white w-full"
                />
              </div>
              <button
                onClick={handleGenerateMonthlyPayroll}
                className="bg-emerald-600 text-white px-4 py-3 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 font-semibold shadow-sm w-full"
                disabled={loading}
              >
                <FiDownload />
                Proses Gaji Bulanan
              </button>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            <div className="flex flex-col items-center bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl py-6 shadow-md border border-blue-200 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-blue-200 text-lg">💰</div>
              <MdOutlineAttachMoney className="text-3xl text-blue-600 mb-2" />
              <span className="text-xs text-gray-600 font-medium">Gaji Pokok</span>
              <span className="font-bold text-lg text-blue-700">{formatCurrency(summary.gaji)}</span>
            </div>
            <div className="flex flex-col items-center bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl py-6 shadow-md border border-emerald-200 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-emerald-200 text-lg">🎁</div>
              <MdOutlineCardGiftcard className="text-3xl text-emerald-600 mb-2" />
              <span className="text-xs text-gray-600 font-medium">Tunjangan</span>
              <span className="font-bold text-lg text-emerald-700">{formatCurrency(summary.tunjangan)}</span>
            </div>
            <div className="flex flex-col items-center bg-gradient-to-br from-red-100 to-red-50 rounded-xl py-6 shadow-md border border-red-200 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-red-200 text-lg">📉</div>
              <MdOutlineRemoveCircleOutline className="text-3xl text-red-600 mb-2" />
              <span className="text-xs text-gray-600 font-medium">Potongan</span>
              <span className="font-bold text-lg text-red-700">{formatCurrency(summary.potongan)}</span>
            </div>
            <div className="flex flex-col items-center bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl py-6 shadow-md border border-purple-200 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-purple-200 text-lg">☪</div>
              <MdOutlineMosque className="text-3xl text-purple-600 mb-2" />
              <span className="text-xs text-gray-600 font-medium">Zakat</span>
              <span className="font-bold text-lg text-purple-700">{formatCurrency(summary.zakat)}</span>
            </div>
            <div className="flex flex-col items-center bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl py-6 shadow-md border border-teal-200 hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-teal-200 text-lg">✅</div>
              <MdOutlineSavings className="text-3xl text-teal-600 mb-2" />
              <span className="text-xs text-gray-600 font-medium">Gaji Bersih</span>
              <span className="font-bold text-lg text-teal-700">{formatCurrency(summary.bersih)}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md overflow-x-auto border border-emerald-100">
            <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-emerald-600">👥</span>
                Daftar Penggajian Karyawan
              </h3>
              <p className="text-sm text-gray-600 mt-1">"Dan janganlah kamu merugikan manusia pada hak-haknya" - QS. Hud: 85</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-emerald-100 bg-emerald-50">
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
                    <tr key={user.id} className="border-b border-emerald-50 hover:bg-emerald-50/60 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">{profile?.name || user.name}</td>
                      <td className="px-4 py-3 text-gray-600">{profile?.role || user.role}</td>
                      <td className="px-4 py-3 text-right font-medium text-blue-700">{payroll ? formatCurrency(payroll.basicSalary) : "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700">{payroll ? formatCurrency(payroll.totalAllowances) : "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-700">{payroll ? formatCurrency(payroll.totalDeductions) : "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-purple-700">{payroll ? formatCurrency(payroll.zakat) : "-"}</td>
                      <td className="px-4 py-3 text-right font-bold text-teal-700">{payroll ? formatCurrency(payroll.netSalary) : "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {payroll ? (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border
                              ${payroll.status === "Paid"
                                ? "bg-green-50 text-green-600 border-green-200"
                                : payroll.status === "Pending"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-gray-50 text-gray-500 border-gray-200"}
                            `}
                          >
                            {payroll.status === "Paid" && <FiCheckCircle className="text-green-500" title="Dibayar" />}
                            {payroll.status === "Pending" && <FiClock className="text-amber-500" title="Menunggu" />}
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
                                className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                                title="Edit Data Gaji"
                              >
                                <FiEdit2 />
                              </button>
                              {payroll.status === "Pending" && (
                                <button
                                  onClick={() => handleProcessPayment(payroll.id!)}
                                  className="p-2 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors"
                                  title="Proses Pembayaran"
                                >
                                  <FiSend />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleCreatePayroll(item)}
                              className="p-2 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Tambah Data Gaji"
                            >
                              <FiPlus />
                            </button>
                          )}
                          <button onClick={() => handleOpenDefaultPayroll(item)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" title="Kelola Default Gaji">
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
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto border border-emerald-100">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowComplianceModal(false)}><FiX size={22} /></button>
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <FiFileText className="text-emerald-600" /> 
                    Laporan Kepatuhan Syariah
                  </h2>
                  <div className="text-sm text-gray-600 mb-2">Bulan: <b>{selectedMonth}</b></div>
                  <p className="text-xs text-gray-500">"Sesungguhnya Allah menyuruh (kamu) berlaku adil dan berbuat kebajikan" - QS. An-Nahl: 90</p>
                </div>
                <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-700">{formatCurrency(complianceData?.totalZakat || 0)}</div>
                      <div className="text-sm text-gray-600">Total Zakat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700">{complianceData?.shouldZakatCount || 0}</div>
                      <div className="text-sm text-gray-600">Wajib Zakat</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{complianceData?.zakatCount || 0}</div>
                      <div className="text-sm text-gray-600">Sudah Zakat</div>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    <span>📋</span>
                    Status Kepatuhan Zakat
                  </div>
                  {complianceData?.nonCompliant?.length === 0 ? (
                    <div className="text-green-600 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <FiCheckCircle className="text-green-500" /> 
                      <span className="font-medium">Alhamdulillah, semua karyawan patuh zakat</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 mb-2">Karyawan yang belum membayar zakat:</div>
                      <ul className="space-y-1">
                        {complianceData?.nonCompliant.map((item: { profile: any }, idx: number) => (
                          <li key={idx} className="text-red-600 flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <FiAlertCircle className="text-red-500" />
                            {item.profile?.name || '-'} ({item.profile?.role || '-'})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDownloadCompliancePDF}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition font-semibold w-full justify-center"
                >
                  <FiDownload /> Download Laporan PDF
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
