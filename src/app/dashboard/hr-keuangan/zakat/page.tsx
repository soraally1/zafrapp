"use client";
import { useState, useMemo } from "react";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const mockSummary = {
  zakat: 12000000,
  infaq: 3500000,
  sedekah: 2000000,
  distributed: 15000000,
  balance: 2500000,
};

const mockTransactions = [
  {
    id: "TX001",
    type: "Zakat Profesi",
    amount: 5000000,
    date: "2024-06-01",
    status: "Pending",
    laz: "LAZ Dompet Dhuafa",
    proof: "/img/Log.svg",
    report: "Sudah diterima oleh LAZ.",
    beneficiary: "Dompet Dhuafa",
    history: [
      { action: "Created", by: "Admin", date: "2024-06-01" },
      { action: "Submitted for Approval", by: "Admin", date: "2024-06-01" },
    ],
  },
  {
    id: "TX002",
    type: "Infaq",
    amount: 1500000,
    date: "2024-06-05",
    status: "Pending",
    laz: "LAZ Rumah Zakat",
    proof: null,
    report: null,
    beneficiary: "Rumah Zakat",
    history: [
      { action: "Created", by: "Admin", date: "2024-06-05" },
    ],
  },
  {
    id: "TX003",
    type: "Sedekah",
    amount: 2000000,
    date: "2024-06-10",
    status: "Distributed",
    laz: "LAZ BAZNAS",
    proof: "/img/Log.svg",
    report: "Disalurkan untuk program beasiswa.",
    beneficiary: "BAZNAS",
    history: [
      { action: "Created", by: "Admin", date: "2024-06-10" },
      { action: "Approved", by: "Manager", date: "2024-06-11" },
      { action: "Distributed", by: "Admin", date: "2024-06-12" },
    ],
  },
];

const mockActivities = [
  {
    id: "ACT001",
    title: "Bantuan Pendidikan Anak Yatim",
    amount: 5000000,
    date: "2024-06-12",
    photos: ["/img/Log.svg", "/img/Log.svg"],
    report: "Dana disalurkan ke 20 anak yatim di Jakarta. <a href='https://example.com' target='_blank' class='text-blue-600 underline'>Lihat dokumentasi</a>",
  },
  {
    id: "ACT002",
    title: "Santunan Kesehatan Dhuafa",
    amount: 3000000,
    date: "2024-06-15",
    photos: ["/img/Log.svg"],
    report: "Bantuan kesehatan untuk 10 keluarga dhuafa.",
  },
];

