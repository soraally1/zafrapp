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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define the structure of a transaction
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

const mockTabs = [
  { key: "journal", label: "Jurnal Umum" },
  { key: "ledger", label: "Buku Besar" },
  { key: "balance", label: "Neraca" },
  { key: "pl", label: "Laba Rugi" },
  { key: "cash", label: "Arus Kas" },
  { key: "zis", label: "Laporan ZIS" },
];

const mockLedger = [
  { account: "Kas", debit: 20000000, credit: 5000000, balance: 15000000 },
  { account: "Pendapatan", debit: 0, credit: 12000000, balance: 12000000 },
  { account: "Beban Operasional", debit: 7000000, credit: 0, balance: -7000000 },
  { account: "Aset Tetap", debit: 2000000, credit: 0, balance: 2000000 },
];

const mockBalance = [
  { account: "Kas", amount: 15000000 },
  { account: "Aset Tetap", amount: 2000000 },
  { account: "Modal", amount: 17000000 },
];

const mockPL = [
  { desc: "Pendapatan", amount: 12000000 },
  { desc: "Beban Pokok", amount: -5000000 },
  { desc: "Beban Operasional", amount: -7000000 },
  { desc: "Pendapatan Lain", amount: 200000 },
  { desc: "Laba Bersih", amount: 12000000 - 5000000 - 7000000 + 200000 },
];

const mockCash = [
  { desc: "Saldo Awal", amount: 5000000 },
  { desc: "Penerimaan Kas", amount: 20000000 },
  { desc: "Pengeluaran Kas", amount: -10000000 },
  { desc: "Saldo Akhir", amount: 15000000 },
];

