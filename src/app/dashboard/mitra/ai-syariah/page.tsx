"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseApi';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import Sidebar from '@/app/components/Sidebar';
import Topbar from '@/app/components/Topbar';
import { FiClock, FiCheckCircle, FiChevronRight, FiFileText, FiChevronDown } from 'react-icons/fi';
import VerificationModal from '@/app/components/VerificationModal';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

interface SyariahTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  nominal: number;
  shariaStatus: 'pending' | 'verified';
  aiStatus?: string;
  aiExplanation?: string;
  userId?: string;
  type?: string;
  [key: string]: any;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AISyariahPage() {

  const [transactions, setTransactions] = useState<SyariahTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<SyariahTransaction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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


  useEffect(() => {
    const q = query(collection(db, "transactionReports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reports: SyariahTransaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
      
        if (!userUid || data.userId !== userUid) return;
        reports.push({
          id: doc.id,
          date: data.date,
          description: data.description,
          category: data.category,
          nominal: Number(data.nominal) || 0,
          shariaStatus: data.shariaStatus || 'pending',
          aiStatus: data.aiStatus,
          aiExplanation: data.aiExplanation,
          userId: data.userId,
        });
      });
      setTransactions(reports);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userUid]);

  // Only return after all hooks
  if (loadingUser || (!userRole)) {
    return null;
  }

  const handleSaveVerification = async (status: string, explanation: string) => {
    if (!selectedTransaction) return;
    const transactionRef = doc(db, 'transactionReports', selectedTransaction.id);
    try {
      await updateDoc(transactionRef, {
        shariaStatus: 'verified',
        aiStatus: status,
        aiExplanation: explanation,
      });
    } catch (error) {
      console.error('Error saving verification:', error);
    }
  };

  const handleMulaiVerifikasi = (transaction: SyariahTransaction) => {
    setSelectedTransaction(transaction);
  };

  const handleItemClick = (tx: SyariahTransaction) => {
    if (tx.shariaStatus === 'pending') {
      handleMulaiVerifikasi(tx);
    } else {
      setExpandedId(expandedId === tx.id ? null : tx.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <Sidebar active="AI Syariah" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        {selectedTransaction && (
          <VerificationModal
            isOpen={!!selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onSave={handleSaveVerification}
            transaction={
              selectedTransaction
                ? {
                    ...selectedTransaction,
                    type:
                      selectedTransaction.type === "income" || selectedTransaction.type === "expense"
                        ? selectedTransaction.type
                        : "income",
                    shariaStatus:
                      ["Halal", "Haram", "Syubhat"].includes(String(selectedTransaction.shariaStatus))
                        ? (selectedTransaction.shariaStatus as "Halal" | "Haram" | "Syubhat")
                        : undefined,
                  }
                : null
            }
          />
        )}
        <Topbar userName={userName} userRole={userRole} userPhoto={userPhoto} loading={false} />
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Verifikasi AI Syariah</h1>
            <p className="text-black">Tinjau dan verifikasi status syariah untuk setiap transaksi.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Memuat transaksi...</p>
            ) : transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <FiFileText className="mx-auto text-4xl mb-2" />
                <p className="font-semibold">Belum ada transaksi</p>
                <p className="text-sm">Data transaksi akan muncul di sini setelah ditambahkan.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transactions.map(tx => (
                  <li key={tx.id}>
                    <div onClick={() => handleItemClick(tx)} className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        {tx.shariaStatus === 'pending' ? (
                          <FiClock className="text-2xl text-yellow-500" />
                        ) : (
                          <FiCheckCircle className="text-2xl text-green-600" />
                        )}
                        <div>
                          <p className="font-semibold text-black">{tx.description}</p>
                          <p className="text-xs text-gray-500">Kategori: {tx.category} | Nominal: Rp {tx.nominal.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      {tx.shariaStatus === 'pending' ? (
                        <div className="text-right">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Mulai Verifikasi</span>
                        </div>
                      ) : (
                        <FiChevronDown className={`text-gray-400 transition-transform ${expandedId === tx.id ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                    {expandedId === tx.id && (
                      <div className="p-4 bg-gray-50 rounded-b-lg mx-2 my-2 border-l-4 border-blue-500">
                        <h4 className="font-bold text-sm mb-2 text-gray-800">Hasil Verifikasi Tersimpan</h4>
                        <p className="text-sm mb-1 text-gray-700"><strong>Status:</strong> {tx.aiStatus}</p>
                        <p className="text-sm text-gray-700"><strong>Penjelasan:</strong> {tx.aiExplanation}</p>
                      </div>
                    )}
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
