import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiBookOpen, FiLayers, FiBarChart2, FiTrendingUp, FiActivity, FiGift } from "react-icons/fi";

const reportIcons = [
  <FiBookOpen key="journal" className="text-3xl text-[#00C570]" />,
  <FiLayers key="ledger" className="text-3xl text-[#EAB308]" />,
  <FiBarChart2 key="balance" className="text-3xl text-[#2563EB]" />,
  <FiTrendingUp key="pl" className="text-3xl text-[#00C570]" />,
  <FiActivity key="cash" className="text-3xl text-[#EAB308]" />,
  <FiGift key="zis" className="text-3xl text-[#2563EB]" />,
];

const reportDescriptions: Record<string, string> = {
  'Jurnal Umum': 'Catatan transaksi harian perusahaan.',
  'Buku Besar': 'Ringkasan akun keuangan utama.',
  'Neraca': 'Posisi keuangan: aset, liabilitas, ekuitas.',
  'Laba Rugi': 'Pendapatan dan beban periode berjalan.',
  'Arus Kas': 'Aliran masuk & keluar kas.',
  'Dana Sosial Khusus': 'Laporan dana sosial & zakat.',
};

const reportTooltips: Record<string, string> = {
  'Jurnal Umum': 'Lihat detail semua transaksi harian.',
  'Buku Besar': 'Lihat ringkasan akun utama.',
  'Neraca': 'Lihat posisi keuangan perusahaan.',
  'Laba Rugi': 'Lihat laporan laba rugi.',
  'Arus Kas': 'Lihat arus kas masuk & keluar.',
  'Dana Sosial Khusus': 'Lihat laporan dana sosial & zakat.',
};

const reportPageMap: Record<string, string> = {
  'Jurnal Umum': 'journal',
  'Buku Besar': 'ledger',
  'Neraca': 'balance',
  'Laba Rugi': 'pl',
  'Arus Kas': 'cash',
  'Dana Sosial Khusus': 'zis',
};

type Report = {
  label: string;
  createdAt?: string;
  status?: string;
  [key: string]: any;
};

interface ReportCardsProps {
  reports: Report[];
  className?: string;
}

const ReportCards: React.FC<ReportCardsProps> = React.memo(({ reports, className = "" }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const router = useRouter();
  if (!reports || reports.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[120px] text-gray-400 ${className}`}>
        <Image src="/zafra.svg" alt="ZAFRA" width={40} height={40} className="mb-2 opacity-20" />
        <span className="text-lg font-semibold">Belum ada laporan</span>
        <span className="text-xs">Laporan keuangan akan muncul di sini.</span>
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {reports.map((report, idx) => (
        <div
          key={report.label + (report.createdAt || idx)}
          tabIndex={0}
          className="relative flex flex-col items-center bg-white/60 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-[#e0e0e0] group cursor-pointer focus:ring-2 focus:ring-[#00C570] transition-all duration-200 hover:shadow-xl overflow-hidden"
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
          onFocus={() => setHoveredIdx(idx)}
          onBlur={() => setHoveredIdx(null)}
          onClick={() => {
            const page = reportPageMap[report.label];
            if (page) {
              router.push(`/dashboard/hr-keuangan/reports?page=${page}`);
            }
          }}
        >
          {/* ZAFRA watermark logo */}
          <Image src="/zafra.svg" alt="ZAFRA" width={32} height={32} className="absolute bottom-2 right-2 opacity-10 pointer-events-none select-none" />
          {/* Unique react-icon */}
          <span className="text-4xl mb-2">
            {reportIcons[idx % reportIcons.length]}
          </span>
          {/* Report label */}
          <span className="font-semibold text-gray-800 mb-1 group-hover:text-[#00C570] transition-colors text-center">{report.label}</span>
          {/* Short description */}
          <span className="text-xs text-gray-500 mb-1 text-center">{reportDescriptions[report.label] || ''}</span>
          {/* Created at */}
          {report.createdAt && (
            <span className="text-[10px] text-gray-400 mb-1">{new Date(report.createdAt).toLocaleDateString('id-ID')}</span>
          )}
          {/* Status */}
          {report.status && (
            <span className={`text-xs font-bold mb-1 ${report.status === 'done' ? 'text-green-600' : 'text-yellow-600'}`}>{report.status}</span>
          )}
          {/* Tooltip on hover/focus only */}
          {hoveredIdx === idx && (
            <span className="absolute top-2 left-2 z-10 bg-[#171B2A] text-white text-xs rounded px-2 py-1 pointer-events-auto">
              {reportTooltips[report.label] || ''}
            </span>
          )}
          {/* CTA button */}
          <button
            className="mt-auto bg-[#00C570] hover:bg-green-600 text-white px-4 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all duration-200"
            tabIndex={-1}
            onClick={e => {
              e.stopPropagation();
              const page = reportPageMap[report.label];
              if (page) {
                router.push(`/dashboard/hr-keuangan/reports?page=${page}`);
              }
            }}
          >
            Lihat
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M5 8h6M9 6l2 2-2 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
});

export default ReportCards; 