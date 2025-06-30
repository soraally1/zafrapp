"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Sidebar from "../components/Sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile, updateUserProfilePhoto, updateUserHeaderPhoto, createOrUpdateProfile } from "../api/service/userProfileService";
import { LiaMedalSolid, LiaClockSolid, LiaWalletSolid, LiaChartBarSolid, LiaUserSolid } from "react-icons/lia";
import { BsStars } from "react-icons/bs";
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

const mockAchievements = [
  { id: "complete-achievement", label: "Laporan Lengkap", icon: <LiaMedalSolid size={32} className="text-yellow-400" /> },
  { id: "ontime-achievement", label: "Tepat Waktu", icon: <LiaMedalSolid size={32} className="text-blue-400" /> },
  { id: "active-achievement", label: "Kontributor Aktif", icon: <LiaMedalSolid size={32} className="text-purple-400" /> },
];

const mockInventory = [
  { id: "reports-inventory", label: "Akses Laporan", icon: <LiaChartBarSolid size={28} className="text-green-400" /> },
  { id: "payroll-inventory", label: "Fitur Payroll", icon: <LiaWalletSolid size={28} className="text-pink-400" /> },
  { id: "zakat-inventory", label: "Fitur Zakat", icon: <BsStars size={28} className="text-yellow-400" /> },
];

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
        const userData = await getUserProfile(currentUser.uid);
        if (!userData) {
          // Create a new profile if it doesn't exist
          const basicProfile = {
            email: currentUser.email ?? undefined,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            role: 'hr-keuangan',
          };
          
          const result = await createOrUpdateProfile(currentUser.uid, basicProfile);
          if (result.success) {
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
        const res = await updateUserProfilePhoto(user.id, base64);
        if (res.success) {
          // Update both Firestore and local state
          await createOrUpdateProfile(user.id, { photo: base64 });
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
        const res = await updateUserHeaderPhoto(user.id, base64);
        if (res.success) {
          // Update both Firestore and local state
          await createOrUpdateProfile(user.id, { headerPhoto: base64 });
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
            <label className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300">
              <span className="bg-white/95 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
                <IoMdCamera size={20} />
                {uploadingHeader ? "Mengunggah..." : "Ubah Foto Sampul"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleHeaderChange} disabled={uploadingHeader} />
            </label>
          </div>

          {/* Profile Content */}
          <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                        "ZafraHR"
                      )}
                    </h2>
                    <span className="px-2.5 py-1 rounded-full bg-[#E6FFF4] text-[#00C570] text-xs font-medium">
                      HR & KEUANGAN
                    </span>
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

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockStats.map((stat) => (
                  <div
                    key={stat.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:border-[#00C570]/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#E6FFF4]">
                        {stat.icon}
                      </div>
                      <div>
                        <span className="block text-2xl font-bold text-gray-900 mb-1">{stat.value}</span>
                        <span className="block text-sm font-medium text-gray-700">{stat.label}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{stat.subLabel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Achievements & Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Achievements */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <LiaMedalSolid size={20} className="text-[#00C570]" />
                      <h3 className="font-semibold text-gray-900">Pencapaian</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#E6FFF4] text-[#00C570] text-xs font-medium">3</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {mockAchievements.map((ach) => (
                      <div key={ach.id} className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-xl bg-[#E6FFF4] flex items-center justify-center">
                          {ach.icon}
                        </div>
                        <span className="text-xs text-gray-600 text-center">{ach.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <BsStars size={20} className="text-[#00C570]" />
                      <h3 className="font-semibold text-gray-900">Fitur Saya</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#E6FFF4] text-[#00C570] text-xs font-medium">3</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {mockInventory.map((item) => (
                      <div key={item.id} className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-xl bg-[#E6FFF4] flex items-center justify-center">
                          {item.icon}
                        </div>
                        <span className="text-xs text-gray-600 text-center">{item.label}</span>
                      </div>
                    ))}
                  </div>
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
