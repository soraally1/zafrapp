"use client";
import { useState, useMemo, useEffect } from "react";
import { FiCheckCircle, FiClock, FiFileText, FiSearch, FiFilter, FiDownload, FiEye, FiX, FiCheck, FiStar, FiHeart } from "react-icons/fi";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
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
import imageCompression from 'browser-image-compression';

// Islamic quotes and Quranic verses
const ISLAMIC_QUOTES = [
  {
    quote: "إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ وَالْعَامِلِينَ عَلَيْهَا وَالْمُؤَلَّفَةِ قُلُوبُهُمْ وَفِي الرِّقَابِ وَالْغَارِمِينَ وَفِي سَبِيلِ اللَّهِ وَابْنِ السَّبِيلِ",
    translation: "Sesungguhnya zakat itu hanyalah untuk orang-orang fakir, orang miskin, pengurus-pengurus zakat, para mu'allaf yang dibujuk hatinya, untuk (memerdekakan) budak, orang-orang yang berhutang, untuk jalan Allah dan untuk mereka yang sedang dalam perjalanan",
    source: "QS. At-Taubah: 60"
  },
  {
    quote: "مَثَلُ الَّذِينَ يُنْفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنْبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنْبُلَةٍ مِائَةُ حَبَّةٍ",
    translation: "Perumpamaan orang yang menafkahkan hartanya di jalan Allah adalah serupa dengan sebutir benih yang menumbuhkan tujuh bulir, pada tiap-tiap bulir seratus biji",
    source: "QS. Al-Baqarah: 261"
  },
  {
    quote: "وَمَا أَنْفَقْتُمْ مِنْ نَفَقَةٍ أَوْ نَذَرْتُمْ مِنْ نَذْرٍ فَإِنَّ اللَّهَ يَعْلَمُهُ",
    translation: "Dan apa saja yang kamu nafkahkan atau apa saja yang kamu nazarkan, maka sesungguhnya Allah mengetahuinya",
    source: "QS. Al-Baqarah: 270"
  }
];

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const LAZ_OPTIONS = ["LAZ Dompet Dhuafa", "LAZ Rumah Zakat", "LAZ BAZNAS"];
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

// Helper: Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: Compress image file
async function compressImage(file: File): Promise<File> {
  return imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200 });
}

// Helper: Validate file size and type
function validateImageFile(file: File): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    alert(`File ${file.name} terlalu besar. Maksimal 5MB.`);
    return false;
  }
  
  if (!allowedTypes.includes(file.type)) {
    alert(`File ${file.name} tidak didukung. Gunakan JPEG, PNG, atau WebP.`);
    return false;
  }
  
  return true;
}

