"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/api/service/firebaseUserService";

const roles = [
  { value: "hr-keuangan", label: "HR & Keuangan" },
  { value: "karyawan", label: "Karyawan Muslim" },
  { value: "umkm-amil", label: "UMKM Syariah & Lembaga Amil Zakat" },
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await registerUser({ name, email, password, role });
    if (result.success) {
      // Redirect to dashboard based on role
      if (role === "hr-keuangan") {
        router.push("/dashboard/hr-keuangan");
      } else if (role === "karyawan") {
        router.push("/dashboard/karyawan");
      } else if (role === "umkm-amil") {
        router.push("/dashboard/umkm-amil");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-2 sm:p-4">
      <div className="w-full max-w-7xl  flex flex-col md:flex-row overflow-hidden ">
        {/* Left Panel: Form */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 md:p-12 gap-6">
          <div className="flex flex-col items-start gap-3 mb-4">
            <Image src="/zafra.svg" alt="ZAFRA Logo" width={70} height={35} className="mb-2" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#00C570] dark:text-white leading-tight">Register ZAFRA</h2>
            <p className="text-gray-500 dark:text-gray-300 text-base sm:text-lg font-medium">Buat akun baru untuk mengelola keuangan syariah Anda</p>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700 my-2 w-full" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <label className="flex flex-col gap-1 text-left w-full">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Nama</span>
              <input
                type="text"
                placeholder="Nama"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#00C570] dark:bg-gray-800 dark:text-white transition w-full hover:border-[#00C570] text-base sm:text-lg"
                required
                disabled={loading}
              />
            </label>
            <label className="flex flex-col gap-1 text-left w-full">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Email</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {/* Email Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.09 7.09a2.25 2.25 0 01-3.182 0l-7.09-7.09A2.25 2.25 0 012.25 6.993V6.75" />
                  </svg>
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
              <span className="font-semibold text-gray-700 dark:text-gray-200">Password</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {/* Password Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.125a4.125 4.125 0 10-8.25 0V10.5m12.375 0A2.625 2.625 0 0017.25 21h-10.5a2.625 2.625 0 01-2.625-2.625v-7.875A2.625 2.625 0 016.75 7.875h10.5a2.625 2.625 0 012.625 2.625v7.875z" />
                  </svg>
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
            <label className="flex flex-col gap-1 text-left w-full">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Role</span>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#00C570] dark:bg-gray-800 dark:text-white transition w-full hover:border-[#00C570] text-base sm:text-lg"
                disabled={loading}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            {error && <div className="text-red-600 text-sm font-semibold mt-1">{error}</div>}
            <button type="submit" className="bg-[#00C570] hover:bg-green-600 active:bg-green-700 text-white rounded-lg py-2 sm:py-3 font-semibold shadow transition text-base sm:text-lg" disabled={loading}>
              {loading ? "Loading..." : "Register"}
            </button>
          </form>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Sudah punya akun? <Link href="/login" className="text-[#00C570] hover:underline font-semibold">Login</Link>
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