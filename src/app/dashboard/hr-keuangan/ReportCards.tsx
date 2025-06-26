import Image from "next/image";
import React, { useState } from "react";

const reportIcons = [
  <svg key="0" width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="16" rx="4" fill="#00C570" fillOpacity="0.15"/><path d="M8 16h16M8 20h10" stroke="#00C570" strokeWidth="2" strokeLinecap="round"/></svg>,
  <svg key="1" width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#EAB308" fillOpacity="0.15"/><path d="M16 10v12M10 16h12" stroke="#EAB308" strokeWidth="2" strokeLinecap="round"/></svg>,
  <svg key="2" width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="8" fill="#2563EB" fillOpacity="0.15"/><path d="M16 12v8M12 16h8" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/></svg>,
  <svg key="3" width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" rx="6" fill="#00C570" fillOpacity="0.10"/><path d="M10 22l6-6 6 6" stroke="#00C570" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg key="4" width="32" height="32" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#EAB308" fillOpacity="0.10"/><path d="M10 22h12M16 10v12" stroke="#EAB308" strokeWidth="2" strokeLinecap="round"/></svg>,
  <svg key="5" width="32" height="32" fill="none" viewBox="0 0 32 32"><rect x="8" y="8" width="16" height="16" rx="8" fill="#2563EB" fillOpacity="0.10"/><path d="M16 12v8M12 16h8" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/></svg>,
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

type Report = {
  label: string;
};

interface ReportCardsProps {
  reports: Report[];
  className?: string;
}

const ReportCards: React.FC<ReportCardsProps> = React.memo(({ reports, className = "" }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {reports.map((report, idx) => (
        <div
          key={report.label}
          tabIndex={0}
          className="relative flex flex-col items-center bg-white/60 backdrop-blur-lg rounded-xl p-5 shadow-lg border border-[#e0e0e0] group cursor-pointer focus:ring-2 focus:ring-[#00C570] transition-all duration-200 hover:shadow-xl overflow-hidden"
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
          onFocus={() => setHoveredIdx(idx)}
          onBlur={() => setHoveredIdx(null)}
        >
          {/* ZAFRA watermark logo */}
          <Image src="/zafra.svg" alt="ZAFRA" width={32} height={32} className="absolute bottom-2 right-2 opacity-10 pointer-events-none select-none" />
          {/* Unique SVG icon */}
          <span className="text-4xl mb-2">
            {reportIcons[idx]}
          </span>
          {/* Report label */}
          <span className="font-semibold text-gray-800 mb-1 group-hover:text-[#00C570] transition-colors text-center">{report.label}</span>
          {/* Short description */}
          <span className="text-xs text-gray-500 mb-3 text-center">{reportDescriptions[report.label] || ''}</span>
          {/* Tooltip on hover/focus only */}
          {hoveredIdx === idx && (
            <span className="absolute top-2 left-2 z-10 bg-[#171B2A] text-white text-xs rounded px-2 py-1 pointer-events-auto">
              {reportTooltips[report.label] || ''}
            </span>
          )}
          {/* CTA button */}
          <button className="mt-auto bg-[#00C570] hover:bg-green-600 text-white px-4 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#00C570] transition-all duration-200">
            Lihat
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M5 8h6M9 6l2 2-2 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
});

export default ReportCards; 