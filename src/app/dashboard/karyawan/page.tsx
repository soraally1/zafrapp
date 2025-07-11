"use client"
import { useState, useRef, useEffect } from "react"
import {
  CalendarIcon,
  DollarSign,
  TrendingUp,
  Wallet,
  ChevronLeft,
  ChevronRight,
  FileText,
  PieChart,
  Gift,
  Shield,
  CheckCircle2,
  Star,
  Heart,
  Moon,
} from "lucide-react"
import Sidebar from "../../components/Sidebar"
import type React from "react"
import Topbar from "../../components/Topbar"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

// Updated Button Component with Islamic styling
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive" | "link"
  size?: "sm" | "md" | "lg" | "icon"
  children?: React.ReactNode
  className?: string
}

function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  const variants = {
    primary:
      "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
    secondary:
      "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 hover:from-amber-100 hover:to-amber-200 focus:ring-amber-300 border border-amber-200 shadow-md",
    ghost: "text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-300",
    outline: "border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-300 shadow-md",
    destructive:
      "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg",
    link: "text-emerald-600 hover:text-emerald-800 underline-offset-4 hover:underline focus:ring-emerald-300 p-0 h-auto",
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

// Updated Card Components with Islamic styling
interface CardProps {
  children: React.ReactNode
  className?: string
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden relative ${className}`}>
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-amber-400 rounded-full transform rotate-45"></div>
      </div>
      {children}
    </div>
  )
}

function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div
      className={`px-6 py-5 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/30 to-amber-50/30 ${className}`}
    >
      {children}
    </div>
  )
}

function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

function CardTitle({ children, className = "" }: CardProps) {
  return <h3 className={`text-lg font-bold text-emerald-800 ${className}`}>{children}</h3>
}

function CardDescription({ children, className = "" }: CardProps) {
  return <p className={`text-sm text-emerald-600 mt-1 ${className}`}>{children}</p>
}

// Updated Badge Component with Islamic colors
interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline" | "success"
  className?: string
}

function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300",
    secondary: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border border-slate-300",
    destructive: "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300",
    outline: "border border-emerald-200 text-emerald-700 bg-white",
    success: "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300",
  }
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Updated Progress Component with Islamic styling
interface ProgressProps {
  value: number
  className?: string
  showLabel?: boolean
}

function Progress({ value, className = "", showLabel = false }: ProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-emerald-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full bg-emerald-100 rounded-full h-3 shadow-inner">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

// Updated Dropdown Components
interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
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
          className={`absolute top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-emerald-100 py-2 z-50 ${align === "right" ? "right-0" : "left-0"
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
      className={`w-full text-left px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Updated Calendar Component with Islamic styling
interface CalendarProps {
  selectedDate: Date | null
  onDateSelect?: (date: Date) => void
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

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

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
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-emerald-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((day, idx) => (
          <div
            key={day + idx}
            className="text-center text-sm font-bold text-emerald-700 h-10 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => date && onDateSelect?.(date)}
            disabled={!date}
            className={`
              h-10 w-10 text-sm rounded-lg transition-all duration-200 text-center font-medium
              ${!date ? "invisible" : ""}
              ${isSelectedDate(date) ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg transform scale-105" : ""}
              ${isToday(date) && !isSelectedDate(date) ? "border-2 border-amber-400 text-amber-600 font-bold bg-amber-50" : ""}
              ${date && !isSelectedDate(date) && !isToday(date) ? "hover:bg-emerald-50 text-emerald-700 hover:scale-105" : "text-slate-500"}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

// Islamic Quote Component
function IslamicQuote({ quote, source }: { quote: string; source: string }) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl p-6 border border-emerald-200 shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-emerald-800 font-medium italic leading-relaxed mb-2">"{quote}"</p>
          <p className="text-emerald-600 text-sm font-semibold">— {source}</p>
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component with Islamic redesign
export default function KaryawanDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined)
  const [loadingUser, setLoadingUser] = useState(true)
  const [payroll, setPayroll] = useState<any>(null)
  const [payrollLoading, setPayrollLoading] = useState(true)
  const router = useRouter()
  const [zakatPayment, setZakatPayment] = useState<any>(null);
  const LAZ_OPTIONS = [
    "LAZ Dompet Dhuafa",
    "LAZ Rumah Zakat",
    "LAZ BAZNAS",
    "LAZ NU Care-LAZISNU",
    "LAZIS Muhammadiyah",
  ];
  const JENIS_OPTIONS = ["Zakat Profesi", "Infaq", "Sedekah"];
  const [selectedLaz, setSelectedLaz] = useState("");
  const [selectedJenis, setSelectedJenis] = useState("");
  const PAYMENT_METHODS = [
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'cash', label: 'Cash' },
  ];
  const [paymentMethod, setPaymentMethod] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [zakatPaying, setZakatPaying] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.uid) {
        try {
          const token = await user.getIdToken();
          // Fetch user profile from API
          const res = await fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          let profile = null;
          if (res.ok) profile = await res.json();
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

  const fetchPayroll = async (userId: string, month: string) => {
    setPayrollLoading(true);
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/payroll?userId=${userId}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPayroll(data);
      }
    } catch {
      // Handle error
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleMarkZakatPaid = async () => {
    if (!payroll) return;
    if (!payroll.id) return;
    if (!selectedLaz || !selectedJenis || !paymentMethod) return;
    try {
      setZakatPaying(true);
      const user = getAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      // Mark zakat as paid in zakatPayments
      await fetch(`/api/payroll/mark-zakat-paid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.uid, month: new Date().toISOString().slice(0, 7) })
      });
      // Log zakat payment for HR with LAZ, Jenis, and payment method
      const res = await fetch('/api/zakat-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          payrollId: payroll.id,
          month: payroll.month,
          amount: payroll.zakat,
          laz: selectedLaz,
          type: selectedJenis,
          paymentMethod: paymentMethod
        })
      });
      if (res.status === 409) {
        setSuccessMessage("Anda sudah menunaikan zakat untuk periode ini.");
        // Refetch zakatPayment to update UI
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const userId = user.uid;
        await fetchZakatPayment(userId, month);
        setTimeout(() => setSuccessMessage(""), 4000);
        setZakatPaying(false);
        return;
      }
      setSelectedLaz("");
      setSelectedJenis("");
      setPaymentMethod("");
      setSuccessMessage("Pembayaran zakat berhasil! Terima kasih telah menunaikan zakat.");
      // Refetch payroll and zakatPayment to update status
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const userId = user.uid;
      await fetchPayroll(userId, month);
      await fetchZakatPayment(userId, month);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch {
      // Handle error
    } finally {
      setZakatPaying(false);
    }
  };

  // Fetch zakatPayments for this user/month on mount and after payment
  const fetchZakatPayment = async (userId: string, month: string) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch(`/api/zakat-payments?userId=${userId}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setZakatPayment(data.data?.[0] || null);
      }
    } catch {}
  };

  useEffect(() => {
    if (!userName || !userRole || loadingUser) return;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    fetchPayroll(user.uid, month);
    fetchZakatPayment(user.uid, month);
  }, [userName, userRole, loadingUser]);

  useEffect(() => {
    if (!loadingUser && userRole && userRole !== "karyawan") {
      router.push("/login")
    }
  }, [loadingUser, userRole, router])

  if (loadingUser || (!userRole && !payrollLoading)) {
    return null
  }

  const events = [
    { date: "2024-01-15", title: "Meeting Tim", type: "meeting" },
    { date: "2024-01-20", title: "Training", type: "training" },
    { date: "2024-01-25", title: "Gajian", type: "salary" },
  ]

  const GOLD_PRICE_PER_GRAM = 1350000
  const NISAB_GRAM = 85
  const nisab = GOLD_PRICE_PER_GRAM * NISAB_GRAM
  const currentMonth = new Date().getMonth() + 1
  const yearToDateSavings = (payroll?.netSalary || 0) * (new Date().getMonth() + 1)
  const zakatPaid = zakatPayment?.zakatPaid === true;
  const zakatDue = payroll?.zakat > 0 && !zakatPaid

  // Debug log for zakatPayment and zakatPaid
  console.log('zakatPayment:', zakatPayment, 'zakatPaid:', zakatPaid);

  if (payrollLoading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar userName={userName} userRole={userRole} userPhoto={userPhoto} loading={loadingUser} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
            <div className="text-emerald-600">Memuat data payroll...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar userName={userName} userRole={userRole} userPhoto={userPhoto} loading={loadingUser} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">


          <div className="mb-8">
            <IslamicQuote
              quote="وَأَنْ لَيْسَ لِلْإِنْسَانِ إِلَّا مَا سَعَىٰ - Dan bahwasanya seorang manusia tiada memperoleh selain apa yang telah diusahakannya"
              source="QS. An-Najm: 39"
            />
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-bold text-emerald-800">Gaji Bulan Ini</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 mb-1">
                  Rp {((payroll?.netSalary || 0) * (new Date().getMonth() + 1)).toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +3.7% dari bulan lalu
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-bold text-emerald-800">Total Tahun Ini</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 mb-1">
                  Rp {((Number(payroll?.netSalary) || 0) * (new Date().getMonth() + 1)).toLocaleString("id-ID") || "0"}
                </div>
                <p className="text-xs text-emerald-600">{new Date().getMonth() + 1} bulan kerja</p>
              </CardContent>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-bold text-emerald-800">Bonus & Tunjangan</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Gift className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 mb-1">
                  Rp {payroll?.allowances?.other?.toLocaleString("id-ID") || "0"}
                </div>
                <p className="text-xs text-emerald-600">Bonus kinerja Q4</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-bold text-emerald-800">Status Zakat</CardTitle>
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 mb-1">
                  Rp {payroll?.zakat?.toLocaleString("id-ID") || "0"}
                </div>
                <Badge variant={payroll?.zakat > 0 ? "destructive" : "success"} className="mt-1">
                  {payroll?.zakat > 0 ? "Wajib Zakat" : "Belum Wajib"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle>Rincian Gaji Bulan Ini</CardTitle>
                      <CardDescription>
                        Detail pendapatan dan potongan bulan{" "}
                        {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                      <h4 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Pendapatan
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-emerald-700 font-medium">Gaji Pokok</span>
                          <span className="font-bold text-emerald-800">
                            Rp {payroll?.basicSalary?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-emerald-700 font-medium">Tunjangan Jabatan</span>
                          <span className="font-bold text-emerald-800">
                            Rp {payroll?.allowances?.positionAllowance?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-emerald-700 font-medium">Tunjangan Transport</span>
                          <span className="font-bold text-emerald-800">
                            Rp {payroll?.allowances?.transportAllowance?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-emerald-200 pt-4 mt-4">
                        <div className="flex justify-between items-center bg-emerald-600 text-white rounded-lg p-3">
                          <span className="font-bold">Total Pendapatan</span>
                          <span className="font-bold text-lg">
                            Rp {payroll?.totalEarnings?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                      <h4 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Potongan
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-red-700 font-medium">BPJS Kesehatan</span>
                          <span className="text-red-600 font-bold">
                            -Rp {payroll?.deductions?.healthInsurance?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-red-700 font-medium">BPJS Ketenagakerjaan</span>
                          <span className="text-red-600 font-bold">
                            -Rp {payroll?.deductions?.employmentInsurance?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm bg-white rounded-lg p-3 shadow-sm">
                          <span className="text-red-700 font-medium">PPh 21</span>
                          <span className="text-red-600 font-bold">
                            -Rp {payroll?.deductions?.incomeTax?.toLocaleString("id-ID") || "0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-6 border-2 border-green-300 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-800 flex items-center gap-2">
                          <Wallet className="w-6 h-6" />
                          Take Home Pay
                        </span>
                        <span className="text-2xl font-bold text-green-700">
                          Rp {payroll?.netSalary?.toLocaleString("id-ID") || "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-amber-200">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-amber-800">Perhitungan Zakat</CardTitle>
                      <CardDescription className="text-amber-700">
                        Berdasarkan total tabungan dan penghasilan
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">

                  <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl p-4 border border-emerald-200">
                    <p className="text-emerald-800 font-medium italic text-center mb-2">
                      "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ"
                    </p>
                    <p className="text-emerald-600 text-sm text-center">
                      "Dan dirikanlah shalat, tunaikanlah zakat" - QS. Al-Baqarah: 43
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${zakatPaid ? "bg-green-500 text-white" : "bg-emerald-500 text-white"}`}
                      >
                        1
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-emerald-800">Perhitungan Zakat</span>
                        <span className="block text-sm text-emerald-600">(Otomatis dari gaji & tabungan)</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-700">
                        Rp {payroll?.zakat?.toLocaleString("id-ID") || "0"}
                      </span>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700 border border-emerald-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="font-semibold">Nisab</p>
                          <p className="font-bold text-emerald-800">Rp {nisab.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Tabungan</p>
                          <p className="font-bold text-emerald-800">Rp {yearToDateSavings.toLocaleString("id-ID")}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Zakat</p>
                          <p className="font-bold text-emerald-800">
                            Rp {payroll?.zakat?.toLocaleString("id-ID") || "0"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${zakatPaid ? "bg-green-500 text-white" : zakatDue ? "bg-amber-500 text-white" : "bg-gray-400 text-white"}`}
                      >
                        2
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-amber-800">Pembayaran Zakat</span>
                        <span className="block text-sm text-amber-600">
                          {zakatPaid
                            ? "Alhamdulillah, sudah terbayar"
                            : zakatDue
                              ? "Menunggu pembayaran"
                              : "Tidak wajib saat ini"}
                        </span>
                      </div>
                      {zakatPaid && (
                        <Badge variant="success" className="font-bold">
                          ✓ Selesai
                        </Badge>
                      )}
                      {zakatDue && !zakatPaid && (
                        <Badge variant="destructive" className="font-bold">
                          Belum Dibayar
                        </Badge>
                      )}
                    </div>

                    {zakatDue && !zakatPaid && (
                      <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl p-6 border-2 border-amber-300 shadow-lg">
                        <h4 className="font-bold text-amber-800 mb-4 text-center">Tunaikan Zakat Anda</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-amber-800 mb-2">Pilih LAZ Tujuan</label>
                            <select
                              className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg bg-white text-amber-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                              value={selectedLaz}
                              onChange={e => setSelectedLaz(e.target.value)}
                              disabled={zakatPaying}
                            >
                              <option value="">-- Pilih LAZ --</option>
                              {LAZ_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-amber-800 mb-2">Pilih Jenis</label>
                            <select
                              className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg bg-white text-amber-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                              value={selectedJenis}
                              onChange={e => setSelectedJenis(e.target.value)}
                              disabled={zakatPaying}
                            >
                              <option value="">-- Pilih Jenis --</option>
                              {JENIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-amber-800 mb-2">Pilih Metode Pembayaran</label>
                            <select
                              className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg bg-white text-amber-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                              value={paymentMethod}
                              onChange={e => setPaymentMethod(e.target.value)}
                              disabled={zakatPaying}
                            >
                              <option value="">-- Pilih Metode Pembayaran --</option>
                              {PAYMENT_METHODS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                          <Button
                            className="w-full text-lg font-bold py-4"
                            variant="primary"
                            size="lg"
                            onClick={handleMarkZakatPaid}
                            disabled={zakatPaying || !selectedLaz || !selectedJenis || !paymentMethod}
                          >
                            {zakatPaying ? "Memproses Pembayaran..." : "💰 Bayar Zakat Sekarang"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {zakatPaid && (
                      <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-6 border-2 border-green-300 shadow-lg animate-pulse mt-4">
                        <div className="flex items-center justify-center gap-4">
                          <CheckCircle2 className="text-green-600 w-8 h-8" />
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-800">بارك الله فيك</p>
                            <p className="text-green-700 font-semibold">Pembayaran Zakat Selesai! 🎉</p>
                            <p className="text-sm text-green-600 mt-1">
                              Semoga Allah menerima dan memberkahi zakat Anda
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>


            <div className="space-y-6">
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle>Kalender</CardTitle>
                      <CardDescription>
                        {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </CardContent>
              </Card>

              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle>Event Mendatang</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.date + "-" + event.title}
                      className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 border border-emerald-200 shadow-sm"
                    >
                      <div
                        className={`mt-1 flex-shrink-0 h-3 w-3 rounded-full shadow-sm ${event.type === "meeting"
                            ? "bg-blue-500"
                            : event.type === "training"
                              ? "bg-purple-500"
                              : "bg-green-500"
                          }`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-800 truncate">{event.title}</p>
                        <p className="text-xs text-emerald-600 font-medium">
                          {new Date(event.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize font-semibold">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle>Ringkasan Keuangan</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-emerald-700 font-medium">Gaji Rata-rata</span>
                      <span className="font-bold text-emerald-800">
                        Rp {payroll?.netSalary?.toLocaleString("id-ID") || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-amber-700 font-medium">Total Bonus 2024</span>
                      <span className="font-bold text-amber-800">
                        Rp {payroll?.allowances?.other?.toLocaleString("id-ID") || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-700 font-medium">Zakat Terbayar</span>
                      <span className="font-bold text-green-800">
                        Rp {zakatPaid ? payroll?.zakat?.toLocaleString("id-ID") : "0"}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-emerald-200 pt-4">
                    <div className="bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-lg p-4 border border-emerald-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-emerald-800">Proyeksi Tahun Ini</span>
                        <span className="text-xl font-bold text-emerald-700">
                          Rp {((payroll?.netSalary || 0) * 12).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-purple-800 font-medium italic mb-2">
                    "Barangsiapa yang menghendaki kehidupan dunia dan perhiasannya, niscaya Kami berikan kepada mereka
                    balasan pekerjaan mereka di dunia dengan sempurna"
                  </p>
                  <p className="text-purple-600 text-sm font-semibold">— QS. Hud: 15</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
