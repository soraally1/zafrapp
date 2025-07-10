"use client";
import { useState } from "react";
import { auth } from "@/lib/firebaseApi";
import { FiCheckCircle, FiFileText, FiPlus } from "react-icons/fi";
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


export default function TransactionPage() {
  const [form, setForm] = useState({
    date: "",
    description: "",
    category: CATEGORY_OPTIONS[0],
    nominal: "",
    
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
      setForm({ date: "", description: "", category: CATEGORY_OPTIONS[0], nominal: "" });
      setToast({ message: "Transaksi berhasil ditambahkan!", type: "success" });
      setTimeout(() => setToast(null), 3000);

    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <Sidebar active="Transactions" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        <Topbar userName="UMKM Amil" userRole="UMKM" userPhoto={undefined} loading={false} />
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Simulasi Transaksi</h1>
            <p className="text-black">Input transaksi baru untuk dicatat dalam sistem.</p>
          </div>

          {toast && (
            <div className={`fixed top-6 right-6 z-[100] px-4 py-2 rounded-xl shadow-lg text-white font-semibold flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-fadeIn`}>
              <FiCheckCircle /> {toast.message}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 w-full relative animate-fadeIn shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiFileText className="text-blue-600" /> Form Transaksi</h2>
            {formError && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-black mb-1">Tanggal Transaksi</label>
                <input type="date" className="w-full px-3 py-2 border rounded-xl" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-black mb-1">Kategori Transaksi</label>
                <select className="w-full px-3 py-2 border rounded-xl" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-black mb-1">Nominal</label>
                <input type="number" placeholder="Contoh: 50000" className="w-full px-3 py-2 border rounded-xl placeholder:text-black" value={form.nominal} onChange={e => setForm(f => ({ ...f, nominal: e.target.value }))} required />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-black mb-1">Deskripsi</label>
                <textarea placeholder="Contoh: Pembelian bahan baku untuk produksi" className="w-full px-3 py-2 border rounded-xl placeholder:text-black" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="submit" className="px-6 py-2 bg-[#00C570] text-white rounded-xl flex items-center gap-2 font-semibold hover:bg-green-700 transition" disabled={submitting}>
                  <FiPlus />
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
