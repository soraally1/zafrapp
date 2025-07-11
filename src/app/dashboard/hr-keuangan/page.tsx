"use client";

import Image from "next/image";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { useState, useEffect } from "react";
import React from "react";
import ReportCards from "./ReportCards";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  fetchStats,
  fetchTasks,
  fetchUpcoming,
  fetchReports,
  addTask,
  logActivity,
  fetchRecentActivities
} from "./hrDashboardService";
import {
  formatStats
} from "./hrDashboardLogic";
import {
  calculateLedgerData,
  calculateBalanceData,
  calculateProfitLossData,
  calculateCashFlowData,
  calculateZisData,
} from "./reports/financialReportLogic";
import { format } from "date-fns";
import { aggregatePayrollSummary, countProcessedSlips } from "./hrDashboardLogic";
import { MdOutlineAttachMoney, MdOutlineCardGiftcard, MdOutlineRemoveCircleOutline, MdOutlineMosque, MdOutlineSavings } from 'react-icons/md';
import { FiCheckCircle, FiAlertCircle, FiCalendar, FiBarChart2, FiUsers, FiClipboard, FiChevronRight, FiPlus, FiEdit2 } from 'react-icons/fi';
import { addMonths, subMonths, startOfMonth, endOfMonth, getDaysInMonth, isSameDay, isSameMonth, isToday as isTodayFn } from 'date-fns';

