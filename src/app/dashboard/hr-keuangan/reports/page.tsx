"use client";
import { useState, useEffect, useMemo, Fragment } from "react";
import { db } from "@/lib/firebaseApi";
import { collection, query, onSnapshot, orderBy, Timestamp, addDoc, doc, deleteDoc } from "firebase/firestore";
import { FiDownload, FiSearch, FiFilter, FiCheckCircle, FiAlertCircle, FiX, FiFileText, FiEdit2, FiPlus, FiTrendingUp, FiTrendingDown, FiCreditCard, FiBarChart2, FiZap, FiHelpCircle, FiClock, FiChevronDown, FiTrash2 } from "react-icons/fi";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { 
  calculateLedgerData, 
  calculateBalanceData, 
  calculateProfitLossData, 
  calculateCashFlowData, 
  calculateZisData, 
  calculateSummary, 
  calculateChartData, 
  formatCurrency,
  type Transaction 
} from "./financialReportLogic";
import { exportToPDF, exportToExcel, exportToCSV } from "./exportUtils";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseApi"; // Import the initialized auth instance
import { useRouter } from "next/navigation";
// import { getUserProfile } from '@/app/api/service/userProfileService'; // This is now fetched via API

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const mockTabs = [
  { key: "journal", label: "Jurnal Umum" },
  { key: "ledger", label: "Buku Besar" },
  { key: "balance", label: "Neraca" },
  { key: "pl", label: "Laba Rugi" },
  { key: "cash", label: "Arus Kas" },
  { key: "zis", label: "Laporan ZIS" },
];

const CATEGORY_OPTIONS = [
  "Pendapatan",
  "Beban Pokok",
  "Beban Operasional",
  "Aset Tetap",
  "ZIS",
  "Pendapatan Lain",
  "Pengeluaran lain",
];
const TYPE_OPTIONS = ["Halal", "Syubhat", "Haram", "pending"] as const;

const StatusBadge = ({ status }: { status: Transaction['aiStatus'] }) => {
  switch (status) {
    case 'Halal':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600"><FiCheckCircle /> Halal</span>;
    case 'Syubhat':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600"><FiHelpCircle /> Syubhat</span>;
    case 'Haram':
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600"><FiAlertCircle /> Haram</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><FiClock /> Pending</span>;
  }
};



