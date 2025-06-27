"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { loginUser } from "@/app/api/service/firebaseUserService";
import { LuMail, LuLock } from "react-icons/lu";
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
      const result = await loginUser({ email, password });
      if (result.success) {
        if (result.role === "hr-keuangan") {
          router.push("/dashboard/hr-keuangan");
        } else if (result.role === "karyawan") {
          router.push("/dashboard/karyawan");
        } else if (result.role === "umkm-amil"){
          router.push("/dashboard/umkm-amil");
        } else {
          setError("Anda tidak memiliki akses ke halaman ini.");
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Email atau password salah, atau akun tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-2 sm:p-4">
      <div className="w-full max-w-7xl rounded-3xl flex flex-col md:flex-row overflow-hidden ">
        {/* Left Panel: Form */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 md:p-12 gap-6 ">
          <div className="flex flex-col items-start gap-3 mb-4">
            <Image src="/zafra.svg" alt="ZAFRA Logo" width={70} height={35} className="mb-2" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#00C570] leading-tight">Selamat Datang!</h2>
            <p className="text-gray-500 dark:text-gray-300 text-base sm:text-lg font-medium">Masuk ke akun ZAFRA Anda untuk mengelola keuangan syariah modern.</p>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700 my-2 w-full" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <label className="flex flex-col gap-1 text-left w-full">
              <span className="font-semibold text-gray-700 ">Email</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {/* Email Icon */}
                  <LuMail size={20} />
                </span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#00C570] dark:bg-gray-800 dark:text-white transition w-full hover:border-[#00C570] text-base sm:text-lg"
                  required
                  disabled={loading}
                />
              </div>
            </label>
            <label className="flex flex-col gap-1 text-left w-full">
              <span className="font-semibold text-gray-700 ">Password</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <LuLock size={20} />
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#00C570] dark:bg-gray-800 dark:text-white transition w-full hover:border-[#00C570] text-base sm:text-lg"
                  required
                  disabled={loading}
                />
              </div>
            </label>
            {error && <div className="text-red-600 text-sm font-semibold mt-1">{error}</div>}
            <button type="submit" className="mt-2 bg-[#00C570] hover:bg-green-600 active:bg-green-700 text-white rounded-lg py-2 sm:py-3 font-semibold shadow transition text-base sm:text-lg" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </button>
            <div className="flex justify-between items-center mt-1">
              <div />
              <Link href="#" className="text-xs text-[#00C570] hover:underline font-semibold">Lupa password?</Link>
            </div>
          </form>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[#00C570] hover:underline font-semibold">Register</Link>
          </p>
        </div>
        {/* Right Panel: Image & Tagline */}
        <div className="hidden md:flex flex-2 relative items-center justify-center ">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src="/img/Log.svg"
              alt="ZAFRA Bank Jateng"
              fill
              className=""
              style={{ zIndex: 0 }}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
} 