const mockZIS = [
  { desc: "Penerimaan ZIS", amount: 8000000 },
  { desc: "Distribusi ZIS", amount: -2500000 },
  { desc: "Saldo ZIS", amount: 5500000 },
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

function formatCurrency(amount: number) {
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
}

export default function ReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const summary = useMemo(() => {
    const result = filteredTx.reduce((acc, tx) => {
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
  }, [filteredTx]);

  const chartData = useMemo(() => {
    const monthMap: { [month: string]: { income: number; expense: number } } = {};
    filteredTx.forEach((tx) => {
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
  }, [filteredTx]);

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
      setTimeout(() => setToast(null), 2500);
    } catch (error) {
      console.error("Error deleting document: ", error);
      setToast({ message: "Gagal menghapus laporan.", type: 'error' });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setShowDeleteModal(false);
      setDeleteConfirm(null);
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

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <Sidebar active="Report" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar userName="Finance Manager" userRole="Manager" userPhoto={undefined} loading={false} />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Laporan Keuangan & ZIS</h1>
              <p className="text-gray-600">Sistem pencatatan otomatis, validasi AI Syariah, dan ekspor laporan keuangan.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#00C570] text-white rounded-xl shadow hover:bg-green-700 transition font-semibold"><FiDownload /> Export PDF</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"><FiDownload /> Export Excel</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-xl shadow hover:bg-gray-700 transition font-semibold"><FiDownload /> Export CSV</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl shadow hover:bg-yellow-600 transition font-semibold"><FiEdit2 /> Tanda Tangan Digital</button>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"><FiPlus /> Tambah Laporan</button>
            </div>
          </div>

          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 relative animate-fadeIn">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FiAlertCircle className="text-red-500"/> Konfirmasi Hapus</h2>
                <p className="text-gray-600 mb-6">Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 border rounded-xl" onClick={() => setShowDeleteModal(false)}>Batal</button>
                  <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl">Ya, Hapus</button>
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
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setShowModal(false)}><FiX size={22} /></button>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiFileText className="text-blue-600" /> Tambah Laporan Keuangan</h2>
                {formError && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{formError}</div>}
                <form className="space-y-4" onSubmit={handleAdd}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
                    <input type="date" className="w-full px-3 py-2 border rounded-xl" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-xl" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                    <select className="w-full px-3 py-2 border rounded-xl" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nominal</label>
                    <input type="number" className="w-full px-3 py-2 border rounded-xl" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="px-4 py-2 border rounded-xl" onClick={() => setShowModal(false)} disabled={adding}>Batal</button>
                    <button type="submit" className="px-4 py-2 bg-[#00C570] text-white rounded-xl" disabled={adding}>{adding ? 'Menambah...' : 'Tambah Laporan'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><FiBarChart2 /> Trend Pendapatan & Pengeluaran Bulanan</div>
              <div style={{height: '250px'}}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
            <div className="hidden md:flex flex-col gap-2 items-center justify-center">
              <FiTrendingUp className="text-4xl text-[#00C570]" />
              <span className="text-xs text-gray-500">Analisis tren keuangan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-blue-500">
              <FiTrendingUp className="text-2xl text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Pendapatan</span>
              <span className="font-bold text-lg text-blue-600">{formatCurrency(summary.income)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-red-500">
              <FiTrendingDown className="text-2xl text-red-500 mb-1" />
              <span className="text-xs text-gray-500">Pengeluaran</span>
              <span className="font-bold text-lg text-red-600">{formatCurrency(summary.expenses)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-green-500">
              <FiCreditCard className="text-2xl text-green-500 mb-1" />
              <span className="text-xs text-gray-500">ZIS</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(summary.zis)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-purple-500">
              <FiZap className="text-2xl text-purple-500 mb-1" />
              <span className="text-xs text-gray-500">Laba Bersih</span>
              <span className="font-bold text-lg text-purple-600">{formatCurrency(summary.net)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-[#00C570]">
              <FiBarChart2 className="text-2xl text-[#00C570] mb-1" />
              <span className="text-xs text-gray-500">Saldo Kas</span>
              <span className="font-bold text-lg text-[#00C570]">{formatCurrency(summary.cash)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <FiSearch className="text-gray-400" />
              <input type="text" placeholder="Cari transaksi..." className="px-2 py-1 border rounded" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Transaction['aiStatus'] | 'all')} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Semua Status</option>
                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Semua Kategori</option>
                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Dari</span>
              <input type="date" className="px-2 py-1 border rounded" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span className="text-gray-500 text-xs">Sampai</span>
              <input type="date" className="px-2 py-1 border rounded" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">ID Transaksi</th>
                  <th scope="col" className="px-6 py-3">Tanggal</th>
                  <th scope="col" className="px-6 py-3">Deskripsi</th>
                  <th scope="col" className="px-6 py-3">Kategori</th>
                  <th scope="col" className="px-6 py-3 text-right">Nominal</th>
                  <th scope="col" className="px-6 py-3 text-center">Status AI</th>
                  <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.length > 0 ? (
                  filteredTx.map((tx: Transaction, index: number) => (
                    <Fragment key={tx.id}>
                      <tr className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono text-xs text-gray-700">{tx.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4">{tx.date}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{tx.desc}</td>
                        <td className="px-6 py-4">{tx.category}</td>
                        <td className="px-6 py-4 text-right font-semibold">{formatCurrency(tx.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={tx.aiStatus} />
                        </td>
                        <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                          <button onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)} className="text-blue-600 hover:text-blue-800">
                            <FiChevronDown className={`transition-transform ${expandedId === tx.id ? 'rotate-180' : ''}`} />
                          </button>
                          <button onClick={() => { setDeleteConfirm(tx.id); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-800">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                      {expandedId === tx.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="p-4">
                            <div className="text-xs text-gray-700">
                              <p><span className="font-semibold">Penjelasan AI:</span> {tx.aiExplanation || "Belum ada penjelasan."}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-b border-gray-200 mb-6">
             <nav className="-mb-px flex space-x-6 overflow-x-auto">
               {mockTabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {tab === "journal" && (<>
              {filteredTx.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8">
                  <FiFileText className="text-4xl mb-2" />
                  <div className="font-semibold">Belum ada data laporan untuk filter ini.</div>
                  <div className="text-xs">Silakan tambah laporan atau ubah filter.</div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
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
                          <tr onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="px-4 py-3">{tx.date}</td>
                            <td className="px-4 py-3">{tx.desc}</td>
                            <td className="px-4 py-3">{tx.category}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(tx.amount)}</td>
                            <td className="px-4 py-3 text-center"><StatusBadge status={tx.aiStatus} /></td>
                            <td className="px-4 py-3 text-center text-gray-400"><FiChevronDown className={`transform transition-transform ${expandedId === tx.id ? 'rotate-180' : ''}`} /></td>
                          </tr>
                          {expandedId === tx.id && (
                            <tr className="bg-gray-50"><td colSpan={6} className="p-4 text-sm text-gray-600">
                                <p className="font-semibold text-gray-800 mb-1">Penjelasan AI:</p>
                                <div className="whitespace-pre-wrap">{tx.aiExplanation || 'Tidak ada penjelasan dari AI.'}</div>
                            </td></tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>)}

          {tab === "ledger" && ( <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8"><table className="w-full text-sm"><thead><tr className="text-gray-500 border-b border-gray-100"><th className="px-4 py-3 text-left font-medium">Akun</th><th className="px-4 py-3 text-right font-medium">Debit</th><th className="px-4 py-3 text-right font-medium">Kredit</th><th className="px-4 py-3 text-right font-medium">Saldo</th></tr></thead><tbody>{mockLedger.map((row, idx) => (<tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="px-4 py-3">{row.account}</td><td className="px-4 py-3 text-right">{formatCurrency(row.debit)}</td><td className="px-4 py-3 text-right">{formatCurrency(row.credit)}</td><td className="px-4 py-3 text-right font-bold">{formatCurrency(row.balance)}</td></tr>))}</tbody></table></div>)}
          {tab === "balance" && ( <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8"><table className="w-full text-sm"><thead><tr className="text-gray-500 border-b border-gray-100"><th className="px-4 py-3 text-left font-medium">Akun</th><th className="px-4 py-3 text-right font-medium">Jumlah</th></tr></thead><tbody>{mockBalance.map((row, idx) => (<tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="px-4 py-3">{row.account}</td><td className="px-4 py-3 text-right font-bold">{formatCurrency(row.amount)}</td></tr>))}</tbody></table></div>)}
          {tab === "pl" && ( <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8"><table className="w-full text-sm"><thead><tr className="text-gray-500 border-b border-gray-100"><th className="px-4 py-3 text-left font-medium">Deskripsi</th><th className="px-4 py-3 text-right font-medium">Jumlah</th></tr></thead><tbody>{mockPL.map((row, idx) => (<tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="px-4 py-3">{row.desc}</td><td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td></tr>))}</tbody></table></div>)}
          {tab === "cash" && ( <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8"><table className="w-full text-sm"><thead><tr className="text-gray-500 border-b border-gray-100"><th className="px-4 py-3 text-left font-medium">Deskripsi</th><th className="px-4 py-3 text-right font-medium">Jumlah</th></tr></thead><tbody>{mockCash.map((row, idx) => (<tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="px-4 py-3">{row.desc}</td><td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td></tr>))}</tbody></table></div>)}
          {tab === "zis" && ( <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8"><table className="w-full text-sm"><thead><tr className="text-gray-500 border-b border-gray-100"><th className="px-4 py-3 text-left font-medium">Deskripsi</th><th className="px-4 py-3 text-right font-medium">Jumlah</th></tr></thead><tbody>{mockZIS.map((row, idx) => (<tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition"><td className="px-4 py-3">{row.desc}</td><td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td></tr>))}</tbody></table></div>)}
        </div>
      </main>
    </div>
  );
}