export default function ReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  // Filtering and Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Transaction['aiStatus'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // UI State
  const [tab, setTab] = useState('journal');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Add Modal State
  const [showModal, setShowModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    date: "",
    desc: "",
    category: CATEGORY_OPTIONS[0],
    amount: "",
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Export Loading States
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const filteredTx = useMemo(() => {
    return transactions
      .filter(t => {
        const searchLower = search.toLowerCase();
        const date = t.createdAt ? t.createdAt.toDate() : new Date(t.date);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;

        if (to) to.setHours(23, 59, 59, 999);

        return (
          (t.desc.toLowerCase().includes(searchLower) || t.category.toLowerCase().includes(searchLower)) &&
          (statusFilter === 'all' || t.aiStatus === statusFilter) &&
          (categoryFilter === 'all' || t.category === categoryFilter) &&
          (!from || date >= from) &&
          (!to || date <= to)
        );
      });
  }, [transactions, search, statusFilter, categoryFilter, dateFrom, dateTo]);

  // Computed financial data based on real transactions
  const ledgerData = useMemo(() => calculateLedgerData(filteredTx), [filteredTx]);
  const balanceData = useMemo(() => calculateBalanceData(filteredTx), [filteredTx]);
  const profitLossData = useMemo(() => calculateProfitLossData(filteredTx), [filteredTx]);
  const cashFlowData = useMemo(() => calculateCashFlowData(filteredTx), [filteredTx]);
  const zisData = useMemo(() => calculateZisData(filteredTx), [filteredTx]);

  useEffect(() => {
    const q = query(collection(db, "transactionReports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reports: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          date: data.date,
          desc: data.description, // Mapped from description
          category: data.category,
          amount: Number(data.nominal) || 0, // Mapped from nominal, ensure it's a number
          aiStatus: data.aiStatus || 'pending',
          aiExplanation: data.aiExplanation || '',
          createdAt: data.createdAt,
        });
      });
      setTransactions(reports);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Gagal memuat data laporan. Silakan coba lagi.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // const auth = getAuth(); // No longer need to call this
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }

          const profile = await response.json();
          setUserProfile(profile);

          if (!profile || profile.role !== 'hr-keuangan') {
            await signOut(auth);
            router.push('/login');
            return;
          }
        } catch (error) {
          console.error("Authentication error, signing out: ", error);
          await signOut(auth);
          router.push('/login');
          return;
        } finally {
          setLoadingUser(false);
        }
      } else {
        // No user is signed in.
        setLoadingUser(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const summary = useMemo(() => calculateSummary(filteredTx), [filteredTx]);
  const chartData = useMemo(() => calculateChartData(filteredTx), [filteredTx]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.date || !form.desc || !form.amount) {
      setFormError("Semua field wajib diisi.");
      return;
    }
    const amount = Number(form.amount);
    if (isNaN(amount) || form.amount === "") {
      setFormError("Nominal harus berupa angka.");
      return;
    }
    setAdding(true);
    try {
        await addDoc(collection(db, "transactionReports"), {
            date: form.date,
            description: form.desc,
            category: form.category,
            nominal: amount,
            aiStatus: 'pending',
            createdAt: Timestamp.now(),
        });
        setForm({ date: "", desc: "", category: CATEGORY_OPTIONS[0], amount: "" });
        setShowModal(false);
        setToast({ message: "Laporan berhasil ditambahkan!", type: 'success' });
        setTimeout(() => setToast(null), 2500);
    } catch (error) {
        console.error("Error adding document: ", error);
        setFormError("Gagal menambahkan laporan. Silakan coba lagi.");
    } finally {
        setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, "transactionReports", deleteConfirm));
      setToast({ message: "Laporan berhasil dihapus!", type: 'success' });
      setTimeout(() => setToast(null), 2505);
    } catch (error) {
      console.error("Error deleting document: ", error);
      setToast({ message: "Gagal menghapus laporan.", type: 'error' });
      setTimeout(() => setToast(null), 2505);
    } finally {
      setShowDeleteModal(false);
      setDeleteConfirm(null);
    }
  };

  // Export functions
  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const result = await exportToPDF(
        filteredTx,
        ledgerData,
        balanceData,
        profitLossData,
        cashFlowData,
        zisData,
        summary,
        tab
      );
      
      if (result.success) {
        setToast({ message: result.message, type: 'success' });
      } else {
        setToast({ message: result.message, type: 'error' });
      }
      setTimeout(() => setToast(null), 2505);
    } catch (error) {
      console.error('Export PDF error:', error);
      setToast({ message: 'Gagal mengekspor PDF', type: 'error' });
      setTimeout(() => setToast(null), 2505);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const result = await exportToExcel(
        filteredTx,
        ledgerData,
        balanceData,
        profitLossData,
        cashFlowData,
        zisData,
        summary
      );
      
      if (result.success) {
        setToast({ message: result.message, type: 'success' });
      } else {
        setToast({ message: result.message, type: 'error' });
      }
      setTimeout(() => setToast(null), 2505);
    } catch (error) {
      console.error('Export Excel error:', error);
      setToast({ message: 'Gagal mengekspor Excel', type: 'error' });
      setTimeout(() => setToast(null), 2505);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportCSV = () => {
    setExportingCSV(true);
    try {
      const result = exportToCSV(
        filteredTx,
        tab,
        ledgerData,
        balanceData,
        profitLossData,
        cashFlowData,
        zisData
      );
      
      if (result.success) {
        setToast({ message: result.message, type: 'success' });
      } else {
        setToast({ message: result.message, type: 'error' });
      }
      setTimeout(() => setToast(null), 2505);
    } catch (error) {
      console.error('Export CSV error:', error);
      setToast({ message: 'Gagal mengekspor CSV', type: 'error' });
      setTimeout(() => setToast(null), 2505);
    } finally {
      setExportingCSV(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
            <div className="text-gray-500">Memuat data...</div>
        </div>
    );
  }

  if (error) {
      return (
          <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
              <div className="text-red-500 bg-red-100 p-4 rounded-xl">{error}</div>
          </div>
      );
  }

  if (loadingUser) {
    return <div className="flex items-center justify-center min-h-screen bg-[#F6F8FA]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C570]"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex">
      <Sidebar active="Report" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar
          userName={userProfile?.name || 'User'}
          userRole={userProfile?.role || 'Role'}
          userPhoto={userProfile?.photo}
          loading={loadingUser}
        />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Islamic Quote Banner */}
          <div className="mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <FiFileText className="text-yellow-300 text-xl" />
              <h2 className="text-lg font-semibold">Bismillahirrahmanirrahim</h2>
            </div>
            <div className="mb-2 text-right font-arabic text-2xl leading-relaxed">
              وَمَا أَنْفَقْتُمْ مِنْ نَفَقَةٍ أَوْ نَذَرْتُمْ مِنْ نَذْرٍ فَإِنَّ اللَّهَ يَعْلَمُهُ
            </div>
            <div className="text-sm opacity-90 mb-1">
              Dan apa saja yang kamu nafkahkan atau apa saja yang kamu nazarkan, maka sesungguhnya Allah mengetahuinya
            </div>
            <div className="text-xs opacity-75 font-medium">
              QS. Al-Baqarah: 270
            </div>
          </div>

          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-emerald-600">📊</span>
                Laporan Keuangan & ZIS
              </h1>
              <p className="text-gray-600">Sistem pencatatan otomatis, validasi AI Syariah, dan ekspor laporan keuangan sesuai prinsip syariah.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload /> {exportingPDF ? 'Mengekspor...' : 'Export PDF'}
              </button>
              <button 
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl shadow hover:bg-teal-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload /> {exportingExcel ? 'Mengekspor...' : 'Export Excel'}
              </button>
              <button 
                onClick={handleExportCSV}
                disabled={exportingCSV}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl shadow hover:bg-amber-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload /> {exportingCSV ? 'Mengekspor...' : 'Export CSV'}
              </button>
              <button 
                onClick={() => setShowModal(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition font-semibold"
              >
                <FiPlus /> Tambah Laporan
              </button>
            </div>
          </div>

          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 relative animate-fadeIn border border-red-100">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FiAlertCircle className="text-red-500"/> Konfirmasi Hapus</h2>
                <p className="text-gray-600 mb-6">Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition" onClick={() => setShowDeleteModal(false)}>Batal</button>
                  <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold">Ya, Hapus</button>
                </div>
              </div>
            </div>
          )}

          {toast && (
            <div className={`fixed top-6 right-6 z-[100] px-4 py-2 rounded-xl shadow-lg text-white font-semibold flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-fadeIn`}>
              <FiCheckCircle /> {toast.message}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto border border-emerald-100">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowModal(false)}><FiX size={22} /></button>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiFileText className="text-emerald-600" /> Tambah Laporan Keuangan</h2>
                <p className="text-sm text-gray-600 mb-4">"Sesungguhnya Allah menyukai orang-orang yang berbuat kebajikan" - QS. Al-Baqarah: 195</p>
                {formError && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">{formError}</div>}
                <form className="space-y-4" onSubmit={handleAdd}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                    <input type="date" className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                    <input type="text" className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                    <select className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nominal</label>
                    <input type="number" className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition" onClick={() => setShowModal(false)} disabled={adding}>Batal</button>
                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold" disabled={adding}>{adding ? 'Menambah...' : 'Tambah Laporan'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-emerald-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-emerald-200 text-lg">📈</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Pendapatan</div>
              <div className="text-xl font-bold text-emerald-700">{formatCurrency(summary.income)}</div>
              <div className="text-xs text-emerald-600 mt-1">Total Income</div>
            </div>
            <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-red-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-red-200 text-lg">📉</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Pengeluaran</div>
              <div className="text-xl font-bold text-red-700">{formatCurrency(summary.expenses)}</div>
              <div className="text-xs text-red-600 mt-1">Total Expenses</div>
            </div>
            <div className="bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-teal-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-teal-200 text-lg">🤲</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">ZIS</div>
              <div className="text-xl font-bold text-teal-700">{formatCurrency(summary.zis)}</div>
              <div className="text-xs text-teal-600 mt-1">Zakat & Sedekah</div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-purple-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-purple-200 text-lg">⚡</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Laba Bersih</div>
              <div className="text-xl font-bold text-purple-700">{formatCurrency(summary.net)}</div>
              <div className="text-xs text-purple-600 mt-1">Net Profit</div>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-amber-200 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-2 right-2 text-amber-200 text-lg">💰</div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Saldo Kas</div>
              <div className="text-xl font-bold text-amber-700">{formatCurrency(summary.cash)}</div>
              <div className="text-xs text-amber-600 mt-1">Cash Balance</div>
            </div>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Analytics Chart */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-8 flex flex-col gap-2 hover:shadow-lg transition-shadow border border-emerald-100">
            <div className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <span className="text-emerald-600">📊</span>
              Trend Pendapatan & Pengeluaran Bulanan
            </div>
            <div className="text-xs text-gray-500 mb-2">"Dan apa saja yang kamu nafkahkan, maka Allah akan menggantinya" - QS. Saba': 39</div>
            <div style={{height: '250px'}}>
              <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Filter/Search Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 border border-emerald-100">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FiSearch className="text-emerald-500 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Cari transaksi, kategori..." 
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                </div>
              </div>
              
              {/* Filter Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <FiFilter className="text-emerald-500 flex-shrink-0" />
                  <select 
                    className="flex-1 min-w-0 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value as Transaction['aiStatus'] | 'all')}
                  >
                    <option value="all">Semua Status</option>
                    {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <select 
                  className="flex-1 min-w-0 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Semua Kategori</option>
                  {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
              {/* Date Range */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs whitespace-nowrap">Dari</span>
                  <input 
                    type="date" 
                    className="flex-1 min-w-0 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" 
                    value={dateFrom} 
                    onChange={e => setDateFrom(e.target.value)} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs whitespace-nowrap">s/d</span>
                  <input 
                    type="date" 
                    className="flex-1 min-w-0 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" 
                    value={dateTo} 
                    onChange={e => setDateTo(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-md overflow-x-auto mb-10 border border-emerald-100">
            <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-emerald-600">📋</span>
                Daftar Transaksi Keuangan
              </h3>
              <p className="text-sm text-gray-600 mt-1">"Dan apa saja yang kamu nafkahkan atau apa saja yang kamu nazarkan, maka sesungguhnya Allah mengetahuinya" - QS. Al-Baqarah: 270</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-emerald-100 bg-emerald-50">
                  <th className="px-4 py-3 text-left font-medium">ID Transaksi</th>
                  <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                  <th className="px-4 py-3 text-left font-medium">Kategori</th>
                  <th className="px-4 py-3 text-right font-medium">Nominal</th>
                  <th className="px-4 py-3 text-center font-medium">Status AI</th>
                  <th className="px-4 py-3 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.length > 0 ? (
                  filteredTx.map((tx: Transaction, index: number) => (
                    <Fragment key={tx.id}>
                      <tr className="border-b border-emerald-50 hover:bg-emerald-50/60 transition">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{tx.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3">{tx.date}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{tx.desc}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(tx.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={tx.aiStatus} />
                        </td>
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                          <button onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)} className="text-emerald-600 hover:text-emerald-800 transition">
                            <FiChevronDown className={`transition-transform ${expandedId === tx.id ? 'rotate-180' : ''}`} />
                          </button>
                          <button onClick={() => { setDeleteConfirm(tx.id); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-800 transition">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                      {expandedId === tx.id && (
                        <tr className="bg-emerald-50/30">
                          <td colSpan={7} className="p-4">
                            <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-emerald-100">
                              <p className="font-semibold text-emerald-700 mb-1">Penjelasan AI Syariah:</p>
                              <p>{tx.aiExplanation || "Belum ada penjelasan dari AI."}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FiFileText className="text-4xl text-gray-300" />
                        <div className="font-semibold">Tidak ada transaksi yang cocok dengan filter.</div>
                        <div className="text-sm">Silakan ubah filter atau tambah transaksi baru.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Report Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 border border-emerald-100">
            <div className="border-b border-emerald-100 mb-4">
              <nav className="-mb-px flex space-x-6 overflow-x-auto">
                {mockTabs.map(t => (
                  <button 
                    key={t.key} 
                    onClick={() => setTab(t.key)} 
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      tab === t.key 
                        ? 'border-emerald-600 text-emerald-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {tab === "journal" && (<>
              {filteredTx.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8 border border-emerald-100">
                  <FiFileText className="text-4xl mb-2 text-emerald-200" />
                  <div className="font-semibold">Belum ada data laporan untuk filter ini.</div>
                  <div className="text-xs">Silakan tambah laporan atau ubah filter.</div>
                </div>
              ) : (
            <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto mb-8 border border-emerald-100 hover:shadow-lg transition-shadow mb-20">
              <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-emerald-600">📝</span>
                  Jurnal Umum
                </h3>
                <p className="text-sm text-gray-600 mt-1">"Sesungguhnya Allah menyukai orang-orang yang berbuat kebajikan" - QS. Al-Baqarah: 195</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-emerald-100 bg-emerald-50">
                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-left font-medium">Kategori</th>
                    <th className="px-4 py-3 text-right font-medium">Nominal</th>
                    <th className="px-4 py-3 text-center font-medium">AI Syariah</th>
                    <th className="px-4 py-3 w-12 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                      {filteredTx.map((tx: Transaction, index: number) => (
                        <Fragment key={tx.id}>
                          <tr onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)} className="cursor-pointer border-b border-emerald-50 hover:bg-emerald-50/60 transition">
                      <td className="px-4 py-3">{tx.date}</td>
                      <td className="px-4 py-3">{tx.desc}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(tx.amount)}</td>
                            <td className="px-4 py-3 text-center"><StatusBadge status={tx.aiStatus} /></td>
                            <td className="px-4 py-3 text-center text-emerald-400"><FiChevronDown className={`transform transition-transform ${expandedId === tx.id ? 'rotate-180' : ''}`} /></td>
                    </tr>
                          {expandedId === tx.id && (
                            <tr className="bg-emerald-50/30"><td colSpan={6} className="p-4 text-sm text-gray-600">
                                <div className="bg-white p-3 rounded-lg border border-emerald-100">
                                  <p className="font-semibold text-emerald-700 mb-1">Penjelasan AI Syariah:</p>
                                  <div className="whitespace-pre-wrap">{tx.aiExplanation || 'Tidak ada penjelasan dari AI.'}</div>
                                </div>
                            </td></tr>
                          )}
                        </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </>)}

          {tab === "ledger" && (
            <>
              {ledgerData.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8">
                  <FiFileText className="text-4xl mb-2" />
                  <div className="font-semibold">Belum ada data buku besar untuk filter ini.</div>
                  <div className="text-xs">Silakan tambah transaksi atau ubah filter.</div>
                </div>
              ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Akun</th>
                    <th className="px-4 py-3 text-right font-medium">Debit</th>
                    <th className="px-4 py-3 text-right font-medium">Kredit</th>
                    <th className="px-4 py-3 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                      {ledgerData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.account}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.debit)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.credit)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}
          {tab === "balance" && (
            <>
              {balanceData.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8">
                  <FiFileText className="text-4xl mb-2" />
                  <div className="font-semibold">Belum ada data neraca untuk filter ini.</div>
                  <div className="text-xs">Silakan tambah transaksi atau ubah filter.</div>
                </div>
              ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Akun</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                      {balanceData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.account}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}
          {tab === "pl" && (
            <>
              {profitLossData.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8">
                  <FiFileText className="text-4xl mb-2" />
                  <div className="font-semibold">Belum ada data laba rugi untuk filter ini.</div>
                  <div className="text-xs">Silakan tambah transaksi atau ubah filter.</div>
                </div>
              ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                      {profitLossData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.desc}</td>
                      <td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}
          {tab === "cash" && (
            <>
              {cashFlowData.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8">
                  <FiFileText className="text-4xl mb-2" />
                  <div className="font-semibold">Belum ada data arus kas untuk filter ini.</div>
                  <div className="text-xs">Silakan tambah transaksi atau ubah filter.</div>
                </div>
              ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                      {cashFlowData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.desc}</td>
                      <td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}
          {tab === "zis" && (
            <>
              {zisData.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8">
                  <FiFileText className="text-4xl mb-2" />
                  <div className="font-semibold">Belum ada data laporan ZIS untuk filter ini.</div>
                  <div className="text-xs">Silakan tambah transaksi ZIS atau ubah filter.</div>
                </div>
              ) : (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                      {zisData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.desc}</td>
                      <td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}