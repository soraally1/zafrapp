'use client';

import Image from "next/image";
import React from "react";
import { LiaHomeSolid, LiaWalletSolid, LiaDonateSolid, LiaChartBarSolid, LiaUserSolid, LiaCogSolid } from "react-icons/lia";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getAuth, signOut } from "firebase/auth";

const menu = [
  { label: "Dashboard", icon: <LiaHomeSolid size={24} />, path: "/dashboard/hr-keuangan" },
  { label: "Payroll", icon: <LiaWalletSolid size={24} />, path: "/dashboard/hr-keuangan/payroll" },
  { label: "Zakat", icon: <LiaDonateSolid size={24} />, path: "/dashboard/hr-keuangan/zakat" },
  { label: "Reports", icon: <LiaChartBarSolid size={24} />, path: "/dashboard/hr-keuangan/reports" },
  { label: "Employees", icon: <LiaUserSolid size={24} />, path: "/dashboard/hr-keuangan/karyawan" },
  { label: "Settings", icon: <LiaCogSolid size={24} />, path: "/dashboard/hr-keuangan/settings" },
];

interface SidebarProps {
  active?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ active = "Dashboard" }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Helper function to check if a menu item is active
  const isActive = (path: string) => {
    if (path === "/dashboard/hr-keuangan" && pathname === "/dashboard/hr-keuangan") {
      return true;
    }
    return pathname.startsWith(path) && path !== "/dashboard/hr-keuangan";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 py-6 px-4 gap-6 min-h-screen">
        <Link href="/dashboard/hr-keuangan" className="flex items-center justify-center mb-8 px-2">
          <Image src="/zafra.svg" alt="ZAFRA Logo" width={150} height={150} />
        </Link>
        <nav className="flex-1 flex flex-col gap-1">
          {menu.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-base transition focus:outline-none focus:ring-2 focus:ring-[#00C570] ${
                isActive(item.path)
                  ? "bg-[#E6FFF4] text-[#00C570] font-bold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-current={isActive(item.path) ? "page" : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-[#00C570] mt-auto"
        >
          <span className="text-xl">⏻</span> <span className="truncate">Log out</span>
        </button>
      </aside>
      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-white border-t border-gray-200 h-16 justify-around items-center">
        {menu.map((item) => (
          <Link
            key={item.label}
            href={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all ${
              isActive(item.path) ? "text-[#00C570]" : "text-gray-400 hover:text-[#00C570]"
            }`}
            aria-current={isActive(item.path) ? "page" : undefined}
          >
            <span className={`mb-0.5 ${isActive(item.path) ? "scale-125" : ""}`}>{item.icon}</span>
            {isActive(item.path) && <span className="w-1.5 h-1.5 rounded-full bg-[#00C570] mt-0.5" />}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Sidebar; 