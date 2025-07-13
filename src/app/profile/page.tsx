"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Sidebar from "../components/Sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { LiaMedalSolid, LiaClockSolid, LiaWalletSolid, LiaChartBarSolid, LiaUserSolid, LiaHomeSolid, LiaDonateSolid, LiaRobotSolid } from "react-icons/lia";
import { IoMdCamera } from "react-icons/io";
import { auth } from "@/lib/firebaseApi";
import { useRouter } from "next/navigation";


const mockStats = [
  { 
    id: "reports-stats",
    label: "Laporan Keuangan", 
    value: "12",
    subLabel: "Laporan dibuat bulan ini",
    icon: <LiaChartBarSolid size={24} className="text-[#00C570]" />
  },
  { 
    id: "tasks-stats",
    label: "Tugas Selesai", 
    value: "34",
    subLabel: "Tugas diselesaikan",
    icon: <LiaClockSolid size={24} className="text-[#00C570]" />
  },
  { 
    id: "contributions-stats",
    label: "Kontribusi", 
    value: "120",
    subLabel: "Poin kontribusi",
    icon: <LiaUserSolid size={24} className="text-[#00C570]" />
  },
];

function getRoleShortcuts(role: string) {
  if (role === "hr-keuangan") {
    return [
      { id: "payroll", label: "Payroll", icon: <LiaWalletSolid size={28} className="text-pink-400" />, href: "/dashboard/hr-keuangan/payroll" },
      { id: "reports", label: "Laporan", icon: <LiaChartBarSolid size={28} className="text-green-400" />, href: "/dashboard/hr-keuangan/reports" },
      { id: "zakat", label: "Zakat", icon: <LiaDonateSolid size={28} className="text-yellow-400" />, href: "/dashboard/hr-keuangan/zakat" },
      { id: "employees", label: "Karyawan", icon: <LiaUserSolid size={28} className="text-blue-400" />, href: "/dashboard/hr-keuangan/karyawan" },
      { id: "ai", label: "ZafraAI", icon: <LiaRobotSolid size={28} className="text-purple-400" />, href: "/dashboard/hr-keuangan/ai-hr" },
    ];
  }
  if (role === "karyawan") {
    return [
      { id: "payroll-slip", label: "Slip Gaji", icon: <LiaWalletSolid size={28} className="text-pink-400" />, href: "/dashboard/karyawan" },
      { id: "attendance", label: "Absensi", icon: <LiaClockSolid size={28} className="text-green-400" />, href: "/dashboard/karyawan" },
      { id: "leave", label: "Cuti", icon: <LiaMedalSolid size={28} className="text-yellow-400" />, href: "/dashboard/karyawan" },
      { id: "profile", label: "Profil", icon: <LiaUserSolid size={28} className="text-blue-400" />, href: "/profile" },
    ];
  }
  if (role === "umkm-amil") {
    return [
      { id: "transactions", label: "Transaksi", icon: <LiaWalletSolid size={28} className="text-pink-400" />, href: "/dashboard/mitra/transactions" },
      { id: "ai-syariah", label: "AI Syariah", icon: <LiaRobotSolid size={28} className="text-purple-400" />, href: "/dashboard/mitra/ai-syariah" },
      { id: "business-reports", label: "Laporan Bisnis", icon: <LiaChartBarSolid size={28} className="text-green-400" />, href: "/dashboard/mitra" },
      { id: "profile", label: "Profil", icon: <LiaUserSolid size={28} className="text-blue-400" />, href: "/profile" },
    ];
  }
  // fallback for unknown role
  return [
    { id: "profile", label: "Profil", icon: <LiaUserSolid size={28} className="text-blue-400" />, href: "/profile" },
  ];
}

function getRoleBadge(role: string) {
  if (role === "hr-keuangan") return <span className="px-2.5 py-1 rounded-full bg-[#E6FFF4] text-[#00C570] text-xs font-medium flex items-center gap-1"><LiaHomeSolid size={16} /> HR & KEUANGAN</span>;
  if (role === "karyawan") return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium flex items-center gap-1"><LiaUserSolid size={16} /> KARYAWAN</span>;
  if (role === "umkm-amil") return <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-medium flex items-center gap-1"><LiaUserSolid size={16} /> MITRA/UMKM</span>;
  return <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">Unknown</span>;
}

