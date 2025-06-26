"use client";

import Image from "next/image";
import Sidebar from "../Sidebar";
import { useState } from "react";
import React from "react";
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import ReportCards from "./ReportCards";
ChartJS.register(ArcElement, Tooltip, Legend);

const menu = [
  { label: "Dashboard", icon: "🏠" },
  { label: "Payroll", icon: "💸" },
  { label: "Zakat", icon: "🕌" },
  { label: "Reports", icon: "📊" },
  { label: "Employees", icon: "👥" },
  { label: "Settings", icon: "⚙️" },
];

export default function HRKeuanganDashboard() {
  // Dummy data
  const userName = "Bapak/Ibu HR";
  const summary = [
    { label: "Gaji Bulan Ini", value: "Rp 120.000.000", color: "bg-[#E6FFF4] text-[#00C570]" },
    { label: "Zakat Terkumpul", value: "Rp 8.500.000", color: "bg-[#FFF9E6] text-[#EAB308]" },
    { label: "Karyawan Aktif", value: "32 Orang", color: "bg-[#E6F0FF] text-[#2563EB]" },
  ];
  const stats = [
    { label: "Total Gaji Dibayarkan", value: "Rp 1.200.000.000" },
    { label: "Karyawan", value: "32" },
    { label: "Zakat/Donasi", value: "Rp 85.000.000" },
    { label: "Slip Gaji Bulan Ini", value: "32" },
  ];
  const tasks = [
    { title: "Verifikasi slip gaji", date: "21 Mei 2024" },
    { title: "Input data karyawan baru", date: "20 Mei 2024" },
  ];
  const upcoming = [
    { title: "Jadwal Pembayaran Gaji", date: "25 Mei 2024", time: "09:00" },
    { title: "Distribusi Zakat", date: "27 Mei 2024", time: "13:00" },
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const today = 27;
  const reports = [
    { label: "Jurnal Umum", icon: "📒" },
    { label: "Buku Besar", icon: "📚" },
    { label: "Neraca", icon: "📊" },
    { label: "Laba Rugi", icon: "💹" },
    { label: "Arus Kas", icon: "💵" },
    { label: "Dana Sosial Khusus", icon: "🤲" },
  ];

  // Sidebar mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      {/* Sidebar: desktop & mobile */}
      <Sidebar active="Dashboard" />
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed top-0 left-0 z-30 w-60 h-full bg-white border-r border-gray-100 py-8 px-6"><Sidebar active="Dashboard" /></div>
      )}
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-20 w-full bg-white/60 backdrop-blur-lg border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 py-4 md:py-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500">Assalamu'alaikum,</span>
            <span className="font-extrabold text-2xl md:text-3xl text-gray-900 tracking-tight font-jakarta">{userName}</span>
            <span className="text-xs text-gray-400 font-medium">Selamat datang di ZAFRA Payroll & Keuangan Syariah</span>
          </div>
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#00C570] flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md select-none">
              HR
            </div>
          </div>
        </header>
        {/* Progress & Summary */}
        <section className="px-2 sm:px-4 md:px-8 py-6 flex flex-col gap-8 w-full max-w-[1600px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Progress Card */}
            <div className="flex-1 bg-[#171B2A] rounded-2xl p-6 flex flex-col gap-4 text-white shadow-lg min-w-[260px]">
              <span className="text-base">Progress Penggajian</span>
              <span className="text-2xl font-bold">Anda telah memproses 32 slip gaji bulan ini!</span>
              <button className="mt-2 bg-[#00C570] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg w-max focus:outline-none focus:ring-2 focus:ring-[#00C570]">Lihat Detail</button>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                {summary.map((item, i) => (
                  <div key={item.label} className={`flex-1 rounded-xl p-4 font-semibold shadow-sm ${item.color} flex flex-col items-start min-w-[120px] border border-[#e0e0e0]`}> 
                    <span className="text-xs mb-1 opacity-80">{item.label}</span>
                    <span className="text-lg">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Calendar */}
            <div className="w-full max-w-xs bg-white rounded-2xl shadow p-6 flex flex-col gap-4 mt-8 lg:mt-0 border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">Mei 2024</span>
                <span className="text-gray-400">{today} Mei</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["M", "S", "S", "R", "K", "J", "S"].map((d) => (
                  <span key={d} className="font-bold text-gray-400">{d}</span>
                ))}
                {days.map((d) => (
                  <span key={d} className={`rounded-full w-7 h-7 flex items-center justify-center ${d === today ? "bg-[#00C570] text-white font-bold" : "text-gray-700"}`}>{d}</span>
                ))}
              </div>
              <div className="mt-2">
                <span className="block text-xs text-gray-500">Upcoming:</span>
                {upcoming.map((item) => (
                  <div key={item.title} className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#00C570]" />
                    <span className="text-xs text-gray-700">{item.title} ({item.date}, {item.time})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Statistics & Tasks */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Statistics */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((item, idx) => {
                // Only treat 'Total Gaji Dibayarkan' and 'Zakat/Donasi' as currency
                const isCurrency = ["Total Gaji Dibayarkan", "Zakat/Donasi"].includes(item.label);
                return (
                  <div
                    key={item.label}
                    className="relative bg-white/60 backdrop-blur-lg border border-[#e0e0e0] rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[140px] overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl hover:ring-2 hover:ring-[#00C570]/30 group"
                    style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}
                  >
                    {/* Icon */}
                    <span className="text-3xl mb-2 animate-bounce-slow">
                      {idx === 0 && <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#00C570" fillOpacity="0.15"/><path d="M10 20l4-4 4 4 4-8" stroke="#00C570" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      {idx === 1 && <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="4" fill="#00C570" fillOpacity="0.15"/><path d="M8 16h16M8 20h10" stroke="#00C570" strokeWidth="2" strokeLinecap="round"/></svg>}
                      {idx === 2 && <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#00C570" fillOpacity="0.15"/><path d="M16 10v12M10 16h12" stroke="#00C570" strokeWidth="2" strokeLinecap="round"/></svg>}
                      {idx === 3 && <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="8" fill="#00C570" fillOpacity="0.15"/><path d="M16 12v8M12 16h8" stroke="#00C570" strokeWidth="2" strokeLinecap="round"/></svg>}
                    </span>
                    <span className="text-xs text-gray-500 mb-2 text-center font-medium">{item.label}</span>
                    <span className="text-[#00C570] font-extrabold text-2xl md:text-3xl text-center whitespace-nowrap mb-1">
                      {isCurrency ? formatRupiahShort(item.value) : item.value}
                    </span>
                    {/* ZAFRA watermark logo */}
                    <Image src="/zafra.svg" alt="ZAFRA" width={48} height={48} className="absolute bottom-2 right-2 opacity-10 pointer-events-none select-none" />
                  </div>
                );
              })}
            </div>
            {/* Tasks */}
            <div className="w-full max-w-md bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 flex flex-col gap-4 mt-8 lg:mt-0 border border-[#e0e0e0] relative overflow-hidden">
              {/* ZAFRA watermark logo */}
              <Image src="/zafra.svg" alt="ZAFRA" width={56} height={56} className="absolute bottom-2 right-2 opacity-10 pointer-events-none select-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">Tugas HR</span>
                <span className="text-xs text-[#00C570] cursor-pointer hover:underline">Lihat semua</span>
              </div>
              <div className="flex flex-row gap-3">
                {/* Timeline bar */}
                <div className="flex flex-col items-center pt-2">
                  {tasks.map((_, i) => (
                    <React.Fragment key={i}>
                      <span className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[#00C570]' : 'bg-gray-300'} border-2 border-white shadow transition-all duration-300`} />
                      {i < tasks.length - 1 && <span className="w-1 h-8 bg-gradient-to-b from-[#00C570]/60 to-gray-200 mx-auto" />}
                    </React.Fragment>
                  ))}
                </div>
                {/* Task items */}
                <div className="flex-1 flex flex-col gap-3">
                  {tasks.map((item, i) => (
                    <div
                      key={item.title}
                      className={`flex items-center gap-3 p-3 rounded-xl bg-white/80 shadow-sm hover:shadow-md transition-all duration-200 group ${i === 0 ? 'border-l-4 border-[#00C570]' : 'border-l-4 border-gray-200'}`}
                      style={{ animation: `fadeInUp 0.4s ${i * 0.1 + 0.2}s both` }}
                    >
                      {/* Animated check/progress icon */}
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${i === 0 ? 'bg-[#00C570]' : 'bg-gray-300'} text-white text-lg font-bold transition-all duration-300`}>
                        {i === 0 ? (
                          <svg className="animate-pulse" width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#00C570" fillOpacity="0.2"/><path d="M6 10.5l2.5 2.5L14 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#d1fae5"/><path d="M6 10.5l2.5 2.5L14 8" stroke="#00C570" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                      </span>
                      <div className="flex-1">
                        <span className="block font-semibold text-gray-800 group-hover:text-[#00C570] transition-colors duration-200">{item.title}</span>
                        <span className="block text-xs text-gray-500">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Add Task Button (future extensibility) */}
              <button className="mt-2 self-end bg-[#00C570] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all duration-200">+ Tambah Tugas</button>
            </div>
          </div>
          {/* Reports Section */}
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 flex flex-col gap-6 mt-8 border border-[#e0e0e0] relative overflow-hidden">
            {/* ZAFRA watermark logo */}
            <Image src="/zafra.svg" alt="ZAFRA" width={56} height={56} className="absolute bottom-2 right-2 opacity-10 pointer-events-none select-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg">Laporan Keuangan</span>
              <span className="text-xs text-[#00C570] cursor-pointer hover:underline">Lihat semua</span>
            </div>
            {/* Summary Chart */}
            <div className="w-full flex flex-col md:flex-row items-center gap-6">
              <div className="w-full max-w-xs mx-auto">
                <Doughnut
                  data={{
                    labels: ['Gaji', 'Zakat', 'Dana Sosial'],
                    datasets: [
                      {
                        label: 'Total (Rp) ',
                        data: [1200000000, 85000000, 25000000],
                        backgroundColor: [
                          'rgba(0, 197, 112, 0.7)',
                          'rgba(234, 179, 8, 0.7)',
                          'rgba(37, 99, 235, 0.7)'
                        ],
                        borderColor: [
                          'rgba(0, 197, 112, 1)',
                          'rgba(234, 179, 8, 1)',
                          'rgba(37, 99, 235, 1)'
                        ],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          font: { family: 'Plus Jakarta Sans', size: 14 },
                          color: '#171B2A',
                        },
                      },
                    },
                    cutout: '70%',
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                  height={180}
                />
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#00C570]"></span>
                  <span className="font-semibold text-gray-700">Gaji</span>
                  <span className="ml-auto font-bold text-[#00C570]">Rp 1.200.000.000</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#EAB308]"></span>
                  <span className="font-semibold text-gray-700">Zakat</span>
                  <span className="ml-auto font-bold text-[#EAB308]">Rp 85.000.000</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#2563EB]"></span>
                  <span className="font-semibold text-gray-700">Dana Sosial</span>
                  <span className="ml-auto font-bold text-[#2563EB]">Rp 25.000.000</span>
                </div>
              </div>
            </div>
            {/* Report Cards */}
            <ReportCards reports={reports} />
          </div>
        </section>
      </main>
    </div>
  );
}

function AnimatedNumber({ value, className = "" }: { value: string | number; className?: string }) {
  const [display, setDisplay] = useState(typeof value === 'number' ? 0 : "");
  // Only animate if value is a number
  React.useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const duration = 1200;
      const stepTime = Math.abs(Math.floor(duration / 30));
      let current = start;
      const increment = (end - start) / 30;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setDisplay(end.toLocaleString());
          clearInterval(timer);
        } else {
          setDisplay(Math.floor(current).toLocaleString());
        }
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setDisplay(value);
    }
  }, [value]);
  return <span className={className}>{display}</span>;
}

function formatRupiahShort(value: string) {
  // Remove non-digit characters
  const num = Number(value.replace(/[^\d]/g, ""));
  if (isNaN(num)) return value;
  if (num >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  } else if (num >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")} JT`;
  } else {
    return `Rp ${num.toLocaleString('id-ID')}`;
  }
} 