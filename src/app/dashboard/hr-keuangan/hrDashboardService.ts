// Service for HR Dashboard data (dummy/static for now)

export function getSummary() {
  return [
    { label: "Gaji Bulan Ini", value: "Rp 120.000.000", color: "bg-[#E6FFF4] text-[#00C570]" },
    { label: "Zakat Terkumpul", value: "Rp 8.500.000", color: "bg-[#FFF9E6] text-[#EAB308]" },
    { label: "Karyawan Aktif", value: "32 Orang", color: "bg-[#E6F0FF] text-[#2563EB]" },
  ];
}

export function getStats() {
  return [
    { label: "Total Gaji Dibayarkan", value: "Rp 1.200.000.000" },
    { label: "Karyawan", value: "32" },
    { label: "Zakat/Donasi", value: "Rp 85.000.000" },
    { label: "Slip Gaji Bulan Ini", value: "32" },
  ];
}

export function getTasks() {
  return [
    { title: "Verifikasi slip gaji", date: "21 Mei 2024" },
    { title: "Input data karyawan baru", date: "20 Mei 2024" },
  ];
}

export function getUpcoming() {
  return [
    { title: "Jadwal Pembayaran Gaji", date: "25 Mei 2024", time: "09:00" },
    { title: "Distribusi Zakat", date: "27 Mei 2024", time: "13:00" },
  ];
}

export function getReports() {
  return [
    { label: "Jurnal Umum", icon: "📒" },
    { label: "Buku Besar", icon: "📚" },
    { label: "Neraca", icon: "📊" },
    { label: "Laba Rugi", icon: "💹" },
    { label: "Arus Kas", icon: "💵" },
    { label: "Dana Sosial Khusus", icon: "🤲" },
  ];
} 