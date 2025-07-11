"use client"

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FiBookOpen, FiFeather, FiCheckCircle, FiHeart, FiStar } from "react-icons/fi";

// Dashboard Card Component (reuse your Card, CardHeader, CardContent, etc.)
// ... (reuse your existing Card, CardHeader, CardContent, CardTitle, Badge, etc.) ...

export default function MitraDashboard() {
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined);
  const [mitraInfo, setMitraInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const idToken = await user.getIdToken();
        // Fetch mitra info
        const userRes = await fetch(`/api/user`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!userRes.ok) throw new Error("Gagal memuat data user: " + (await userRes.text()));
        const userData = await userRes.json();
        setUserName(userData.name || "");
        setUserRole(userData.role || "");
        setUserPhoto(userData.photo);
        setMitraInfo(userData);
        // Fetch transactions
        const txRes = await fetch(`/api/transactions`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!txRes.ok) throw new Error("Gagal memuat data transaksi: " + (await txRes.text()));
        const txData = await txRes.json();
        setTransactions(txData);
      } catch (err: any) {
        setError("Gagal memuat data mitra/transactions: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
  return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#E6FFF4] via-[#F9F6F0] to-[#F6F8FA]">
        <img
          src="/zafra.svg"
          alt="Zafra Logo"
          className="w-24 h-24 mb-6 animate-fade"
          aria-label="Memuat..."
        />
        <div className="text-[#00C570] text-lg font-semibold animate-pulse">Memuat data mitra...</div>
        <style jsx global>{`
          @keyframes fade {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          .animate-fade {
            animation: fade 1.8s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }
  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-600 text-lg">{error}</div>;
  }

  // Aggregate transaction data (income/expense based)
  const totalTransactions = transactions.length;
  const totalIncome = transactions.filter(tx => tx.type === "income").reduce((sum, tx) => sum + (Number(tx.nominal) || 0), 0);
  const totalExpense = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + (Number(tx.nominal) || 0), 0);
  const saldo = totalIncome - totalExpense;
  // AI Syariah status counts
  const halalCount = transactions.filter(tx => tx.aiStatus === "Halal").length;
  const haramCount = transactions.filter(tx => tx.aiStatus === "Haram").length;
  const syubhatCount = transactions.filter(tx => tx.aiStatus === "Syubhat").length;

  // Helper to format numbers as 'jt' or 'M' for summary
  function formatRupiahShort(amount: number) {
    if (amount >= 1_000_000_000) {
      return (amount / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + ' M';
    } else if (amount >= 1_000_000) {
      return (amount / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + ' jt';
    } else {
      return 'Rp ' + amount.toLocaleString("id-ID");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6FFF4] via-[#F9F6F0] to-[#F6F8FA] flex">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <Topbar userName={userName} userRole={userRole} userPhoto={userPhoto} />
        <main className="px-6 md:px-12 py-8 max-w-7xl mx-auto">
          {/* Quranic Verse Block */}
          <div className="mb-10 flex justify-center">
            <div className="w-full md:w-3/4 bg-white rounded-2xl border border-[#00C570]/20 shadow flex items-center gap-4 p-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#E6FFF4]">
                <FiBookOpen className="text-[#00C570] text-2xl" />
              </div>
              <div className="flex-1 text-center">
                <div className="text-[#00C570] font-bold text-lg mb-1">"Dan Allah menjadikan jual beli itu halal dan riba itu haram."</div>
                <div className="text-gray-600 text-base italic">(QS. Al-Baqarah: 275)</div>
              </div>
            </div>
          </div>

          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow border border-[#E6FFF4] flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[#00C570] mb-3 flex items-center gap-2"><FiFeather className="text-[#00C570]" /> Informasi Mitra</h2>
              <div className="flex items-center gap-6">
                {userPhoto ? (
                  <img src={userPhoto} alt="Mitra" className="w-20 h-20 rounded-full object-cover border-2 border-[#00C570]" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#00C570]/10 flex items-center justify-center text-3xl text-[#00C570] font-bold">
                    {userName?.charAt(0) || "M"}
                </div>
                )}
                <div>
                  <div className="font-bold text-xl text-gray-900">{mitraInfo?.mitra?.namaMitra || userName}</div>
                  <div className="text-base text-gray-500">{mitraInfo?.email}</div>
                  <div className="text-xs text-gray-400 mt-1">{mitraInfo?.mitra?.alamatMitra && `Alamat: ${mitraInfo.mitra.alamatMitra}`}</div>
                  <div className="text-xs text-gray-400 mt-1">{mitraInfo?.mitra?.detailBisnis && `Bisnis: ${mitraInfo.mitra.detailBisnis}`}</div>
                  <div className="text-xs text-gray-400 mt-1">{mitraInfo?.mitra?.jenisUsaha && `Jenis Usaha: ${mitraInfo.mitra.jenisUsaha}`}</div>
                </div>
                </div>
                </div>
            {/* Transaction & AI Syariah Summary Card */}
            <div className="bg-white rounded-2xl shadow border-t-4 border-[#00C570] rounded-t-2xl flex flex-col gap-2 overflow-hidden p-0">
              <div className="p-8">
                <h2 className="text-lg font-bold text-[#00C570] mb-6 flex items-center gap-2"><FiStar className="text-yellow-400" /> Ringkasan Transaksi & AI Syariah</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-gray-900">{totalTransactions}</span>
                    <span className="text-sm text-gray-500 mt-1">Total Transaksi</span>
          </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-green-600">{formatRupiahShort(totalIncome)}</span>
                    <span className="text-sm text-green-600 mt-1">Total Pemasukan</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-red-600">{formatRupiahShort(totalExpense)}</span>
                    <span className="text-sm text-red-600 mt-1">Total Pengeluaran</span>
                            </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-[#00C570]">{formatRupiahShort(saldo)}</span>
                    <span className="text-sm text-[#00C570] mt-1">Saldo</span>
                      </div>
                    </div>
                <div className="grid grid-cols-3 gap-8 mb-6">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-green-600">{halalCount}</span>
                    <span className="text-xs text-green-600 mt-1">Halal (AI)</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-red-600">{haramCount}</span>
                    <span className="text-xs text-red-600 mt-1">Haram (AI)</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-yellow-600">{syubhatCount}</span>
                    <span className="text-xs text-yellow-600 mt-1">Syubhat (AI)</span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 flex items-center gap-2 justify-center">
                  <FiBookOpen className="text-[#00C570]" />
                  <span>"Jujurlah dalam bertransaksi, karena kejujuran membawa keberkahan." (HR. Bukhari)</span>
                </div>
              </div>
                      </div>
                    </div>

          {/* Recent Transactions Table */}
          <div className="bg-white rounded-2xl shadow border border-[#E6FFF4] p-8 mb-25">
            <h2 className="text-xl font-bold text-[#00C570] mb-6">Transaksi Terbaru</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-[#E6FFF4] text-[#00C570]">
                    <th className="px-6 py-3 text-left font-bold">Tanggal</th>
                    <th className="px-6 py-3 text-left font-bold">Deskripsi</th>
                    <th className="px-6 py-3 text-left font-bold">Kategori</th>
                    <th className="px-6 py-3 text-left font-bold">Nominal</th>
                    <th className="px-6 py-3 text-left font-bold">Tipe</th>
                    <th className="px-6 py-3 text-left font-bold">AI Syariah</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map(tx => (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-[#E6FFF4] transition">
                      <td className="px-6 py-3">{tx.date}</td>
                      <td className="px-6 py-3">{tx.description}</td>
                      <td className="px-6 py-3">{tx.category}</td>
                      <td className={`px-6 py-3 font-bold ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>{tx.type === "income" ? "+" : "-"} Rp {Number(tx.nominal).toLocaleString("id-ID")}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {tx.type === "income" ? <FiCheckCircle className="mr-1" /> : <FiHeart className="mr-1" />}
                          {tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {tx.aiStatus ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${tx.aiStatus === "Halal" ? "bg-green-100 text-green-700" : tx.aiStatus === "Haram" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {tx.aiStatus === "Halal" ? <FiCheckCircle className="mr-1" /> : tx.aiStatus === "Haram" ? <FiHeart className="mr-1" /> : <FiStar className="mr-1" />}
                            {tx.aiStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-12 text-lg">Belum ada transaksi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}