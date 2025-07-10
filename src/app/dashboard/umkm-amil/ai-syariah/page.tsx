"use client"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebaseApi"
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore"
import Sidebar from "@/app/components/Sidebar"
import Topbar from "@/app/components/Topbar"
import { FiClock, FiCheckCircle, FiFileText, FiChevronDown, FiStar } from "react-icons/fi"
import VerificationModal from "@/app/components/VerificationModal"

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  nominal: number
  shariaStatus: "pending" | "verified"
  aiStatus?: string
  aiExplanation?: string
  [key: string]: any
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AISyariahPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const q = query(collection(db, "transactionReports"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const reports: Transaction[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          reports.push({
            id: doc.id,
            date: data.date,
            description: data.description,
            category: data.category,
            nominal: Number(data.nominal) || 0,
            shariaStatus: data.shariaStatus || "pending",
            aiStatus: data.aiStatus,
            aiExplanation: data.aiExplanation,
          })
        })
        setTransactions(reports)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const handleSaveVerification = async (status: string, explanation: string) => {
    if (!selectedTransaction) return
    const transactionRef = doc(db, "transactionReports", selectedTransaction.id)
    try {
      await updateDoc(transactionRef, {
        shariaStatus: "verified",
        aiStatus: status,
        aiExplanation: explanation,
      })
    } catch (error) {
      console.error("Error saving verification:", error)
    }
  }

  const handleMulaiVerifikasi = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  const handleItemClick = (tx: Transaction) => {
    if (tx.shariaStatus === "pending") {
      handleMulaiVerifikasi(tx)
    } else {
      setExpandedId(expandedId === tx.id ? null : tx.id)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <style jsx>{`
        .islamic-pattern {
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(5, 150, 105, 0.1) 0%, transparent 50%);
        }
        
        .islamic-border {
          border-image: linear-gradient(45deg, #10b981, #059669, #047857) 1;
        }
        
        .verse-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%);
          border-left: 4px solid #10b981;
        }
        
        .transaction-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .pending-glow {
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }
        
        .verified-glow {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .floating {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <Sidebar active="AI Syariah" />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto islamic-pattern">
        {selectedTransaction && (
          <VerificationModal
            isOpen={!!selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onSave={handleSaveVerification}
            transaction={selectedTransaction}
          />
        )}
        <Topbar userName="UMKM Amil" userRole="Mitra" userPhoto={undefined} loading={false} />

        <div className="p-4 md:p-8 w-full">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl p-6 border-l-4 border-emerald-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">💎</span>
                </div>
                <div>
                  <p className="text-emerald-800 font-semibold mb-2">Hadits Rasulullah ﷺ</p>
                  <p className="text-emerald-700 text-sm leading-relaxed">
                    "Pedagang yang jujur dan terpercaya akan bersama para nabi, shiddiqin, dan syuhada"
                  </p>
                  <p className="text-emerald-600 text-xs mt-2">(HR. Tirmidzi)</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-100 to-emerald-100 rounded-2xl p-6 border-l-4 border-teal-500">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">⚖️</span>
                </div>
                <div>
                  <p className="text-teal-800 font-semibold mb-2">Prinsip Syariah</p>
                  <p className="text-teal-700 text-sm leading-relaxed">
                    "Keadilan dalam bermuamalah adalah fondasi ekonomi Islam yang berkah"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="transaction-card rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <FiFileText className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-800">Daftar Transaksi</h2>
                <p className="text-emerald-600 text-sm">Verifikasi sesuai prinsip syariah</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
                <p className="text-emerald-600">Memuat transaksi...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-emerald-400 py-16">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFileText className="text-4xl text-emerald-500" />
                </div>
                <p className="font-semibold text-lg text-emerald-600 mb-2">Belum ada transaksi</p>
                <p className="text-sm text-emerald-500">Data transaksi akan muncul di sini setelah ditambahkan.</p>
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg max-w-md mx-auto">
                  <p className="text-xs text-emerald-600 italic">
                    "Dan carilah pada apa yang telah dianugerahkan Allah kepadamu (kebahagiaan) negeri akhirat"
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">(QS. Al-Qashash: 77)</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`rounded-xl overflow-hidden transition-all duration-300 ${
                      tx.shariaStatus === "pending" ? "pending-glow" : "verified-glow"
                    }`}
                  >
                    <div
                      onClick={() => handleItemClick(tx)}
                      className={`p-6 flex items-center justify-between hover:bg-gradient-to-r transition-all duration-300 cursor-pointer ${
                        tx.shariaStatus === "pending"
                          ? "bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100"
                          : "bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            tx.shariaStatus === "pending"
                              ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                              : "bg-gradient-to-r from-emerald-400 to-teal-400"
                          }`}
                        >
                          {tx.shariaStatus === "pending" ? (
                            <FiClock className="text-2xl text-white" />
                          ) : (
                            <FiCheckCircle className="text-2xl text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-800 mb-1">{tx.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="text-emerald-700">
                              <strong>Kategori:</strong> {tx.category}
                            </span>
                            <span className="text-emerald-700">
                              <strong>Nominal:</strong> {formatCurrency(tx.nominal)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                tx.shariaStatus === "pending"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {tx.shariaStatus === "pending" ? "⏳ Menunggu Verifikasi" : "✅ Terverifikasi"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {tx.shariaStatus === "pending" ? (
                          <div className="text-right">
                            <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                              🔍 Mulai Verifikasi
                            </button>
                          </div>
                        ) : (
                          <FiChevronDown
                            className={`text-2xl text-emerald-600 transition-transform duration-300 ${
                              expandedId === tx.id ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </div>
                    </div>

                    {expandedId === tx.id && (
                      <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-6 border-t border-emerald-200">
                        <div className="bg-white rounded-xl p-6 shadow-inner">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                              <FiCheckCircle className="text-white" />
                            </div>
                            <h4 className="font-bold text-lg text-emerald-800">Hasil Verifikasi Tersimpan</h4>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-emerald-50 rounded-lg p-4">
                              <p className="text-sm font-semibold text-emerald-800 mb-2">Status Syariah:</p>
                              <p className="text-emerald-700 font-medium">{tx.aiStatus}</p>
                            </div>
                            <div className="bg-teal-50 rounded-lg p-4">
                              <p className="text-sm font-semibold text-teal-800 mb-2">Penjelasan Detail:</p>
                              <p className="text-teal-700 text-sm leading-relaxed">{tx.aiExplanation}</p>
                            </div>
                          </div>

                          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border-l-4 border-emerald-400">
                            <p className="text-xs text-emerald-700 italic">
                              "Hai orang-orang yang beriman, penuhilah akad-akad itu" (QS. Al-Maidah: 1)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Islamic Quote */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
              <p className="text-lg font-semibold mb-2">
                "Barangsiapa yang bermuamalah dengan jujur, maka Allah akan memberkahi usahanya"
              </p>
              <p className="text-emerald-100 text-sm">Mari bersama membangun ekonomi yang berkah dan sesuai syariah</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