const mockAuditLog = [
  { id: 1, action: "Login", by: "Admin", date: "2024-06-01 08:00" },
  { id: 2, action: "Submit Zakat", by: "Admin", date: "2024-06-01 09:00" },
  { id: 3, action: "Approve Zakat", by: "Manager", date: "2024-06-01 10:00" },
  { id: 4, action: "Upload Proof", by: "Admin", date: "2024-06-01 11:00" },
];

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
  // Role-based UI (mock: 'admin' or 'manager')
  const [role] = useState<'admin' | 'manager'>("manager");
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
  // Notifications (mock)
  const [notifications, setNotifications] = useState([
    { id: 1, message: "2 transaksi menunggu persetujuan", type: "info" },
    { id: 2, message: "1 distribusi belum upload bukti", type: "warning" },
  ]);
  // Proof/report upload
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [proofs, setProofs] = useState<{ [id: string]: string }>({});
  const [reports, setReports] = useState<{ [id: string]: string }>({});
  const [approvalNotes, setApprovalNotes] = useState<{ [id: string]: string }>({});

  // Filtering logic
  const filteredTx = useMemo(() => {
    return mockTransactions.filter((tx) => {
      if (typeFilter && tx.type !== typeFilter) return false;
      if (lazFilter && tx.laz !== lazFilter) return false;
      if (statusFilter && tx.status !== statusFilter) return false;
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      if (search && !(
        tx.id.toLowerCase().includes(search.toLowerCase()) ||
        tx.beneficiary.toLowerCase().includes(search.toLowerCase()) ||
        tx.type.toLowerCase().includes(search.toLowerCase())
      )) return false;
      return true;
    });
  }, [typeFilter, lazFilter, statusFilter, dateFrom, dateTo, search]);

  // Analytics data
  const monthlyData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
    datasets: [
      {
        label: "Dana Didistribusikan",
        data: [2000000, 3000000, 4000000, 3500000, 5000000, 6000000],
        backgroundColor: "#00C570",
        borderRadius: 8,
      },
    ],
  };
  const lazPieData = {
    labels: LAZ_OPTIONS,
    datasets: [
      {
        data: [7, 5, 3],
        backgroundColor: ["#3B82F6", "#22C55E", "#A78BFA"],
      },
    ],
  };
  const allocationPieData = {
    labels: ["Zakat", "Infaq", "Sedekah"],
    datasets: [
      {
        data: [mockSummary.zakat, mockSummary.infaq, mockSummary.sedekah],
        backgroundColor: ["#3B82F6", "#22C55E", "#FACC15"],
      },
    ],
  };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredTx.map((tx) => tx.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };
  const handleBulkApprove = () => {
    // Mock: approve all selected
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message: `${selectedIds.length} transaksi disetujui`, type: "success" },
    ]);
    setSelectedIds([]);
  };
  const handleBulkReject = () => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message: `${selectedIds.length} transaksi ditolak`, type: "error" },
    ]);
    setSelectedIds([]);
  };

  // Proof upload
  const handleProofUpload = (id: string, file: File) => {
    setUploadingId(id);
    setTimeout(() => {
      setProofs((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
      setUploadingId(null);
    }, 1200);
  };
  // Report submit
  const handleReportSubmit = (id: string, text: string) => {
    setReports((prev) => ({ ...prev, [id]: text }));
  };
  // Approval workflow
  const handleApprove = (id: string) => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message: `Transaksi ${id} disetujui`, type: "success" },
    ]);
    setModalTx(null);
  };
  const handleReject = (id: string) => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message: `Transaksi ${id} ditolak`, type: "error" },
    ]);
    setModalTx(null);
  };

  // Export/reporting (mock)
  const handleExport = () => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message: `Data diekspor ke Excel`, type: "info" },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <Sidebar active="Zakat" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar userName="Zakat Manager" userRole={role === 'manager' ? 'Manager' : 'Admin'} userPhoto={undefined} loading={false} />
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-4 space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow text-white font-semibold ${n.type === 'success' ? 'bg-green-600' : n.type === 'error' ? 'bg-red-600' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                  {n.type === 'success' && <FiCheckCircle />} {n.type === 'error' && <FiX />} {n.type === 'warning' && <FiAlertCircle />} {n.type === 'info' && <FiClock />} {n.message}
                </div>
              ))}
            </div>
          )}

          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Distribusi Dana Sosial & Zakat</h1>
              <p className="text-gray-600">Kelola zakat profesi, infaq, sedekah, dan distribusi dana sosial secara otomatis dan transparan.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-[#00C570] text-white rounded-xl shadow hover:bg-green-700 transition font-semibold"><FiDownload /> Export Excel</button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition font-semibold"><FiDownload /> Export PDF</button>
            </div>
          </div>

          {/* Analytics & Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
              <div className="font-semibold text-gray-700 mb-1">Trend Distribusi Bulanan</div>
              <Bar data={monthlyData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={120} />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
              <div className="font-semibold text-gray-700 mb-1">Distribusi per LAZ</div>
              <Pie data={lazPieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
              <div className="font-semibold text-gray-700 mb-1">Alokasi Dana</div>
              <Pie data={allocationPieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>

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
                {LAZ_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
          {role === 'manager' && filteredTx.some(tx => tx.status === 'Pending') && (
            <div className="mb-4 flex gap-2 items-center">
              <input type="checkbox" checked={selectedIds.length === filteredTx.filter(tx => tx.status === 'Pending').length} onChange={e => handleSelectAll(e.target.checked)} />
              <span className="text-sm">Pilih semua transaksi pending</span>
              <button onClick={handleBulkApprove} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">Setujui Semua</button>
              <button onClick={handleBulkReject} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">Tolak Semua</button>
            </div>
          )}

          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  {role === 'manager' && <th className="px-2 py-3 text-center"><input type="checkbox" checked={selectedIds.length === filteredTx.filter(tx => tx.status === 'Pending').length && filteredTx.filter(tx => tx.status === 'Pending').length > 0} onChange={e => handleSelectAll(e.target.checked)} /></th>}
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
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    {role === 'manager' && (
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
                {role === 'manager' && modalTx.status === 'Pending' && (
                  <div className="flex gap-2 mt-4">
                    <input type="text" placeholder="Catatan persetujuan (opsional)" className="px-2 py-1 border rounded flex-1" value={approvalNotes[modalTx.id] || ''} onChange={e => setApprovalNotes(prev => ({ ...prev, [modalTx.id]: e.target.value }))} />
                    <button onClick={() => handleApprove(modalTx.id)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"><FiCheck /> Setujui</button>
                    <button onClick={() => handleReject(modalTx.id)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"><FiX /> Tolak</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Log */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Audit Log</h2>
            <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-2 text-left font-medium">Aksi</th>
                    <th className="px-4 py-2 text-left font-medium">Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAuditLog.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50">
                      <td className="px-4 py-2">{log.date}</td>
                      <td className="px-4 py-2">{log.action}</td>
                      <td className="px-4 py-2">{log.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CSR Dashboard */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Dashboard CSR & Kegiatan Sosial</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockActivities.map((act) => (
                <div key={act.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-block px-2 py-1 rounded-full bg-[#E6FFF4] text-[#00C570] text-xs font-semibold">{act.date}</span>
                    <span className="font-bold text-gray-800">{act.title}</span>
                  </div>
                  <div className="text-gray-600 text-sm mb-2">Dana: <b className="text-[#00C570]">{formatCurrency(act.amount)}</b></div>
                  <div className="flex gap-2 mb-2">
                    {act.photos.map((src, idx) => (
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
