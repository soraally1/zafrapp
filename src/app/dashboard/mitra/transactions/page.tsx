"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseApi";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FiBookOpen, FiFeather, FiCheckCircle, FiFileText, FiPlus, FiStar, FiHeart } from "react-icons/fi";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";

const CATEGORY_OPTIONS = [
  "ZIS",
  "Pendapatan",
  "Beban Pokok",
  "Pendapatan Lain",
  "Beban Operasional",
  "Aset Tetap",
  "Pengeluaran lain",
];

const TYPE_OPTIONS = [
  { label: "Pemasukan", value: "income" },
  { label: "Pengeluaran", value: "expense" },
];


export default function TransactionPage() {
  const [form, setForm] = useState({
    date: "",
    description: "",
    category: CATEGORY_OPTIONS[0],
    nominal: "",
    type: TYPE_OPTIONS[0].value,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userUid, setUserUid] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        setUserUid(user.uid);
        try {
          const token = await user.getIdToken();
          // Fetch user profile from API
          const res = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          let profile = null;
          if (res.ok) profile = await res.json();
          setUserName(profile?.name || "");
          setUserRole(profile?.role || "");
          setUserPhoto(profile?.photo);
          // Fetch transactions from API
          const txRes = await fetch("/api/transactions", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (txRes.ok) {
            const txs = await txRes.json();
            setTransactions(txs);
          }
        } catch {
          setUserName("");
          setUserRole("");
          setUserPhoto(undefined);
        }
      } else {
        setUserUid(null);
        setUserName("");
        setUserRole("");
        setUserPhoto(undefined);
        setTransactions([]);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loadingUser && userRole && userRole !== "umkm-amil") {
      router.push("/login");
    }
  }, [loadingUser, userRole, router]);

  if (loadingUser || (!userRole)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      if (!form.date || !form.description || !form.nominal) {
        throw new Error("Semua field wajib diisi.");
      }
      if (isNaN(Number(form.nominal)) || form.nominal === "") {
        throw new Error("Nominal harus berupa angka.");
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to submit a transaction.');
      }
      const token = await user.getIdToken();

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          nominal: Number(form.nominal)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menambahkan transaksi');
      }

      const newTransaction = await response.json();
      setTransactions([newTransaction, ...transactions]);
      setForm({ date: "", description: "", category: CATEGORY_OPTIONS[0], nominal: "", type: TYPE_OPTIONS[0].value });
      setToast({ message: "Transaksi berhasil ditambahkan!", type: "success" });
      setTimeout(() => setToast(null), 3000);

    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const totalIncome = transactions.filter(tx => tx.type === "income").reduce((sum, tx) => sum + (Number(tx.nominal) || 0), 0);
  const totalExpense = transactions.filter(tx => tx.type === "expense").reduce((sum, tx) => sum + (Number(tx.nominal) || 0), 0);
  const totalSaldo = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6FFF4] via-[#F9F6F0] to-[#F6F8FA] flex">
      <Sidebar active="Transactions" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar userName={userName} userRole={userRole} userPhoto={userPhoto} loading={false} />
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
          {/* Quranic Verse Block */}
          <div className="mb-8 bg-gradient-to-r from-[#E6FFF4] to-[#F9F6F0] rounded-2xl border border-[#00C570]/20 shadow flex items-center gap-4 p-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#00C570]/10">
              <FiBookOpen className="text-[#00C570] text-2xl" />
            </div>
            <div>
              <div className="text-[#00C570] font-bold text-lg mb-1">"Dan Allah menjadikan jual beli itu halal dan riba itu haram."</div>
              <div className="text-gray-600 text-sm italic">(QS. Al-Baqarah: 275)</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#00C570] mb-2 flex items-center gap-2">
              <FiFeather className="text-[#00C570]" /> Transaksi Syariah
            </h1>
            <p className="text-gray-700">Catat pemasukan dan pengeluaran bisnismu sesuai prinsip syariah.</p>
          </div>

          {/* Summary Card */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-[#00C570]/10">
              <span className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiStar className="text-yellow-400" /> Total Saldo</span>
              <span className="text-2xl font-bold text-[#00C570]">Rp {totalSaldo.toLocaleString("id-ID")}</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-green-200">
              <span className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiCheckCircle className="text-green-400" /> Total Pemasukan</span>
              <span className="text-2xl font-bold text-green-600">Rp {totalIncome.toLocaleString("id-ID")}</span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-red-200">
              <span className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FiHeart className="text-red-400" /> Total Pengeluaran</span>
              <span className="text-2xl font-bold text-red-600">Rp {totalExpense.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {toast && (
            <div className={`fixed top-6 right-6 z-[100] px-4 py-2 rounded-xl shadow-lg text-white font-semibold flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-fadeIn`}>
              <FiCheckCircle /> {toast.message}
            </div>
          )}

          <div className="bg-white rounded-2xl p-0 w-full relative animate-fadeIn shadow-sm mb-8 border border-[#00C570]/10 overflow-hidden">
            {/* Decorative top border */}
            <div className="h-2 bg-gradient-to-r from-[#00C570] via-[#E6FFF4] to-[#00C570] w-full" />
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#00C570]">
                <FiFeather className="text-[#00C570]" /> Form Transaksi Syariah
              </h2>
            {formError && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{formError}</div>}
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4">
              <div>
                    <label className="block text-base font-semibold text-[#00C570] mb-2" htmlFor="tanggal-transaksi">Tanggal Transaksi</label>
                    <input id="tanggal-transaksi" type="date" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00C570]/40  text-slate-900 focus:outline-none border-gray-200 focus:border-transparent transition shadow-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                    <span className="text-xs text-gray-400">Format: yyyy-mm-dd</span>
              </div>
              <div>
                    <label className="block text-base font-semibold text-[#00C570] mb-2" htmlFor="kategori-transaksi">Kategori Transaksi</label>
                    <select id="kategori-transaksi" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00C570]/40 focus:outline-none  text-slate-900 border-gray-200 focus:border-transparent transition shadow-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                    <label className="block text-base font-semibold text-[#00C570] mb-2" htmlFor="tipe-transaksi">Tipe Transaksi</label>
                    <select id="tipe-transaksi" className="w-full px-4 py-3 border  text-slate-900 rounded-xl focus:ring-2 focus:ring-[#00C570]/40 focus:outline-none border-gray-200 focus:border-transparent transition shadow-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
              </div>
                <div className="flex flex-col gap-4">
              <div>
                    <label className="block text-base font-semibold text-[#00C570] mb-2" htmlFor="nominal">Nominal</label>
                    <input id="nominal" type="number" placeholder="Contoh: 50000" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00C570]/40 focus:outline-none border-gray-200 text-slate-900 focus:border-transparent transition shadow-sm placeholder:text-black" value={form.nominal} onChange={e => setForm(f => ({ ...f, nominal: e.target.value }))} required />
                    <span className="text-xs text-gray-400">Masukkan angka tanpa titik/koma</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-base font-semibold text-[#00C570] mb-2" htmlFor="deskripsi">Deskripsi</label>
                    <textarea id="deskripsi" placeholder="Contoh: Pembelian bahan baku untuk produksi" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00C570]/40 focus:outline-none border-gray-200  text-slate-900 focus:border-transparent transition shadow-sm placeholder:text-black min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3}></textarea>
                    <span className="text-xs text-gray-400 mt-1">Jelaskan transaksi secara singkat dan jelas</span>
              </div>
                  <div className="flex justify-end mt-2">
                    <button type="submit" className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#00C570] to-[#00A86B] text-white rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:from-[#00A86B] hover:to-[#00C570] transition text-base text-center justify-center" disabled={submitting}>
                  <FiPlus />
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
                  </div>
              </div>
            </form>
              <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                <FiBookOpen className="text-[#00C570]" />
                <span>"Jujurlah dalam bertransaksi, karena kejujuran membawa keberkahan." (HR. Bukhari)</span>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-white rounded-2xl shadow p-6 border border-[#00C570]/10">
            <h2 className="text-lg font-bold text-[#00C570] mb-4 flex items-center gap-2"><FiFileText className="text-blue-600" /> Daftar Transaksi</h2>
            {transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <FiFileText className="mx-auto text-4xl mb-2" />
                <p className="font-semibold">Belum ada transaksi</p>
                <p className="text-sm">Transaksi yang kamu input akan muncul di sini.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <li key={tx.id} className="py-4 flex items-center justify-between hover:bg-[#E6FFF4] rounded-lg px-2 -mx-2 transition-colors border-l-4 border-[#00C570]/10">
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {tx.type === "income" ? <FiCheckCircle className="mr-1" /> : <FiHeart className="mr-1" />}
                        {tx.type === "income" ? "+ Pemasukan" : "- Pengeluaran"}
                      </span>
                      <div>
                        <div className="font-semibold text-black">{tx.description}</div>
                        <div className="text-xs text-gray-500">Kategori: {tx.category} | Tanggal: {tx.date}</div>
                      </div>
                    </div>
                    <div className={`font-bold text-lg ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "income" ? "+" : "-"} Rp {Number(tx.nominal).toLocaleString("id-ID")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
