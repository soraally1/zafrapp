"use client";
import { useState } from "react";
import { FiDownload, FiSearch, FiFilter, FiCheckCircle, FiAlertCircle, FiX, FiFileText, FiEdit2, FiPlus, FiTrendingUp, FiTrendingDown, FiCreditCard, FiBarChart2, FiZap } from "react-icons/fi";
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

const mockSummary = {
  income: 50000000,
  expenses: 32000000,
  zis: 8000000,
  net: 10000000,
  cash: 15000000,
};

const mockTransactions = [
  { id: "TRX001", date: "2024-06-01", desc: "Penjualan Produk", category: "Pendapatan", amount: 12000000, type: "Halal", },
  { id: "TRX002", date: "2024-06-02", desc: "Pembelian Bahan Baku", category: "Beban Pokok", amount: -5000000, type: "Halal", },
  { id: "TRX003", date: "2024-06-03", desc: "Pendapatan Bunga Bank", category: "Pendapatan Lain", amount: 200000, type: "Haram", },
  { id: "TRX004", date: "2024-06-04", desc: "Donasi ZIS", category: "ZIS", amount: 3000000, type: "Halal", },
  { id: "TRX005", date: "2024-06-05", desc: "Pembayaran Gaji", category: "Beban Operasional", amount: -7000000, type: "Halal", },
  { id: "TRX006", date: "2024-06-06", desc: "Pembelian Peralatan", category: "Aset Tetap", amount: -2000000, type: "Syubhat", },
  { id: "TRX007", date: "2024-06-07", desc: "Distribusi ZIS", category: "ZIS", amount: -2500000, type: "Halal", },
];

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
];
const TYPE_OPTIONS = ["Halal", "Syubhat", "Haram"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ReportPage() {
  const [tab, setTab] = useState("journal");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState(mockTransactions);
  const [form, setForm] = useState({
    date: "",
    desc: "",
    category: CATEGORY_OPTIONS[0],
    amount: "",
    type: TYPE_OPTIONS[0],
  });
  const [adding, setAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Filtered transactions
  const filteredTx = transactions.filter((tx) => {
    if (typeFilter && tx.type !== typeFilter) return false;
    if (categoryFilter && tx.category !== categoryFilter) return false;
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo) return false;
    if (search && !(
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      tx.desc.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  // Monthly chart data
  const chartData = (() => {
    // Group by month
    const monthMap: { [month: string]: { income: number; expense: number } } = {};
    transactions.forEach((tx) => {
      const month = tx.date.slice(0, 7); // YYYY-MM
      if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
      if (tx.amount >= 0) monthMap[month].income += tx.amount;
      else monthMap[month].expense += Math.abs(tx.amount);
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
  })();

  // Add new transaction
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.date || !form.desc || !form.amount) {
      setFormError("Semua field wajib diisi.");
      return;
    }
    if (isNaN(Number(form.amount)) || form.amount === "") {
      setFormError("Nominal harus berupa angka.");
      return;
    }
    setAdding(true);
    setTimeout(() => {
      setTransactions((prev) => [
        {
          id: `TRX${(prev.length + 1).toString().padStart(3, "0")}`,
          date: form.date,
          desc: form.desc,
          category: form.category,
          amount: Number(form.amount),
          type: form.type,
        },
        ...prev,
      ]);
      setForm({ date: "", desc: "", category: CATEGORY_OPTIONS[0], amount: "", type: TYPE_OPTIONS[0] });
      setAdding(false);
      setShowModal(false);
      setToast("Laporan berhasil ditambahkan!");
      setTimeout(() => setToast(null), 2500);
    }, 600);
  };

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
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#00C570] text-white rounded-xl shadow hover:bg-green-700 transition font-semibold"><FiDownload /> Export PDF</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"><FiDownload /> Export Excel</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-xl shadow hover:bg-gray-700 transition font-semibold"><FiDownload /> Export CSV</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl shadow hover:bg-yellow-600 transition font-semibold"><FiEdit2 /> Tanda Tangan Digital</button>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"><FiPlus /> Tambah Laporan</button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-6 right-6 z-[100] px-4 py-2 rounded-xl shadow-lg text-white font-semibold flex items-center gap-2 bg-green-600 animate-fadeIn">
              <FiCheckCircle /> {toast}
            </div>
          )}

          {/* Add Report Modal */}
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">AI Syariah</label>
                    <select className="w-full px-3 py-2 border rounded-xl" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="px-4 py-2 border rounded-xl" onClick={() => setShowModal(false)} disabled={adding}>Batal</button>
                    <button type="submit" className="px-4 py-2 bg-[#00C570] text-white rounded-xl" disabled={adding}>{adding ? 'Menambah...' : 'Tambah Laporan'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><FiBarChart2 /> Trend Pendapatan & Pengeluaran Bulanan</div>
              <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} height={120} />
            </div>
            <div className="hidden md:flex flex-col gap-2 items-center justify-center">
              <FiTrendingUp className="text-4xl text-[#00C570]" />
              <span className="text-xs text-gray-500">Analisis tren keuangan</span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-blue-500">
              <FiTrendingUp className="text-2xl text-blue-500 mb-1" />
              <span className="text-xs text-gray-500">Pendapatan</span>
              <span className="font-bold text-lg text-blue-600">{formatCurrency(mockSummary.income)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-red-500">
              <FiTrendingDown className="text-2xl text-red-500 mb-1" />
              <span className="text-xs text-gray-500">Pengeluaran</span>
              <span className="font-bold text-lg text-red-600">{formatCurrency(mockSummary.expenses)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-green-500">
              <FiCreditCard className="text-2xl text-green-500 mb-1" />
              <span className="text-xs text-gray-500">ZIS</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(mockSummary.zis)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-purple-500">
              <FiZap className="text-2xl text-purple-500 mb-1" />
              <span className="text-xs text-gray-500">Laba Bersih</span>
              <span className="font-bold text-lg text-purple-600">{formatCurrency(mockSummary.net)}</span>
            </div>
            <div className="flex flex-col items-center bg-white rounded-xl py-4 shadow-sm border-t-4 border-[#00C570]">
              <FiBarChart2 className="text-2xl text-[#00C570] mb-1" />
              <span className="text-xs text-gray-500">Saldo Kas</span>
              <span className="font-bold text-lg text-[#00C570]">{formatCurrency(mockSummary.cash)}</span>
            </div>
          </div>

          {/* Filter/Search Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <FiSearch className="text-gray-400" />
              <input type="text" placeholder="Cari transaksi..." className="px-2 py-1 border rounded" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select className="px-2 py-1 border rounded" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Semua Tipe</option>
                <option value="Halal">Halal</option>
                <option value="Syubhat">Syubhat</option>
                <option value="Haram">Haram</option>
              </select>
              <select className="px-2 py-1 border rounded" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="">Semua Kategori</option>
                <option value="Pendapatan">Pendapatan</option>
                <option value="Beban Pokok">Beban Pokok</option>
                <option value="Beban Operasional">Beban Operasional</option>
                <option value="Aset Tetap">Aset Tetap</option>
                <option value="ZIS">ZIS</option>
                <option value="Pendapatan Lain">Pendapatan Lain</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Dari</span>
              <input type="date" className="px-2 py-1 border rounded" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span className="text-gray-500 text-xs">s/d</span>
              <input type="date" className="px-2 py-1 border rounded" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          {/* Tab Content */}
          {filteredTx.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-gray-400 text-center mb-8">
              <FiFileText className="text-4xl mb-2" />
              <div className="font-semibold">Belum ada data laporan untuk filter ini.</div>
              <div className="text-xs">Silakan tambah laporan atau ubah filter.</div>
            </div>
          )}

          {tab === "journal" && (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-left font-medium">Kategori</th>
                    <th className="px-4 py-3 text-right font-medium">Nominal</th>
                    <th className="px-4 py-3 text-center font-medium">AI Syariah</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{tx.date}</td>
                      <td className="px-4 py-3">{tx.desc}</td>
                      <td className="px-4 py-3">{tx.category}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        {tx.type === "Halal" && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600"><FiCheckCircle /> Halal</span>}
                        {tx.type === "Syubhat" && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600"><FiAlertCircle /> Syubhat</span>}
                        {tx.type === "Haram" && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600"><FiX /> Haram</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "ledger" && (
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
                  {mockLedger.map((row, idx) => (
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

          {tab === "balance" && (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Akun</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {mockBalance.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.account}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "pl" && (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPL.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.desc}</td>
                      <td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "cash" && (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCash.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.desc}</td>
                      <td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "zis" && (
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-medium">Deskripsi</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {mockZIS.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{row.desc}</td>
                      <td className={`px-4 py-3 text-right font-bold ${row.amount < 0 ? "text-red-600" : "text-blue-600"}`}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