export default function HRKeuanganDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', date: '', time: '' });
  // Remove localTasks and setLocalTasks if not needed
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [activities, setActivities] = useState<any[]>([]);

  // Sidebar mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();

  // Merge fetched tasks with local tasks
  const allTasks = [...tasks];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        setLoadingUser(true);
        try {
          const token = await user.getIdToken();
          // Fetch user profile from API
          const profileRes = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!profileRes.ok) throw new Error('Unauthorized');
          const profile = await profileRes.json();
        if (!profile || profile.role !== "hr-keuangan") {
          await signOut(auth);
          router.push("/login");
          return;
        }
          setUserData({ ...profile, uid: user.uid });
        setLoadingUser(false);
        setLoading(true);
        // Fetch payroll users for current month (progress & summary)
        const currentMonth = format(new Date(), 'yyyy-MM');
          const payrollRes = await fetch(`/api/payroll-users?month=${currentMonth}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        let payrollUsers: any[] = [];
          if (payrollRes.ok) {
            const payrollResult = await payrollRes.json();
            payrollUsers = payrollResult.data || [];
          }
        // Use logic functions for summary and progress
        const summary = aggregatePayrollSummary(payrollUsers);
        const totalSlip = countProcessedSlips(payrollUsers);
        setSummary({ ...summary, totalSlip });
          // Fetch other dashboard data (these can remain as is if they use client SDK)
        const [statsData, tasksData, upcomingData, reportsData] = await Promise.all([
          fetchStats(),
          fetchTasks(user.uid),
          fetchUpcoming(user.uid),
          fetchReports(user.uid)
        ]);
        setStats(formatStats(statsData));
        setTasks(tasksData);
        setUpcoming(upcomingData);
        setTransactions(reportsData);
        setLoading(false);
        } catch (err) {
          await signOut(auth);
          router.push("/login");
        }
      } else {
        setLoadingUser(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('userData:', userData, 'uid:', userData?.uid, 'title:', newTask.title);
  }, [userData, newTask.title]);

  useEffect(() => {
    fetchRecentActivities().then(setActivities);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  // Dummy calendar data (can be replaced with real data if needed)
  const calendarMonthStr = format(calendarMonth, 'yyyy-MM');
  const daysInMonth = getDaysInMonth(calendarMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDate = new Date();

  // Generate reports array using calculation functions and real transaction data
  const reports = [
    {
      label: "Jurnal Umum",
      createdAt: transactions[0]?.createdAt || undefined,
      status: transactions.length > 0 ? "done" : "pending",
    },
    {
      label: "Buku Besar",
      createdAt: transactions[0]?.createdAt || undefined,
      status: calculateLedgerData(transactions).length > 0 ? "done" : "pending",
    },
    {
      label: "Neraca",
      createdAt: transactions[0]?.createdAt || undefined,
      status: calculateBalanceData(transactions).length > 0 ? "done" : "pending",
    },
    {
      label: "Laba Rugi",
      createdAt: transactions[0]?.createdAt || undefined,
      status: calculateProfitLossData(transactions).length > 0 ? "done" : "pending",
    },
    {
      label: "Arus Kas",
      createdAt: transactions[0]?.createdAt || undefined,
      status: calculateCashFlowData(transactions).length > 0 ? "done" : "pending",
    },
    {
      label: "Dana Sosial Khusus",
      createdAt: transactions[0]?.createdAt || undefined,
      status: calculateZisData(transactions).length > 0 ? "done" : "pending",
    },
  ];

  // Parse tasks to get a Set of days in the current month that have tasks
  const daysWithTasks = new Set(
    tasks
      .filter(task => task.date && task.date.startsWith(calendarMonthStr))
      .map(task => Number(task.date.split('-')[2]))
  );
  const tasksForSelectedDay = tasks.filter(task => task.date && task.date === selectedDay);

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
        <Topbar
          userName={userData?.name || "Bapak/Ibu HR"}
          userRole={userData?.role || "HR"}
          userPhoto={userData?.photo}
          loading={loadingUser}
        />
        {/* Progress & Summary */}
        <section className="px-2 pb-24 sm:px-4 md:px-8 py-6 flex flex-col gap-8 w-full max-w-[1600px] mx-auto">
          {/* Progress & Calendar */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-6 w-full">
            {/* Progress Card */}
            <div className="flex-1 w-full bg-gradient-to-br from-[#00C570]/90 to-[#171B2A] rounded-2xl p-2 sm:p-4 md:p-8 flex flex-col gap-4 sm:gap-6 text-white shadow-2xl relative mb-3 md:mb-0 md:overflow-hidden overflow-visible">
              <span className="text-base flex items-center gap-2 font-semibold"><FiClipboard className="text-xl" /> Progress Penggajian</span>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Circular Progress */}
                <div className="relative w-20 h-20 flex items-center justify-center mb-4 sm:mb-0">
                  <svg className="absolute top-0 left-0" width="80" height="80">
                    <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle cx="40" cy="40" r="36" stroke="#00C570" strokeWidth="8" fill="none" strokeDasharray="226.2" strokeDashoffset="${summary && summary.totalSlip ? 226.2 - (summary.totalSlip / 20) * 226.2 : 226.2}" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                  </svg>
                  <span className="text-2xl font-bold z-10">{summary ? summary.totalSlip : 0}</span>
                </div>
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <span className="text-lg font-bold">{summary ? `Anda telah memproses ${summary.totalSlip || 0} slip gaji bulan ini!` : '...'}</span>
                  <span className="text-xs text-white/80">Target: 20 slip</span>
                </div>
              </div>
              <button className="mt-2 bg-white/90 hover:bg-[#00C570] hover:text-white text-[#00C570] font-semibold px-4 py-2 rounded-lg w-max focus:outline-none focus:ring-2 focus:ring-[#00C570] shadow transition-all flex items-center gap-2 text-sm md:text-base">Lihat Detail <FiChevronRight /></button>
              {/* In the Progress Penggajian card, summary stats row: */}
              <div className="w-full min-w-0 flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 sm:mt-4 overflow-x-auto pb-2 scrollbar scrollbar-thumb-[#00C570]/40 scrollbar-track-gray-100 relative">
                <div className="w-full min-w-0 flex flex-row flex-nowrap gap-x-2 sm:gap-x-4">
                {/* Summary Stats with Icons */}
                  <div className="flex-shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] rounded-xl p-4 font-semibold shadow bg-white/10 flex flex-col items-start border border-[#e0e0e0] gap-2">
                  <span className="flex items-center gap-2 text-xs mb-1 opacity-80"><MdOutlineAttachMoney className="text-blue-400" /> Gaji Pokok</span>
                  <span className="text-lg font-bold">{summary ? summary.gaji.toLocaleString('id-ID') : '-'}</span>
                </div>
                  <div className="flex-shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] rounded-xl p-4 font-semibold shadow bg-white/10 flex flex-col items-start border border-[#e0e0e0] gap-2">
                  <span className="flex items-center gap-2 text-xs mb-1 opacity-80"><MdOutlineCardGiftcard className="text-green-400" /> Tunjangan</span>
                  <span className="text-lg font-bold">{summary ? summary.tunjangan.toLocaleString('id-ID') : '-'}</span>
                </div>
                  <div className="flex-shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] rounded-xl p-4 font-semibold shadow bg-white/10 flex flex-col items-start border border-[#e0e0e0] gap-2">
                  <span className="flex items-center gap-2 text-xs mb-1 opacity-80"><MdOutlineRemoveCircleOutline className="text-red-400" /> Potongan</span>
                  <span className="text-lg font-bold">{summary ? summary.potongan.toLocaleString('id-ID') : '-'}</span>
                </div>
                  <div className="flex-shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] rounded-xl p-4 font-semibold shadow bg-white/10 flex flex-col items-start border border-[#e0e0e0] gap-2">
                  <span className="flex items-center gap-2 text-xs mb-1 opacity-80"><MdOutlineMosque className="text-purple-400" /> Zakat</span>
                  <span className="text-lg font-bold">{summary ? summary.zakat.toLocaleString('id-ID') : '-'}</span>
                </div>
                  <div className="flex-shrink-0 min-w-[100px] sm:min-w-[120px] md:min-w-[140px] rounded-xl p-4 font-semibold shadow bg-white/10 flex flex-col items-start border border-[#e0e0e0] gap-2">
                  <span className="flex items-center gap-2 text-xs mb-1 opacity-80"><MdOutlineSavings className="text-[#00C570]" /> Gaji Bersih</span>
                  <span className="text-lg font-bold">{summary ? summary.bersih.toLocaleString('id-ID') : '-'}</span>
                  </div>
                </div>
              </div>
              {/* Helper text for mobile */}
              <span className="block sm:hidden text-xs text-gray-400 mt-1 ml-1">Geser untuk melihat lebih banyak</span>
            </div>
            {/* Calendar */}
            <div className="flex-1 w-full bg-white rounded-2xl shadow-lg p-2 sm:p-4 md:p-6 flex flex-col gap-3 sm:gap-4 border border-[#e0e0e0] relative overflow-hidden mx-auto max-w-xs sm:max-w-sm md:max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="text-gray-400 hover:text-[#00C570] px-2 py-1 rounded transition-all">&lt;</button>
                <span className="font-bold text-lg flex items-center gap-2">
                  <FiCalendar className="text-blue-500" />
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>
                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="text-gray-400 hover:text-[#00C570] px-2 py-1 rounded transition-all">&gt;</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                  <span key={d + i} className="font-bold text-gray-400">{d}</span>
                ))}
                {days.map((d) => {
                  const dayDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                  const isToday = isSameDay(dayDate, todayDate);
                  const hasTask = daysWithTasks.has(d);
                  const dayDateStr = format(dayDate, 'yyyy-MM-dd');
                  return (
                    <span
                      key={d}
                      onClick={() => setSelectedDay(dayDateStr)}
                      className={`relative rounded-full w-7 h-7 flex items-center justify-center transition-all duration-200 cursor-pointer
                        ${isToday ? 'bg-[#00C570] text-white font-bold shadow-lg' : ''}
                        ${hasTask && !isToday ? 'bg-green-100 text-green-800 font-bold border border-green-400' : ''}
                        ${selectedDay === dayDateStr ? 'ring-2 ring-[#00C570]' : ''}
                        hover:bg-green-50`}
                    >
                      {d}
                      {hasTask && !isToday && (
                        <span className="absolute bottom-1 right-1 w-2 h-2 bg-[#00C570] rounded-full"></span>
                      )}
                    </span>
                  );
                })}
              </div>
              {/* Below the calendar, show tasks for selected day */}
              {selectedDay && (
                <div className="mt-3">
                  <span className="block text-xs font-semibold text-gray-700 mb-1">Tugas pada {selectedDay}:</span>
                  {tasksForSelectedDay.length === 0 ? (
                    <span className="text-xs text-gray-400">Tidak ada tugas pada hari ini.</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {tasksForSelectedDay.map((task, idx) => (
                        <li key={task.title + task.date + idx} className="text-xs text-gray-800 bg-green-50 rounded px-2 py-1">
                          {task.title} {task.time && <span className="text-gray-500">({task.time})</span>}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
              )}
            </div>
          </div>
          {/* Statistics & Tasks */}
          <div className="flex flex-col md:flex-row w-full mt-4 md:mt-8">
            {/* Tasks and Recent Activity side by side */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 w-full mt-4 md:mt-8">
            {/* Tasks */}
              <div className="flex-1 w-full bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-3 sm:p-6 md:p-9 flex flex-col gap-3 sm:gap-4 border border-[#e0e0e0] relative overflow-hidden min-h-[260px] mb-3 md:mb-0">
              {/* ZAFRA watermark logo */}
              <Image src="/zafra.svg" alt="ZAFRA" width={56} height={56} className="absolute bottom-2 right-2 opacity-10 pointer-events-none select-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg flex items-center gap-2"><FiClipboard className="text-[#00C570]" />Tugas HR</span>
                <span className="text-xs text-[#00C570] cursor-pointer hover:underline flex items-center gap-1">Lihat semua <FiChevronRight /></span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {allTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
                    <FiClipboard className="text-3xl" />
                    <span className="text-sm">Belum ada tugas</span>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {allTasks.map((item, i) => (
                      <li key={item.title + item.date + i} className={`flex items-center gap-3 p-3 rounded-xl bg-white/80 shadow-sm hover:shadow-md transition-all duration-200 group border-l-4 ${i === 0 ? 'border-[#00C570]' : 'border-gray-200'}`}> 
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${i === 0 ? 'bg-[#00C570]' : 'bg-gray-300'} text-white text-lg font-bold transition-all duration-300`}>
                          <FiCheckCircle className={i === 0 ? 'animate-pulse' : 'text-[#00C570]'} />
                        </span>
                        <div className="flex-1">
                          <span className="block font-semibold text-gray-800 group-hover:text-[#00C570] transition-colors duration-200">{item.title}</span>
                          <span className="block text-xs text-gray-500">{item.date}{item.time ? `, ${item.time}` : ''}</span>
                        </div>
                        <button className="text-gray-400 hover:text-[#00C570] p-1 rounded" title="Edit"><FiEdit2 /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Add Task Button (sticky) */}
              <button onClick={() => setShowTaskModal(true)} className="mt-2 self-end bg-[#00C570] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all duration-200 flex items-center gap-1 sticky bottom-0"><FiPlus /> Tambah Tugas</button>
              </div>
              {/* Recent Activity Feed */}
              <div className="flex-1 w-full bg-white rounded-2xl shadow-2xl p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 border border-[#e0e0e0] min-h-[260px] mt-3 md:mt-0">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><FiBarChart2 className="text-[#00C570]" />Aktivitas Terbaru</h3>
                {/* Placeholder: Replace with real activity data */}
                <ul className="flex flex-col gap-2 text-sm text-gray-700">
                  {activities.length === 0 && <li>Tidak ada aktivitas terbaru.</li>}
                  {activities.map((act, idx) => (
                    <li key={act.message + idx} className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#00C570]" />
                      <span>{act.message}</span>
                      <span className="text-xs text-gray-400 ml-auto">{formatActivityTime(act.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* Reports Section */}
          <div className="bg-gradient-to-br from-white via-[#F6F8FA] to-[#e0f7ef] rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col gap-6 mt-8 border border-[#e0e0e0] relative overflow-hidden overflow-x-auto">
            {/* ZAFRA watermark logo */}
            <Image src="/zafra.svg" alt="ZAFRA" width={56} height={56} className="absolute bottom-2 right-2 opacity-10 pointer-events-none select-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg flex items-center gap-2"><FiBarChart2 className="text-[#00C570]" />Laporan Keuangan</span>
              <button className="text-xs text-white bg-[#00C570] hover:bg-green-600 px-4 py-2 rounded-lg shadow font-semibold flex items-center gap-1 transition-all"><FiChevronRight /> Lihat semua</button>
            </div>
            {/* Report Cards */}
            <ReportCards reports={reports} />
          </div>
        </section>
      </main>
              {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 relative shadow-2xl">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowTaskModal(false)} aria-label="Tutup">
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 justify-center"><FiClipboard className="text-[#00C570]" />Tambah Tugas HR</h2>
            <form onSubmit={async e => {
                      e.preventDefault();
                      if (!newTask.title) return;
              if (!userData || !userData.uid) {
                alert('User data not loaded. Please wait.');
                return;
              }
              await addTask({ ...newTask, assignedTo: userData.uid });
              await logActivity({
                type: 'task',
                message: `Tugas baru: ${newTask.title}`,
                userId: userData.uid,
              });
              const updatedTasks = await fetchTasks(userData.uid);
              setTasks(updatedTasks);
                      setNewTask({ title: '', date: '', time: '' });
                      setShowTaskModal(false);
                    }} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Judul Tugas</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-xl" value={newTask.title} onChange={e => setNewTask(nt => ({ ...nt, title: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
                        <input type="date" className="w-full px-3 py-2 border rounded-xl" value={newTask.date} onChange={e => setNewTask(nt => ({ ...nt, date: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Waktu (opsional)</label>
                        <input type="time" className="w-full px-3 py-2 border rounded-xl" value={newTask.time} onChange={e => setNewTask(nt => ({ ...nt, time: e.target.value }))} />
                      </div>
              <button
                type="submit"
                disabled={!userData || !userData.uid || !newTask.title.trim()}
                className="bg-[#00C570] hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-base shadow focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all duration-200 flex items-center gap-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FiPlus /> Tambah
              </button>
                    </form>
                  </div>
                </div>
              )}
      <style jsx global>{`
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease;
}
`}</style>
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

function formatActivityTime(ts: any) {
  if (!ts) return '';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diff < 1) return 'Baru saja';
  if (diff < 60) return `${diff} menit lalu`;
  if (diff < 1440) return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  return `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`;
  }
