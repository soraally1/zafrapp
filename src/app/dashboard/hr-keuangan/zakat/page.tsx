"use client";
import { useState, useMemo, useEffect } from "react";
import { FiUpload, FiCheckCircle, FiClock, FiFileText, FiSearch, FiFilter, FiDownload, FiEye, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import Image from "next/image";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const LAZ_OPTIONS = [
  "LAZ Dompet Dhuafa",
  "LAZ Rumah Zakat",
  "LAZ BAZNAS",
];
const TYPE_OPTIONS = ["Zakat Profesi", "Infaq", "Sedekah"];
const STATUS_OPTIONS = ["Pending", "Distributed"];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ZakatPage() {
  // Move all hooks to the top, before any early return
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  // Filter/search state
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [lazFilter, setLazFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Transaction modal
  const [modalTx, setModalTx] = useState<any>(null);
  // Proof/report upload
  const [proofs, setProofs] = useState<{ [id: string]: string }>({});
  const [reports, setReports] = useState<{ [id: string]: string }>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [lazOptions, setLazOptions] = useState(LAZ_OPTIONS);
  const [newLaz, setNewLaz] = useState('');
  const [csrActivities, setCsrActivities] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [showCsrForm, setShowCsrForm] = useState(false);
  const [csrForm, setCsrForm] = useState({ title: '', amount: '', date: '', photos: '', report: '' });
  const [csrFormLoading, setCsrFormLoading] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        try {
          const token = await user.getIdToken();
          // Fetch user profile from API
          const res = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Unauthorized');
          const profile = await res.json();
          if (!profile || profile.role !== 'hr-keuangan') {
            await signOut(auth);
            router.push('/login');
            return;
          }
          setUserData({ ...profile, uid: user.uid });
        } catch {
          await signOut(auth);
          router.push('/login');
          return;
        }
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loadingUser) {
      const fetchZakatPayments = async () => {
        setLoadingTx(true);
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) return;
          const token = await user.getIdToken();
          const res = await fetch('/api/zakat-payments', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setTransactions(data.data || []);
          }
        } finally {
          setLoadingTx(false);
        }
      };
      fetchZakatPayments();
    }
  }, [loadingUser]);

  // Fetch CSR activities
  useEffect(() => {
    const fetchCsr = async () => {
      try {
        const res = await fetch('/api/csr-activities');
        if (res.ok) {
          const data = await res.json();
          setCsrActivities(data.data || []);
        }
      } catch {}
    };
    fetchCsr();
  }, []);

  // Fetch audit log
  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch('/api/audit-log');
        if (res.ok) {
          const data = await res.json();
          setAuditLog(data.data || []);
        }
      } catch {}
    };
    fetchAudit();
  }, []);

  // Fetch analytics for charts
  useEffect(() => {
    setLoadingAnalytics(true);
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/zakat-analytics');
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, []);

  // For LAZ filter, generate options from real data
  const lazOptionsFromData = Array.from(new Set(transactions.map(tx => tx.laz).filter(Boolean)));

  // Filtering logic
  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter && tx.type !== typeFilter) return false;
      if (lazFilter && tx.laz !== lazFilter) return false;
      if (statusFilter && tx.status !== statusFilter) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      if (search && !(
        tx.id.toLowerCase().includes(search.toLowerCase()) ||
        (tx.beneficiary || '').toLowerCase().includes(search.toLowerCase()) ||
        (tx.type || '').toLowerCase().includes(search.toLowerCase())
      )) return false;
      return true;
    });
  }, [transactions, typeFilter, lazFilter, statusFilter, dateFrom, dateTo, search]);

  const handleCsrFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsrFormLoading(true);
    try {
      const res = await fetch('/api/csr-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: csrForm.title,
          amount: Number(csrForm.amount),
          date: csrForm.date,
          photos: csrForm.photos.split(',').map((s) => s.trim()).filter(Boolean),
          report: csrForm.report
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCsrActivities([{ id: data.id, ...csrForm, amount: Number(csrForm.amount), photos: csrForm.photos.split(',').map((s) => s.trim()).filter(Boolean) }, ...csrActivities]);
        setShowCsrForm(false);
        setCsrForm({ title: '', amount: '', date: '', photos: '', report: '' });
      }
    } finally {
      setCsrFormLoading(false);
    }
  };

  if (loadingUser) {
    return <div className="flex items-center justify-center min-h-screen bg-[#F6F8FA]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C570]"></div></div>;
  }

  // Chart data
  const monthlyData = analytics && analytics.monthly ? {
    labels: Object.keys(analytics.monthly),
    datasets: [
      {
        label: "Dana Didistribusikan",
        data: Object.values(analytics.monthly),
        backgroundColor: "#00C570",
        borderRadius: 8,
      },
    ],
  } : { labels: [], datasets: [] };
  const lazPieData = analytics && analytics.perLaz ? {
    labels: Object.keys(analytics.perLaz),
    datasets: [
      {
        data: Object.values(analytics.perLaz),
        backgroundColor: ["#3B82F6", "#22C55E", "#A78BFA", "#F59E42", "#FACC15"],
      },
    ],
  } : { labels: [], datasets: [] };
  const allocationPieData = analytics && analytics.allocation ? {
    labels: ["Zakat", "Infaq", "Sedekah"],
    datasets: [
      {
        data: [analytics.allocation.zakat, analytics.allocation.infaq, analytics.allocation.sedekah],
        backgroundColor: ["#3B82F6", "#22C55E", "#FACC15"],
      },
    ],
  } : { labels: [], datasets: [] };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredTx.map((tx) => tx.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };

  const handleForwardToLAZ = async (zakatPaymentId: string, laz: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      await fetch('/api/zakat-payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ zakatPaymentId, laz })
      });
      // Refetch payments
      const res = await fetch('/api/zakat-payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data || []);
      }
      setModalTx(null);
    } catch {
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <Sidebar active="Zakat" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar userName={userData?.name || "Zakat Manager"} userRole={userData?.role === 'manager' ? 'Manager' : userData?.role || 'Admin'} userPhoto={userData?.photo} loading={loadingUser} />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Distribusi Dana Sosial & Zakat</h1>
              <p className="text-gray-600">Kelola zakat profesi, infaq, sedekah, dan distribusi dana sosial secara otomatis dan transparan.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { /* handleExport */ }} className="flex items-center gap-2 px-4 py-2 bg-[#00C570] text-white rounded-xl shadow hover:bg-green-700 transition font-semibold"><FiDownload /> Export Excel</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"><FiDownload /> Export PDF</button>
            </div>
          </div>

          {/* Add summary card at the top */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-4 flex flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Total Zakat</div>
                <div className="text-lg font-bold text-green-700">{formatCurrency(analytics.allocation?.zakat || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 flex flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Total Infaq</div>
                <div className="text-lg font-bold text-blue-700">{formatCurrency(analytics.allocation?.infaq || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl p-4 flex flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Total Sedekah</div>
                <div className="text-lg font-bold text-yellow-700">{formatCurrency(analytics.allocation?.sedekah || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl p-4 flex flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Didistribusikan</div>
                <div className="text-lg font-bold text-emerald-700">{formatCurrency(analytics.distributed || 0)}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl p-4 flex flex-col items-center shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Saldo</div>
                <div className="text-lg font-bold text-gray-700">{formatCurrency(analytics.balance || 0)}</div>
              </div>
            </div>
          )}

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Analytics & Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow">
              <div className="font-semibold text-gray-700 mb-1">Trend Distribusi Bulanan</div>
              <Bar data={monthlyData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={120} />
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow">
              <div className="font-semibold text-gray-700 mb-1">Distribusi per LAZ</div>
              <Pie data={lazPieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow">
              <div className="font-semibold text-gray-700 mb-1">Alokasi Dana</div>
              <Pie data={allocationPieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Filter/Search Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <FiSearch className="text-gray-400" />
              <input type="text" placeholder="Cari transaksi, penerima, jenis..." className="px-2 py-1 border rounded" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select className="px-2 py-1 border rounded" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Semua Jenis</option>
                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select className="px-2 py-1 border rounded" value={lazFilter} onChange={e => setLazFilter(e.target.value)}>
                <option value="">Semua LAZ</option>
                {lazOptionsFromData.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select className="px-2 py-1 border rounded" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Semua Status</option>
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Dari</span>
              <input type="date" className="px-2 py-1 border rounded" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span className="text-gray-500 text-xs">s/d</span>
              <input type="date" className="px-2 py-1 border rounded" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          {/* Bulk Actions */}
          {userData?.role === 'manager' && filteredTx.some(tx => tx.status === 'Pending') && (
            <div className="mb-4 flex gap-2 items-center">
              <input type="checkbox" checked={selectedIds.length === filteredTx.filter(tx => tx.status === 'Pending').length} onChange={e => handleSelectAll(e.target.checked)} />
              <span className="text-sm">Pilih semua transaksi pending</span>
            </div>
          )}

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-md overflow-x-auto mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  {userData?.role === 'manager' && <th className="px-2 py-3 text-center"><input type="checkbox" checked={selectedIds.length === filteredTx.filter(tx => tx.status === 'Pending').length && filteredTx.filter(tx => tx.status === 'Pending').length > 0} onChange={e => handleSelectAll(e.target.checked)} /></th>}
                  <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium">Jenis</th>
                  <th className="px-4 py-3 text-right font-medium">Nominal</th>
                  <th className="px-4 py-3 text-left font-medium">LAZ Tujuan</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-emerald-50/40 transition">
                    {userData?.role === 'manager' && (
                      <td className="px-2 py-3 text-center">
                        {tx.status === 'Pending' && <input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={e => handleSelectOne(tx.id, e.target.checked)} />}
                      </td>
                    )}
                    <td className="px-4 py-3">{tx.date}</td>
                    <td className="px-4 py-3">{tx.type}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3">{tx.laz}</td>
                    <td className="px-4 py-3 text-center">
                      {tx.status === "Distributed" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          <FiCheckCircle className="text-green-500" /> Didistribusikan
                        </span>
                      ) : tx.zakatPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          <FiCheckCircle className="text-blue-500" /> Sudah Dibayar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                          <FiClock className="text-yellow-500" /> Menunggu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-blue-600 hover:underline flex items-center gap-1" onClick={() => setModalTx(tx)}><FiEye /> Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Transaction Detail Modal */}
          {modalTx && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700" onClick={() => setModalTx(null)}><FiX size={22} /></button>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><FiFileText className="text-blue-600" /> Detail Transaksi</h2>
                <div className="mb-2 text-gray-600">ID: <b>{modalTx.id}</b></div>
                <div className="mb-2 text-gray-600">Tanggal: <b>{modalTx.date}</b></div>
                <div className="mb-2 text-gray-600">Jenis: <b>{modalTx.type}</b></div>
                <div className="mb-2 text-gray-600">Nominal: <b>{formatCurrency(modalTx.amount)}</b></div>
                <div className="mb-2 text-gray-600">LAZ Tujuan: <b>{modalTx.laz}</b></div>
                <div className="mb-2 text-gray-600">Penerima: <b>{modalTx.beneficiary}</b></div>
                <div className="mb-2 text-gray-600">Status: <b>{modalTx.status}</b></div>
                <div className="mb-2 text-gray-600">Bukti Transfer: {modalTx.proof || proofs[modalTx.id] ? (
                  <a href={modalTx.proof || proofs[modalTx.id]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                    <FiFileText /> Lihat Bukti
                  </a>
                ) : (
                  <span className="text-gray-400">Belum ada</span>
                )}</div>
                <div className="mb-2 text-gray-600">Laporan Penyaluran: {modalTx.report || reports[modalTx.id] ? (
                  <span className="inline-block text-green-700 font-medium">{modalTx.report || reports[modalTx.id]}</span>
                ) : (
                  <span className="text-gray-400">Belum ada</span>
                )}</div>
                <div className="mb-4">
                  <div className="font-semibold mb-1">Riwayat Transaksi:</div>
                  <ul className="list-disc pl-5 text-sm">
                    {modalTx.history?.map((h: any, idx: number) => (
                      <li key={idx}>{h.date} - {h.action} oleh {h.by}</li>
                    ))}
                  </ul>
                </div>
                {userData?.role === 'manager' && modalTx.zakatPaid && modalTx.status !== 'Distributed' && (
                  <form className="flex flex-col gap-3 mt-4" onSubmit={async e => {
                    e.preventDefault();
                    const auth = getAuth();
                    const user = auth.currentUser;
                    if (!user) return;
                    const token = await user.getIdToken();
                    await fetch('/api/zakat-payments', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        zakatPaymentId: modalTx.id,
                        status: 'Distributed',
                        beneficiary: modalTx.beneficiary,
                        proof: modalTx.proof,
                        report: modalTx.report
                      })
                    });
                    // Refetch payments or update UI
                    setModalTx({ ...modalTx, status: 'Distributed' });
                  }}>
                    <label className="text-sm font-bold text-gray-700">Penerima</label>
                    <input type="text" className="px-2 py-1 border rounded" value={modalTx.beneficiary || ''} onChange={e => setModalTx({ ...modalTx, beneficiary: e.target.value })} />
                    <label className="text-sm font-bold text-gray-700">Bukti Transfer (URL)</label>
                    <input type="text" className="px-2 py-1 border rounded" value={modalTx.proof || ''} onChange={e => setModalTx({ ...modalTx, proof: e.target.value })} />
                    <label className="text-sm font-bold text-gray-700">Laporan Penyaluran</label>
                    <textarea className="px-2 py-1 border rounded" value={modalTx.report || ''} onChange={e => setModalTx({ ...modalTx, report: e.target.value })} />
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 mt-2">
                      <FiCheck /> Salurkan
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Audit Log */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Audit Log</h2>
            <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-2 text-left font-medium">Aksi</th>
                    <th className="px-4 py-2 text-left font-medium">Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition">
                      <td className="px-4 py-2">{log.date}</td>
                      <td className="px-4 py-2">{log.action}</td>
                      <td className="px-4 py-2">{log.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* CSR Dashboard */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              Dashboard CSR & Kegiatan Sosial
              <button onClick={() => setShowCsrForm((v) => !v)} className="ml-2 px-3 py-1 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition">{showCsrForm ? 'Tutup' : 'Tambah'}</button>
            </h2>
            {showCsrForm && (
              <form onSubmit={handleCsrFormSubmit} className="bg-white rounded-xl shadow-md p-5 mb-6 flex flex-col gap-3">
                <div className="flex gap-3">
                  <input type="text" className="flex-1 px-2 py-1 border rounded" placeholder="Judul" value={csrForm.title} onChange={e => setCsrForm(f => ({ ...f, title: e.target.value }))} required />
                  <input type="number" className="w-32 px-2 py-1 border rounded" placeholder="Nominal" value={csrForm.amount} onChange={e => setCsrForm(f => ({ ...f, amount: e.target.value }))} required />
                  <input type="date" className="w-40 px-2 py-1 border rounded" value={csrForm.date} onChange={e => setCsrForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <input type="text" className="px-2 py-1 border rounded" placeholder="Foto (URL, pisahkan dengan koma)" value={csrForm.photos} onChange={e => setCsrForm(f => ({ ...f, photos: e.target.value }))} />
                <textarea className="px-2 py-1 border rounded" placeholder="Laporan / Keterangan" value={csrForm.report} onChange={e => setCsrForm(f => ({ ...f, report: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-4 py-2 border rounded" onClick={() => setShowCsrForm(false)} disabled={csrFormLoading}>Batal</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition" disabled={csrFormLoading}>{csrFormLoading ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {csrActivities.map((act) => (
                <div key={act.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-block px-2 py-1 rounded-full bg-[#E6FFF4] text-[#00C570] text-xs font-semibold">{act.date}</span>
                    <span className="font-bold text-gray-800">{act.title}</span>
                  </div>
                  <div className="text-gray-600 text-sm mb-2">Dana: <b className="text-[#00C570]">{formatCurrency(act.amount)}</b></div>
                  <div className="flex gap-2 mb-2">
                    {(act.photos || []).map((src: string, idx: number) => (
                      <Image key={idx} src={src} alt="Dokumentasi" width={80} height={60} className="rounded-lg border" />
                    ))}
                  </div>
                  <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: act.report }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
