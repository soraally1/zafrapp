"use client"

import { useState, useRef, useEffect } from "react"
import {
  CalendarIcon,
  DollarSign,
  Home,

  Settings,
  TrendingUp,
  Wallet,
  ChevronLeft,
  ChevronRight,
  FileText,
  PieChart,
  Gift,
  Shield,
} from "lucide-react"
import Sidebar from "../../components/Sidebar"
import type React from "react"
import Topbar from "../../components/Topbar";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "@/app/api/service/userProfileService";
import { getUserPayroll } from "@/app/api/service/payrollService";
import { useRouter } from "next/navigation";

// Updated Button Component with modern styling
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive" | "link"
  size?: "sm" | "md" | "lg" | "icon"
  children?: React.ReactNode
  className?: string
}

function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
    secondary: "bg-gray-50 text-gray-900 hover:bg-gray-100 focus:ring-gray-300 border border-gray-200 shadow-sm",
    ghost: "text-gray-600 hover:bg-gray-50 focus:ring-gray-300",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    link: "text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline focus:ring-indigo-300 p-0 h-auto"
  }

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

// Updated Card Components with modern styling
interface CardProps {
  children: React.ReactNode
  className?: string
}

function Card({ children, className = "" }: CardProps) {
  return <div className={`bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden ${className}`}>{children}</div>
}

function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`px-5 py-4 border-b border-gray-100 ${className}`}>{children}</div>
}

function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

function CardTitle({ children, className = "" }: CardProps) {
  return <h3 className={`text-base font-semibold text-gray-900 ${className}`}>{children}</h3>
}

function CardDescription({ children, className = "" }: CardProps) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>
}

// Updated Badge Component
interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline" | "success"
  className?: string
}

function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-indigo-100 text-indigo-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-200 text-gray-700 bg-white",
    success: "bg-green-100 text-green-800"
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Updated Progress Component
interface ProgressProps {
  value: number
  className?: string
  showLabel?: boolean
}

function Progress({ value, className = "", showLabel = false }: ProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

// Updated Dropdown Components
interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}

