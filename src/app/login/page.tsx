"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseApi";
import { LuMail, LuLock, LuStar, LuMoon, LuHeart, LuShield } from "react-icons/lu";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Use Firebase Auth to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user) throw new Error("User not found");
      const token = await user.getIdToken();
      // Fetch user profile from API
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal memuat profil pengguna");
      const profile = await res.json();
      if (profile.role === "hr-keuangan") {
          router.push("/dashboard/hr-keuangan");
      } else if (profile.role === "karyawan") {
          router.push("/dashboard/karyawan");
      } else if (profile.role === "umkm-amil") {
        router.push("/dashboard/mitra");
      } else {
        setError("Anda tidak memiliki akses ke halaman ini.");
      }
    } catch (err: any) {
      setError(err?.message || "Email atau password salah, atau akun tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-emerald-900/80 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 z-10"></div>
        <Image
          src="/img/bank.jpg"
          alt="Islamic Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Islamic Pattern Overlay */}
      <div className="absolute inset-0 z-20 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="grid grid-cols-12 gap-4 h-full opacity-20">
            {Array.from({ length: 120 }).map((_, i) => (
              <div key={i} className="border border-white/10 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Islamic Elements */}
      <div className="absolute inset-0 z-20">
        <div className="absolute top-20 left-20 text-emerald-400/20 animate-pulse">
          <LuStar size={32} />
        </div>
        <div className="absolute top-40 right-32 text-teal-400/20 animate-pulse">
          <LuMoon size={28} />
        </div>
        <div className="absolute bottom-32 left-32 text-emerald-400/20 animate-pulse">
          <LuShield size={24} />
        </div>
        <div className="absolute bottom-20 right-20 text-teal-400/20 animate-pulse">
          <LuStar size={36} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-30 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Side - Islamic Welcome Content */}
          <div className="flex-1 text-center lg:text-left text-white space-y-6">
            <div className="flex justify-center lg:justify-start mb-6">
              <Image src="/zafra.svg" alt="ZAFRA Logo" width={80} height={40} className="filter brightness-0 invert" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Assalamu'alaikum
              </span>
              <br />
              <span className="text-white">wa Rahmatullahi</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                wa Barakatuh
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed font-medium">
              Kelola keuangan syariah dengan penuh berkah dan transparansi
            </p>

            {/* Islamic Quote Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                  <LuStar size={20} className="text-white" />
                </div>
                <h3 className="text-emerald-300 font-semibold">Firman Allah SWT</h3>
              </div>
              <p className="text-emerald-200 font-semibold text-lg mb-3 leading-relaxed">
                "وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا"
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                "Allah telah menghalalkan jual beli dan mengharamkan riba."
              </p>
              <p className="text-emerald-400 text-xs mt-2 font-medium">- QS. Al-Baqarah: 275</p>
            </div>

            {/* Islamic Values */}
            <div className="hidden lg:flex gap-6 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <LuShield size={16} className="text-emerald-400" />
                </div>
                <span className="text-gray-200 font-medium">Halal & Berkah</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                  <LuHeart size={16} className="text-teal-400" />
                </div>
                <span className="text-gray-200 font-medium">Adil & Transparan</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 max-w-md w-full">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LuShield size={28} className="text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Masuk ke Akun Anda
                </h2>
                <p className="text-gray-300 text-sm">
                  Akses dashboard keuangan syariah yang aman dan terpercaya
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-200 font-medium mb-2 text-sm">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LuMail size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="Masukkan email Anda"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-200 font-medium mb-2 text-sm">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LuLock size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-300 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Memproses...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LuHeart size={18} />
                      Masuk dengan Berkah
                    </div>
                  )}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <Link href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                    Lupa password?
                  </Link>
                  <Link href="/register" className="text-teal-400 hover:text-teal-300 transition-colors">
                    Daftar Akun
                  </Link>
                </div>
              </form>

              {/* Bottom Islamic Quote */}
              <div className="mt-8 text-center">
                <p className="text-gray-400 text-xs italic leading-relaxed">
                  "Barangsiapa yang memudahkan urusan orang lain, maka Allah akan memudahkan urusannya di dunia dan akhirat."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}