export default function ZakatPage() {
  // State
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");
  const [lazFilter, setLazFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalTx, setModalTx] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [csrActivities, setCsrActivities] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [showCsrForm, setShowCsrForm] = useState(false);
  const [csrForm, setCsrForm] = useState({ title: '', amount: '', date: '', photos: [] as string[], report: '' });
  const [csrFormLoading, setCsrFormLoading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Handle escape key to close image modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selectedImage]);

  // Fetch user profile
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        try {
          const token = await user.getIdToken();
          const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
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

  // Fetch zakat payments
  useEffect(() => {
    if (!loadingUser) {
      const fetchZakatPayments = async () => {
        setLoadingTx(true);
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) return;
          const token = await user.getIdToken();
          const res = await fetch('/api/zakat-payments', { headers: { Authorization: `Bearer ${token}` } });
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

  // LAZ options from data
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

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredTx.map((tx) => tx.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };

  // Forward to LAZ (not used in main flow, but kept for future)
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
      const res = await fetch('/api/zakat-payments', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data || []);
      }
      setModalTx(null);
    } catch {}
  };

  // CSR Form Submission
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
          photos: csrForm.photos,
          report: csrForm.report
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCsrActivities([{ id: data.id, ...csrForm, amount: Number(csrForm.amount) }, ...csrActivities]);
        setShowCsrForm(false);
        setCsrForm({ title: '', amount: '', date: '', photos: [], report: '' });
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

  // UI Elements
  const handleExport = () => {
    // Placeholder for export functionality
    alert("Export functionality not yet implemented.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex">
      <Sidebar active="Zakat" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar userName={userData?.name || "Zakat Manager"} userRole={userData?.role === 'manager' ? 'Manager' : userData?.role || 'Admin'} userPhoto={userData?.photo} loading={loadingUser} />
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
                <span className="text-emerald-600">☪</span>
                Distribusi Dana Sosial & Zakat
              </h1>
              <p className="text-gray-600">Kelola zakat profesi, infaq, sedekah, dan distribusi dana sosial secara otomatis dan transparan sesuai prinsip syariah.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition font-semibold">
                <FiDownload /> Export Excel
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl shadow hover:bg-teal-700 transition font-semibold">
                <FiDownload /> Export PDF
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {loadingAnalytics ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 flex flex-col items-center shadow-sm border border-gray-200 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-emerald-200 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-2 right-2 text-emerald-200 text-lg">☪</div>
                <div className="text-xs text-gray-500 mb-2 font-medium">Total Zakat</div>
                <div className="text-xl font-bold text-emerald-700">{formatCurrency(analytics.allocation?.zakat || 0)}</div>
                <div className="text-xs text-emerald-600 mt-1">Zakat Profesi</div>
              </div>
              <div className="bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-teal-200 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-2 right-2 text-teal-200 text-lg">🤲</div>
                <div className="text-xs text-gray-500 mb-2 font-medium">Total Infaq</div>
                <div className="text-xl font-bold text-teal-700">{formatCurrency(analytics.allocation?.infaq || 0)}</div>
                <div className="text-xs text-teal-600 mt-1">Dana Infaq</div>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-amber-200 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-2 right-2 text-amber-200 text-lg">💝</div>
                <div className="text-xs text-gray-500 mb-2 font-medium">Total Sedekah</div>
                <div className="text-xl font-bold text-amber-700">{formatCurrency(analytics.allocation?.sedekah || 0)}</div>
                <div className="text-xs text-amber-600 mt-1">Dana Sedekah</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-green-200 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-2 right-2 text-green-200 text-lg">✅</div>
                <div className="text-xs text-gray-500 mb-2 font-medium">Didistribusikan</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(analytics.distributed || 0)}</div>
                <div className="text-xs text-green-600 mt-1">Sudah Disalurkan</div>
              </div>
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-6 flex flex-col items-center shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-2 right-2 text-slate-200 text-lg">💰</div>
                <div className="text-xs text-gray-500 mb-2 font-medium">Saldo</div>
                <div className="text-xl font-bold text-slate-700">{formatCurrency(analytics.balance || 0)}</div>
                <div className="text-xs text-slate-600 mt-1">Belum Disalurkan</div>
              </div>
            </div>
          ) : null}

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Analytics & Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow border border-emerald-100">
              <div className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <span className="text-emerald-600">📊</span>
                Trend Distribusi Bulanan
              </div>
              <div className="text-xs text-gray-500 mb-2">"Dan apa saja yang kamu nafkahkan, maka Allah akan menggantinya" - QS. Saba': 39</div>
              <Bar data={monthlyData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={120} />
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow border border-teal-100">
              <div className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <span className="text-teal-600">🏛️</span>
                Distribusi per LAZ
              </div>
              <div className="text-xs text-gray-500 mb-2">"Sesungguhnya zakat itu hanyalah untuk orang-orang fakir..." - QS. At-Taubah: 60</div>
              <Pie data={lazPieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow border border-amber-100">
              <div className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <span className="text-amber-600">⚖️</span>
                Alokasi Dana
              </div>
              <div className="text-xs text-gray-500 mb-2">"Perumpamaan orang yang menafkahkan hartanya di jalan Allah..." - QS. Al-Baqarah: 261</div>
              <Pie data={allocationPieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>

          {/* Add section dividers */}
          <hr className="my-8 border-t-2 border-dashed border-gray-200" />

          {/* Filter/Search Controls */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-wrap gap-3 items-center border border-emerald-100">
            <div className="flex items-center gap-2">
              <FiSearch className="text-emerald-500" />
              <input type="text" placeholder="Cari transaksi, penerima, jenis..." className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-emerald-500" />
              <select className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="">Semua Jenis</option>
                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={lazFilter} onChange={e => setLazFilter(e.target.value)}>
                <option value="">Semua LAZ</option>
                {lazOptionsFromData.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Semua Status</option>
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">Dari</span>
              <input type="date" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span className="text-gray-500 text-xs">s/d</span>
              <input type="date" className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={dateTo} onChange={e => setDateTo(e.target.value)} />
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
          <div className="bg-white rounded-xl shadow-md overflow-x-auto mb-10 border border-emerald-100">
            <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-emerald-600">📋</span>
                Daftar Transaksi Zakat & Sedekah
              </h3>
              <p className="text-sm text-gray-600 mt-1">"Dan apa saja yang kamu nafkahkan atau apa saja yang kamu nazarkan, maka sesungguhnya Allah mengetahuinya" - QS. Al-Baqarah: 270</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-emerald-100 bg-emerald-50">
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
                  <tr key={tx.id} className="border-b border-emerald-50 hover:bg-emerald-50/60 transition">
                    {userData?.role === 'manager' && (
                      <td className="px-2 py-3 text-center">
                        {tx.status === 'Pending' && <input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={e => handleSelectOne(tx.id, e.target.checked)} />}
                      </td>
                    )}
                    <td className="px-4 py-3">{tx.date}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {tx.type === 'Zakat Profesi' && <span className="text-emerald-600">☪</span>}
                        {tx.type === 'Infaq' && <span className="text-teal-600">🤲</span>}
                        {tx.type === 'Sedekah' && <span className="text-amber-600">💝</span>}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3">{tx.laz}</td>
                    <td className="px-4 py-3 text-center">
                      {tx.status === "Distributed" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                          <FiCheckCircle className="text-green-500" /> Didistribusikan
                        </span>
                      ) : tx.zakatPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                          <FiCheckCircle className="text-blue-500" /> Sudah Dibayar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                          <FiClock className="text-amber-500" /> Menunggu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1 transition" onClick={() => setModalTx(tx)}>
                        <FiEye /> Detail
                      </button>
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
                <div className="mb-2 text-gray-600">Bukti Transfer: {modalTx.proof ? (
                  modalTx.proof.startsWith('data:image') ? (
                    <img src={modalTx.proof} alt="Bukti Transfer Preview" className="max-h-32 mt-2 rounded" />
                  ) : (
                    <span className="text-xs text-gray-500 mt-1">File uploaded</span>
                  )
                ) : (
                  <span className="text-gray-400">Belum ada</span>
                )}</div>
                <div className="mb-2 text-gray-600">Laporan Penyaluran: {modalTx.report ? (
                  <span className="inline-block text-green-700 font-medium">{modalTx.report}</span>
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
                {userData?.role === 'hr-keuangan' && modalTx.status !== 'Distributed' ? (
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
                    // Refetch transactions and update table and modal
                    setLoadingTx(true);
                    const res = await fetch('/api/zakat-payments', { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) {
                      const data = await res.json();
                      setTransactions(data.data || []);
                      // Update modalTx with the latest data from the refreshed list
                      const updatedTx = (data.data || []).find((tx: any) => tx.id === modalTx.id);
                      if (updatedTx) setModalTx(updatedTx);
                      else setModalTx(null); // fallback: close modal if not found
                    }
                    setLoadingTx(false);
                  }}>
                    <label className="text-sm font-bold text-gray-700">Penerima</label>
                    <input type="text" className="px-2 py-1 border rounded" value={modalTx.beneficiary || ''} onChange={e => setModalTx({ ...modalTx, beneficiary: e.target.value })} />
                    <label className="text-sm font-bold text-gray-700">Bukti Transfer (Image/PDF)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImage(file);
                      const base64 = await fileToBase64(compressed);
                      setModalTx({ ...modalTx, proof: base64 });
                    }} />
                    {modalTx.proof && (
                      modalTx.proof.startsWith('data:image') ? (
                        <img src={modalTx.proof} alt="Bukti Transfer Preview" className="max-h-32 mt-2 rounded" />
                      ) : (
                        <span className="text-xs text-gray-500 mt-1">File uploaded</span>
                      )
                    )}
                    <label className="text-sm font-bold text-gray-700">Laporan Penyaluran (Image/PDF)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const compressed = await compressImage(file);
                      const base64 = await fileToBase64(compressed);
                      setModalTx({ ...modalTx, report: base64 });
                    }} />
                    {modalTx.report && (
                      modalTx.report.startsWith('data:image') ? (
                        <img src={modalTx.report} alt="Laporan Penyaluran Preview" className="max-h-32 mt-2 rounded" />
                      ) : (
                        <span className="text-xs text-gray-500 mt-1">File uploaded</span>
                      )
                    )}
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 mt-2">
                      <FiCheck /> Distribusikan
                    </button>
                  </form>
                ) : null}
                {modalTx.status === 'Distributed' && (
                  <div className="mt-4">
                    <div className="mb-2 text-green-700 font-semibold flex items-center gap-2"><FiCheckCircle /> Status: Telah Didistribusikan</div>
                    <div className="mb-2 text-gray-600">Penerima: <b>{modalTx.beneficiary}</b></div>
                    <div className="mb-2 text-gray-600">Bukti Transfer: {modalTx.proof ? (
                      modalTx.proof.startsWith('data:image') ? (
                        <img src={modalTx.proof} alt="Bukti Transfer" className="max-h-32 mt-2 rounded" />
                      ) : modalTx.proof.startsWith('data:application/pdf') ? (
                        <a href={modalTx.proof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                          <FiFileText /> Lihat File
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500 mt-1">File uploaded</span>
                      )
                    ) : (
                      <span className="text-gray-400">Belum ada</span>
                    )}</div>
                    <div className="mb-2 text-gray-600">Laporan Penyaluran: {modalTx.report ? (
                      modalTx.report.startsWith('data:image') ? (
                        <img src={modalTx.report} alt="Laporan Penyaluran" className="max-h-32 mt-2 rounded" />
                      ) : modalTx.report.startsWith('data:application/pdf') ? (
                        <a href={modalTx.report} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                          <FiFileText /> Lihat File
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500 mt-1">File uploaded</span>
                      )
                    ) : (
                      <span className="text-gray-400">Belum ada</span>
                    )}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CSR Dashboard */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center gap-3 mb-3">
                <FiHeart className="text-yellow-300 text-xl" />
                <h2 className="text-xl font-bold">Dashboard CSR & Kegiatan Sosial</h2>
              </div>
              <div className="text-sm opacity-90 mb-2">
                "Barangsiapa yang meringankan kesulitan seorang muslim di dunia, Allah akan meringankan kesulitannya di akhirat" - HR. Muslim
              </div>
              <button onClick={() => setShowCsrForm((v) => !v)} className="px-4 py-2 bg-white text-emerald-600 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">
                {showCsrForm ? 'Tutup Form' : 'Tambah Kegiatan'}
              </button>
            </div>
            {showCsrForm && (
              <form onSubmit={handleCsrFormSubmit} className="bg-white rounded-xl shadow-md p-5 mb-6 flex flex-col gap-3 border border-emerald-100">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-emerald-600">📝</span>
                    Form Kegiatan Sosial
                  </h3>
                  <p className="text-sm text-gray-600">"Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia" - HR. Ahmad</p>
                </div>
                <div className="flex gap-3">
                  <input type="text" className="flex-1 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Judul Kegiatan" value={csrForm.title} onChange={e => setCsrForm(f => ({ ...f, title: e.target.value }))} required />
                  <input type="number" className="w-32 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Nominal" value={csrForm.amount} onChange={e => setCsrForm(f => ({ ...f, amount: e.target.value }))} required />
                  <input type="date" className="w-40 px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" value={csrForm.date} onChange={e => setCsrForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>📸</span>
                    Upload Foto Kegiatan
                    {imageProcessing && <span className="text-emerald-600 text-sm">(Memproses...)</span>}
                  </label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    disabled={imageProcessing}
                    className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      
                      // Validate each file
                      const validFiles = files.filter(validateImageFile);
                      if (validFiles.length !== files.length) {
                        // Some files were invalid, clear the input
                        e.target.value = '';
                        return;
                      }
                      
                      try {
                        setImageProcessing(true);
                        const base64Promises = validFiles.map(async (file) => {
                          const compressed = await compressImage(file);
                          return await fileToBase64(compressed);
                        });
                        const base64Images = await Promise.all(base64Promises);
                        setCsrForm(f => ({ ...f, photos: [...f.photos, ...base64Images] }));
                      } catch (error) {
                        alert('Terjadi kesalahan saat memproses gambar. Silakan coba lagi.');
                        console.error('Image processing error:', error);
                      } finally {
                        setImageProcessing(false);
                      }
                      
                      // Clear the input for next upload
                      e.target.value = '';
                    }}
                  />
                  {csrForm.photos.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>📸</span>
                        Preview Foto ({csrForm.photos.length} foto)
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {csrForm.photos.map((photo, idx) => (
                          <div key={idx} className="relative">
                            <img src={photo} alt={`Preview ${idx + 1}`} className="w-32 h-32 object-cover rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" />
                            <button
                              type="button"
                              onClick={() => setCsrForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <textarea className="px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Laporan / Keterangan" value={csrForm.report} onChange={e => setCsrForm(f => ({ ...f, report: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition" onClick={() => setShowCsrForm(false)} disabled={csrFormLoading}>Batal</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold" disabled={csrFormLoading}>
                    {csrFormLoading ? 'Menyimpan...' : 'Simpan Kegiatan'}
                  </button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {csrActivities.map((act) => (
                <div key={act.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow border border-emerald-100 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-emerald-200 text-lg">🤲</div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200">{act.date}</span>
                    <span className="font-bold text-gray-800">{act.title}</span>
                  </div>
                  <div className="text-gray-600 text-sm mb-3">
                    Dana: <b className="text-emerald-600">{formatCurrency(act.amount)}</b>
                  </div>
                  {(act.photos || []).length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span>📸</span>
                        Dokumentasi ({act.photos.length} foto)
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {(act.photos || []).map((src: string, idx: number) => (
                                                  <img 
                          key={idx} 
                          src={src} 
                          alt="Dokumentasi" 
                          className="w-28 h-28 object-cover rounded-lg border border-emerald-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
                          onClick={() => setSelectedImage(src)}
                        />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-gray-700 text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-100" dangerouslySetInnerHTML={{ __html: act.report }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ×
            </button>
            <img 
              src={selectedImage} 
              alt="Full size image" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