function getRoleFeatures(role: string) {
  if (role === "hr-keuangan") {
    return [
      { id: "payroll", label: "Payroll", icon: <LiaWalletSolid size={32} className="text-pink-400" />, desc: "Kelola dan proses gaji karyawan", href: "/dashboard/hr-keuangan/payroll" },
      { id: "reports", label: "Laporan Keuangan", icon: <LiaChartBarSolid size={32} className="text-green-400" />, desc: "Lihat dan ekspor laporan keuangan", href: "/dashboard/hr-keuangan/reports" },
      { id: "zakat", label: "Zakat", icon: <LiaDonateSolid size={32} className="text-yellow-400" />, desc: "Kelola zakat perusahaan", href: "/dashboard/hr-keuangan/zakat" },
      { id: "employees", label: "Karyawan", icon: <LiaUserSolid size={32} className="text-blue-400" />, desc: "Manajemen data karyawan", href: "/dashboard/hr-keuangan/karyawan" },
      { id: "ai", label: "ZafraAI", icon: <LiaRobotSolid size={32} className="text-purple-400" />, desc: "Asisten AI untuk HR & Keuangan", href: "/dashboard/hr-keuangan/ai-hr" },
    ];
  }
  if (role === "karyawan") {
    return [
      { id: "payroll-slip", label: "Slip Gaji", icon: <LiaWalletSolid size={32} className="text-pink-400" />, desc: "Lihat slip gaji bulanan Anda", href: "/dashboard/karyawan" },
      { id: "attendance", label: "Absensi", icon: <LiaClockSolid size={32} className="text-green-400" />, desc: "Cek dan kelola kehadiran", href: "/dashboard/karyawan" },
      { id: "leave", label: "Cuti", icon: <LiaMedalSolid size={32} className="text-yellow-400" />, desc: "Ajukan cuti dengan mudah", href: "/dashboard/karyawan" },
      { id: "profile", label: "Profil", icon: <LiaUserSolid size={32} className="text-blue-400" />, desc: "Lihat dan edit profil Anda", href: "/profile" },
    ];
  }
  if (role === "umkm-amil") {
    return [
      { id: "transactions", label: "Transaksi", icon: <LiaWalletSolid size={32} className="text-pink-400" />, desc: "Catat dan kelola transaksi bisnis", href: "/dashboard/mitra/transactions" },
      { id: "ai-syariah", label: "AI Syariah", icon: <LiaRobotSolid size={32} className="text-purple-400" />, desc: "Verifikasi syariah transaksi dengan AI", href: "/dashboard/mitra/ai-syariah" },
      { id: "business-reports", label: "Laporan Bisnis", icon: <LiaChartBarSolid size={32} className="text-green-400" />, desc: "Lihat performa dan laporan bisnis", href: "/dashboard/mitra" },
      { id: "profile", label: "Profil", icon: <LiaUserSolid size={32} className="text-blue-400" />, desc: "Lihat dan edit profil usaha", href: "/profile" },
    ];
  }
  // fallback for unknown role
  return [
    { id: "profile", label: "Profil", icon: <LiaUserSolid size={32} className="text-blue-400" />, desc: "Lihat dan edit profil Anda", href: "/profile" },
  ];
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError("");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setError("Anda belum login.");
        setUser(null);
        setLoading(false);
        router.push("/login");
        return;
      }
      try {
        const token = await currentUser.getIdToken();
        // Fetch user profile from API
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        let userData = null;
        if (res.ok) userData = await res.json();
        if (!userData) {
          // Create a new profile if it doesn't exist
          const basicProfile = {
            email: currentUser.email ?? undefined,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            role: 'hr-keuangan',
          };
          const createRes = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(basicProfile)
          });
          if (createRes.ok) {
            setUser({ id: currentUser.uid, ...basicProfile });
          } else {
            throw new Error("Failed to create profile");
          }
        } else {
          setUser(userData);
        }
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError("Gagal memuat profil: " + (err.message || "Unknown error"));
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Handle profile image upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Not authenticated');
        // Update photo via API
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ photo: base64 })
        });
        if (res.ok) {
          setUser((prev: any) => ({ ...prev, photo: base64 }));
        } else {
          setError("Gagal mengunggah foto profil.");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Error uploading profile photo:", err);
      setError("Gagal mengunggah foto profil: " + (err.message || "Unknown error"));
      setUploading(false);
    }
  };

  // Handle header image upload
  const handleHeaderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingHeader(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Not authenticated');
        // Update header photo via API
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ headerPhoto: base64 })
        });
        if (res.ok) {
          setUser((prev: any) => ({ ...prev, headerPhoto: base64 }));
        } else {
          setError("Gagal mengunggah foto sampul.");
        }
        setUploadingHeader(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Error uploading header photo:", err);
      setError("Gagal mengunggah foto sampul: " + (err.message || "Unknown error"));
      setUploadingHeader(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <Sidebar active="Settings" />
      <main className="flex-1 flex flex-col items-center justify-start">
        <div className="w-full">
          {/* Page Title */}
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
          </div>

          {/* Header Banner */}
          <div className="w-full h-48 md:h-72 relative overflow-hidden">
            {user?.headerPhoto ? (
              <img 
                src={user.headerPhoto} 
                alt="Header" 
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src="/img/bank-header.jpg" 
                alt="Default Header" 
                className="w-full h-full object-cover"
              />
            )}
            {/* Upload overlay */}
            <label className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer transition-all duration-300">
              <span className="bg-white/95 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
                <IoMdCamera size={20} />
                {uploadingHeader ? "Mengunggah..." : "Ubah Foto Sampul"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleHeaderChange} disabled={uploadingHeader} />
            </label>
          </div>

          {/* Profile Content */}
          <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-24">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-white shadow overflow-hidden">
                    {user?.photo ? (
                      <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#00C570]/10 flex items-center justify-center">
                        <span className="text-[#00C570] text-xl font-semibold">
                          {user?.name?.charAt(0) || "Z"}
                        </span>
                      </div>
                    )}
                    {/* Upload overlay */}
                    <label className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300">
                      <span className="bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow">
                        {uploading ? "Mengunggah..." : "Ubah Foto"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploading} />
                    </label>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <div className="bg-[#E6FFF4] rounded-full p-1">
                      <Image src="/zafra.svg" alt="ZAFRA" width={16} height={16} />
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {loading ? (
                        <span className="h-7 w-40 bg-gray-200 rounded animate-pulse inline-block" />
                      ) : (
                        user?.name || "ZafraHR"
                      )}
                    </h2>
                    {getRoleBadge(user?.role)}
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    {loading ? (
                      <span className="h-5 w-32 bg-gray-200 rounded animate-pulse inline-block" />
                    ) : (
                      user?.email || "zafra@zafra.com"
                    )}
                  </p>
                </div>
              </div>

              {/* Features Section (dynamic by role) */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Fitur Utama</h3>
                <p className="text-gray-500 text-sm mb-4">Akses cepat ke fitur-fitur utama sesuai peran Anda.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {getRoleFeatures(user?.role).map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="flex flex-col items-center gap-3 bg-white hover:bg-[#E6FFF4] rounded-2xl p-6 border border-gray-100 hover:border-[#00C570]/30 transition-colors shadow group h-full"
                    >
                      <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="text-base font-semibold text-gray-900 text-center">{item.label}</span>
                      <span className="text-xs text-gray-500 text-center">{item.desc}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function roleLabel(role: string) {
  if (role === "hr-keuangan") return "HR & Keuangan";
  if (role === "karyawan") return "Karyawan Muslim";
  if (role === "umkm-amil") return "UMKM Syariah & Lembaga Amil Zakat";
  return role;
}