function Dropdown({ trigger, children, align = "left" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownItem({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Updated Calendar Component with modern styling
interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect?: (date: Date) => void;
}

function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const dayNames = ["M", "S", "S", "R", "K", "J", "S"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const days = getDaysInMonth(currentDate)

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const isSelectedDate = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    return date.toDateString() === new Date().toDateString()
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={goToPreviousMonth} 
          className="p-1 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button 
          onClick={goToNextMonth} 
          className="p-1 hover:bg-gray-50 rounded-md text-gray-500 hover:text-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => date && onDateSelect?.(date)}
            disabled={!date}
            className={`
              h-8 w-8 text-sm rounded-md transition-colors text-center
              ${!date ? "invisible" : ""}
              ${isSelectedDate(date) ? "bg-indigo-600 text-white font-medium" : ""}
              ${isToday(date) && !isSelectedDate(date) ? "border border-indigo-200 text-indigo-600 font-medium" : ""}
              ${date && !isSelectedDate(date) && !isToday(date) ? "hover:bg-gray-50 text-gray-700" : "text-gray-500"}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

// Main Dashboard Component with modern redesign
export default function KaryawanDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined);
  const [loadingUser, setLoadingUser] = useState(true);
  const [payroll, setPayroll] = useState<any>(null);
  const [payrollLoading, setPayrollLoading] = useState(true);
  const [payrollError, setPayrollError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserName(profile?.name || "");
          setUserRole(profile?.role || "");
          setUserPhoto(profile?.photo);
        } catch {
          setUserName("");
          setUserRole("");
          setUserPhoto(undefined);
        }
      } else {
        setUserName("");
        setUserRole("");
        setUserPhoto(undefined);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userName || !userRole || loadingUser) return;
    // Get current month in YYYY-MM
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    // Get userId from auth
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    setPayrollLoading(true);
    getUserPayroll(user.uid, month)
      .then(res => {
        if (res.success) {
          setPayroll(res.data);
        } else {
          setPayrollError("Gagal mengambil data payroll");
        }
      })
      .catch(() => setPayrollError("Gagal mengambil data payroll"))
      .finally(() => setPayrollLoading(false));
  }, [userName, userRole, loadingUser]);

  useEffect(() => {
    if (!loadingUser && userRole && userRole !== "karyawan") {
      router.push("/login");
    }
  }, [loadingUser, userRole, router]);

  if (loadingUser || (!userRole && !payrollLoading)) {
    return null; // or a spinner
  }

  // Remove sample salaryData and zakatData
  // In the JSX, replace salaryData and zakatData usages with payroll fields, e.g.:
  // salaryData.currentMonth -> payroll?.netSalary
  // salaryData.yearToDate -> payroll?.netSalary * (now.getMonth() + 1) (if you want a simple YTD sum)
  // salaryData.bonus -> payroll?.allowances?.other
  // zakatData.zakatAmount -> payroll?.zakat
  // zakatData.nisab, zakatData.currentSavings: you may need to fetch or calculate separately, or use placeholders
  // zakatData.zakatDue: payroll?.zakat > 0
  // Fallback to 0 or placeholders if payroll is null or loading

  const events = [
    { date: "2024-01-15", title: "Meeting Tim", type: "meeting" },
    { date: "2024-01-20", title: "Training", type: "training" },
    { date: "2024-01-25", title: "Gajian", type: "salary" },
  ]

  const sidebarItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Wallet, label: "Gaji & Tunjangan" },
    { icon: FileText, label: "Slip Gaji" },
    { icon: CalendarIcon, label: "Kalender" },
    { icon: PieChart, label: "Laporan" },
    { icon: Settings, label: "Pengaturan" },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">

      <Sidebar/>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar userName={userName} userRole={userRole} userPhoto={userPhoto} loading={loadingUser} />
        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Salary overview cards - Modern grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gaji Bulan Ini</CardTitle>
                <DollarSign className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">Rp {payroll?.netSalary?.toLocaleString("id-ID") || "0"}</div>
                <p className="text-xs text-gray-500 mt-1">+3.7% dari bulan lalu</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tahun Ini</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">Rp {payroll?.netSalary * (new Date().getMonth() + 1) || "0"}</div>
                <p className="text-xs text-gray-500 mt-1">11 bulan kerja</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bonus</CardTitle>
                <Gift className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">Rp {payroll?.allowances?.other || "0"}</div>
                <p className="text-xs text-gray-500 mt-1">Bonus kinerja Q4</p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Zakat</CardTitle>
                <Shield className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">Rp {payroll?.zakat || "0"}</div>
                <Badge variant={payroll?.zakat > 0 ? "destructive" : "secondary"} className="mt-1">
                  {payroll?.zakat > 0 ? "Wajib Zakat" : "Belum Wajib"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Salary breakdown - Modern card design */}
            <div className="lg:col-span-2 space-y-5">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Rincian Gaji Bulan Ini</CardTitle>
                  <CardDescription>Detail pendapatan dan potongan bulan Januari 2024</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Pendapatan</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Gaji Pokok</span>
                          <span className="font-medium">Rp {payroll?.basicSalary || "0"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Tunjangan Jabatan</span>
                          <span className="font-medium">Rp {payroll?.allowances?.positionAllowance || "0"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Tunjangan Transport</span>
                          <span className="font-medium">Rp {payroll?.allowances?.transportAllowance || "0"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>Total Pendapatan</span>
                        <span>Rp {payroll?.totalEarnings || "0"}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Potongan</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">BPJS Kesehatan</span>
                          <span className="text-red-600 font-medium">-Rp {payroll?.deductions?.healthInsurance || "0"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">BPJS Ketenagakerjaan</span>
                          <span className="text-red-600 font-medium">-Rp {payroll?.deductions?.employmentInsurance || "0"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">PPh 21</span>
                          <span className="text-red-600 font-medium">-Rp {payroll?.deductions?.incomeTax || "0"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Take Home Pay</span>
                        <span className="text-lg font-bold text-green-600">Rp {payroll?.netSalary || "0"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zakat calculation - Modern card */}
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Perhitungan Zakat</CardTitle>
                  <CardDescription>Berdasarkan total tabungan dan penghasilan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Nisab (85 gram emas)</span>
                        <span className="font-medium">Rp {payroll?.nisab || "0"}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Tabungan</span>
                        <span className="font-medium">Rp {payroll?.totalSavings || "0"}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress ke Nisab</span>
                        <span>{Math.round((payroll?.totalSavings / payroll?.nisab) * 100) || "0"}%</span>
                      </div>
                      <Progress value={(payroll?.totalSavings / payroll?.nisab) * 100 || 0} />
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span>Zakat Wajib (2.5%)</span>
                        <span className="text-green-600">Rp {payroll?.zakat || "0"}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={payroll?.zakat > 0 ? "primary" : "secondary"}
                      size="lg"
                    >
                      {payroll?.zakat > 0 ? "Bayar Zakat Sekarang" : "Belum Wajib Zakat"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar - Calendar and events */}
            <div className="space-y-5">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Kalender</CardTitle>
                  <CardDescription>Januari 2024</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Event Mendatang</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`mt-1 flex-shrink-0 h-2 w-2 rounded-full ${
                        event.type === 'meeting' ? 'bg-blue-500' : 
                        event.type === 'training' ? 'bg-purple-500' : 
                        'bg-green-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle>Ringkasan Keuangan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Gaji Rata-rata</span>
                      <span className="font-medium">Rp {payroll?.netSalary || "0"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Bonus 2024</span>
                      <span className="font-medium">Rp {payroll?.allowances?.other || "0"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Zakat Terbayar</span>
                      <span className="font-medium">Rp {payroll?.zakat || "0"}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Proyeksi Tahun Ini</span>
                      <span className="text-lg font-bold text-indigo-600">Rp {payroll?.netSalary * 12 || "0"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}