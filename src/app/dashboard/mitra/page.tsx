"use client"

import { useState, useRef, useEffect } from "react"
import {
  Bell,
  CalendarIcon,
  DollarSign,
  Home,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  User,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  Users,
  BarChart3,
  ArrowUpRight,
  Circle,
  CheckCircle,
  AlertCircle,
  PieChart,
  CreditCard,
  FileText,
  HelpCircle,
} from "lucide-react"
import Sidebar from "../../components/Sidebar"
import Image from "next/image"

// Enhanced Button Component with more variants and sizes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive" | "link"
  size?: "sm" | "md" | "lg" | "icon"
  children?: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

function Button({ 
  variant = "primary", 
  size = "md", 
  className = "", 
  children, 
  icon,
  iconPosition = "left",
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  
  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow hover:shadow-md",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow hover:shadow-md",
    link: "text-green-600 hover:text-green-800 underline-offset-4 hover:underline focus:ring-green-500 p-0 h-auto",
  }

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  }

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className={`mr-2 ${!children ? 'mr-0' : ''}`}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className={`ml-2 ${!children ? 'ml-0' : ''}`}>{icon}</span>
      )}
    </button>
  )
}

// Enhanced Card Components with hover effects
interface CardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
}

function Card({ children, className = "", hoverEffect = false }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all ${hoverEffect ? 'hover:shadow-md hover:border-green-100' : ''} ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${className}`}>{children}</div>
}

function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

function CardTitle({ children, className = "" }: CardProps) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
}

function CardDescription({ children, className = "" }: CardProps) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
}

// Enhanced Badge Component with more variants
interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  className?: string
  icon?: React.ReactNode
}

function Badge({ children, variant = "default", className = "", icon }: BadgeProps) {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 text-gray-700",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-50 text-blue-600",
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </span>
  )
}

// Enhanced Progress Component with labels
interface ProgressProps {
  value: number
  className?: string
  showLabel?: boolean
  labelPosition?: "inside" | "outside"
  color?: "green" | "blue" | "red" | "yellow" | "indigo"
}

function Progress({ 
  value, 
  className = "", 
  showLabel = false, 
  labelPosition = "outside",
  color = "green"
}: ProgressProps) {
  const colors = {
    green: "bg-green-600",
    blue: "bg-blue-600",
    red: "bg-red-600",
    yellow: "bg-yellow-500",
    indigo: "bg-indigo-600",
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && labelPosition === "outside" && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.min(100, Math.max(0, value))}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${colors[color]} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        >
          {showLabel && labelPosition === "inside" && (
            <span className="text-xs text-white pl-2">{value}%</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Mitra Dashboard Component
export default function MitraDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Sample data for UMKM/Business
  const businessData = {
    monthlyRevenue: 45000000,
    lastMonthRevenue: 42000000,
    yearToDateRevenue: 480000000,
    commission: 4500000,
    growthRate: 7.1,
    activeBusinesses: 24,
    averageRevenue: 42500000,
    totalCommission: 48000000,
    zakatPaid: 11250000,
    projectedRevenue: 540000000,
  }

  const zakatData = {
    nisab: 85000000,
    businessAssets: 150000000,
    zakatAmount: 3750000,
    zakatDue: true,
    nisabPercentage: Math.round((150000000 / 85000000) * 100),
  }

  const performanceMetrics = {
    monthlyTarget: 89,
    clientSatisfaction: 94,
    businessRetention: 87,
    rating: "Excellent",
  }

  const events = [
    { date: "2024-01-15", title: "Pelatihan UMKM", type: "training", icon: <FileText className="h-4 w-4" /> },
    { date: "2024-01-20", title: "Audit Keuangan", type: "audit", icon: <CreditCard className="h-4 w-4" /> },
    { date: "2024-01-25", title: "Pembayaran Komisi", type: "payment", icon: <DollarSign className="h-4 w-4" /> },
    { date: "2024-01-30", title: "Rapat Mitra", type: "meeting", icon: <Users className="h-4 w-4" /> },
  ]

  const financialData = {
    income: [
      { name: "Penjualan Produk", amount: 35000000 },
      { name: "Jasa Konsultasi", amount: 8000000 },
      { name: "Pendapatan Lainnya", amount: 2000000 },
    ],
    expenses: [
      { name: "Biaya Produksi", amount: 18000000 },
      { name: "Biaya Operasional", amount: 5500000 },
      { name: "Biaya Marketing", amount: 3200000 },
      { name: "Pajak UMKM", amount: 450000 },
    ],
    totalIncome: 45000000,
    totalExpenses: 27150000,
    netProfit: 17850000,
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Sticky Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="mt-10">
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="h-6 w-6 text-green-600" />
                  Dashboard Mitra
                </h1>
                <p className="text-sm text-gray-500">
                  Selamat datang kembali, <span className="font-bold text-green-700">Mitra Sukses</span>! 🚀
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Monthly Revenue Card */}
            <Card hoverEffect>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Omzet Bulan Ini</CardTitle>
                <div className="p-2 rounded-lg bg-green-50">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">Rp {businessData.monthlyRevenue.toLocaleString("id-ID")}</div>
                <div className="flex items-center mt-2">
                  <Badge variant="success" className="mr-2" icon={<ArrowUpRight className="h-3 w-3" />}>
                    +{businessData.growthRate}%
                  </Badge>
                  <span className="text-xs text-gray-500">dari bulan lalu</span>
                </div>
              </CardContent>
            </Card>

            {/* YTD Revenue Card */}
            <Card hoverEffect>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Omzet 2024</CardTitle>
                <div className="p-2 rounded-lg bg-blue-50">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">Rp {businessData.yearToDateRevenue.toLocaleString("id-ID")}</div>
                <p className="text-xs text-gray-500 mt-2">11 bulan operasional</p>
              </CardContent>
            </Card>

            {/* Commission Card */}
            <Card hoverEffect>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium ">Komisi Mitra</CardTitle>
                <div className="p-2 rounded-lg bg-purple-50">
                  <Wallet className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900" >Rp {businessData.commission.toLocaleString("id-ID")}</div>
                <p className="text-xs text-gray-500 mt-2">10% dari omzet bulanan</p>
              </CardContent>
            </Card>

            {/* Zakat Status Card */}
            <Card hoverEffect>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status Zakat Usaha</CardTitle>
                <Badge 
                  variant={zakatData.zakatDue ? "destructive" : "secondary"} 
                  icon={zakatData.zakatDue ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                >
                  {zakatData.zakatDue ? "Wajib" : "Belum Wajib"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">Rp {zakatData.zakatAmount.toLocaleString("id-ID")}</div>
                <p className="text-xs text-gray-500 mt-2">Zakat perdagangan 2.5%</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column - Financial Reports */}
            <div className="lg:col-span-2 space-y-5">
              {/* Financial Report Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Laporan Keuangan UMKM</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Bulan Ini
                    </Button>
                    <Button variant="ghost" size="sm">
                      Lihat Semua
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Income Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Pendapatan</h4>
                      <div className="space-y-3 text-slate-900">
                        {financialData.income.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Circle className="h-2 w-2 text-green-500 mr-2" />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">Rp {item.amount.toLocaleString("id-ID")}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 my-3 pt-3 flex justify-between items-center font-medium">
                        <span>Total Pendapatan</span>
                        <span>Rp {financialData.totalIncome.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Pengeluaran</h4>
                      <div className="space-y-3 text-slate-900">
                        {financialData.expenses.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Circle className="h-2 w-2 text-red-500 mr-2" />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium text-red-600">-Rp {item.amount.toLocaleString("id-ID")}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 my-3 pt-3 flex justify-between items-center font-medium">
                        <span className="text-black">Total Pengeluaran</span>
                        <span className="text-red-600">-Rp {financialData.totalExpenses.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    {/* Net Profit */}
                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center font-bold text-lg">
                      <span className="text-black">Laba Bersih</span>
                      <span className="text-green-600">Rp {financialData.netProfit.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zakat Calculation Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Perhitungan Zakat Perdagangan</CardTitle>
                  <Button variant="outline" size="sm" icon={<PieChart className="h-4 w-4" />}>
                    Detail Perhitungan
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-slate-900">
                    <div className="flex justify-between items-center text-sm">
                      <span>Nisab (85 gram emas)</span>
                      <span className="font-medium">Rp {zakatData.nisab.toLocaleString("id-ID")}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Total Aset Usaha</span>
                      <span className="font-medium">Rp {zakatData.businessAssets.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress ke Nisab</span>
                        <span>{zakatData.nisabPercentage}%</span>
                      </div>
                      <Progress 
                        value={zakatData.nisabPercentage} 
                        color={zakatData.zakatDue ? "green" : "blue"}
                        showLabel={false}
                      />
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-medium">
                      <span>Zakat Perdagangan (2.5%)</span>
                      <span className="text-green-600">Rp {zakatData.zakatAmount.toLocaleString("id-ID")}</span>
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      variant={zakatData.zakatDue ? "primary" : "secondary"}
                      icon={zakatData.zakatDue ? <ArrowUpRight className="h-4 w-4" /> : null}
                    >
                      {zakatData.zakatDue ? "Bayar Zakat Sekarang" : "Belum Mencapai Nisab"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Calendar and Summary */}
            <div className="space-y-5">
              {/* Calendar Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Kalender Bisnis</CardTitle>
                  <Button variant="ghost" size="sm">
                    Tambah Event
                  </Button>
                </CardHeader>
                <CardContent className="p-0 ">
                  <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </CardContent>
              </Card>

              {/* Upcoming Events Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Mendatang</CardTitle>
                  <Button variant="link" size="sm">
                    Lihat Semua
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {events.map((event, index) => (
                    <div 
                      key={index} 
                      className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        {event.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Business Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan UMKM</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "UMKM Aktif", value: `${businessData.activeBusinesses} Usaha` },
                    { label: "Omzet Rata-rata", value: `Rp ${businessData.averageRevenue.toLocaleString("id-ID")}` },
                    { label: "Total Komisi 2024", value: `Rp ${businessData.totalCommission.toLocaleString("id-ID")}` },
                    { label: "Zakat Terbayar", value: `Rp ${businessData.zakatPaid.toLocaleString("id-ID")}` },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-medium">
                    <span>Proyeksi Omzet 2024</span>
                    <span className="text-green-600">Rp {businessData.projectedRevenue.toLocaleString("id-ID")}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Performa Mitra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Target Bulanan", value: performanceMetrics.monthlyTarget, color: "indigo" },
                    { label: "Kepuasan Klien", value: performanceMetrics.clientSatisfaction, color: "green" },
                    { label: "Retensi UMKM", value: performanceMetrics.businessRetention, color: "blue" },
                  ].map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{metric.label}</span>
                        <span>{metric.value}%</span>
                      </div>
                      <Progress 
                        value={metric.value} 
                        color={metric.color as any}
                        showLabel={false}
                      />
                    </div>
                  ))}
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Badge variant="success" icon={<CheckCircle className="h-3 w-3" />}>
                        {performanceMetrics.rating}
                      </Badge>
                      <span className="text-sm font-medium">Rating Mitra</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Performa di atas rata-rata mitra lainnya</p>
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

// Dropdown Components (unchanged from your original)
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
          className={`absolute top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 ${
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
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Calendar Component (unchanged from your original)
interface CalendarProps {
  selectedDate?: Date
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

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

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
        <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-medium">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
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
              h-8 w-8 text-sm rounded-md transition-colors
              ${!date ? "invisible" : ""}
              ${isSelectedDate(date) ? "bg-green-600 text-white" : ""}
              ${isToday(date) && !isSelectedDate(date) ? "bg-green-100 text-green-600" : ""}
              ${date && !isSelectedDate(date) && !isToday(date) ? "hover:bg-gray-100" : ""}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}