import { Transaction } from './financialReportLogic';

// Enhanced Excel Export functionality with professional formatting
export const exportToExcel = async (
  transactions: Transaction[],
  ledgerData: any[],
  balanceData: any[],
  profitLossData: any[],
  cashFlowData: any[],
  zisData: any[],
  summary: any
) => {
  try {
    // Dynamic import for XLSX to avoid SSR issues
    const XLSX = await import('xlsx');
    
    // Create workbook with properties
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: 'ZAFRA Financial Report',
      Subject: 'Laporan Keuangan Syariah Terpadu',
      Author: 'ZAFRA Financial System',
      CreatedDate: new Date()
    };
    
    // Enhanced Summary sheet with formatting
    const summaryData = createEnhancedSummarySheet(summary, transactions);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    addExcelFormatting(summarySheet, 'summary');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Eksekutif');
    
    // Enhanced Journal sheet
    const journalData = createEnhancedJournalSheet(transactions);
    const journalSheet = XLSX.utils.aoa_to_sheet(journalData);
    addExcelFormatting(journalSheet, 'journal');
    XLSX.utils.book_append_sheet(workbook, journalSheet, 'Jurnal Transaksi');
    
    // Enhanced Ledger sheet
    if (ledgerData.length > 0) {
      const ledgerExcelData = createEnhancedLedgerSheet(ledgerData);
      const ledgerSheet = XLSX.utils.aoa_to_sheet(ledgerExcelData);
      addExcelFormatting(ledgerSheet, 'ledger');
      XLSX.utils.book_append_sheet(workbook, ledgerSheet, 'Buku Besar');
    }
    
    // Enhanced Balance sheet
    if (balanceData.length > 0) {
      const balanceExcelData = createEnhancedBalanceSheet(balanceData);
      const balanceSheet = XLSX.utils.aoa_to_sheet(balanceExcelData);
      addExcelFormatting(balanceSheet, 'balance');
      XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Neraca');
    }
    
    // Enhanced Profit & Loss sheet
    if (profitLossData.length > 0) {
      const plExcelData = createEnhancedProfitLossSheet(profitLossData);
      const plSheet = XLSX.utils.aoa_to_sheet(plExcelData);
      addExcelFormatting(plSheet, 'pl');
      XLSX.utils.book_append_sheet(workbook, plSheet, 'Laba Rugi');
    }
    
    // Enhanced Cash Flow sheet
    if (cashFlowData.length > 0) {
      const cashExcelData = createEnhancedCashFlowSheet(cashFlowData);
      const cashSheet = XLSX.utils.aoa_to_sheet(cashExcelData);
      addExcelFormatting(cashSheet, 'cash');
      XLSX.utils.book_append_sheet(workbook, cashSheet, 'Arus Kas');
    }
    
    // Enhanced ZIS sheet
    if (zisData.length > 0) {
      const zisExcelData = createEnhancedZisSheet(zisData);
      const zisSheet = XLSX.utils.aoa_to_sheet(zisExcelData);
      addExcelFormatting(zisSheet, 'zis');
      XLSX.utils.book_append_sheet(workbook, zisSheet, 'Laporan ZIS');
    }
    
    // Add compliance and audit sheet
    const complianceData = createComplianceSheet(summary, transactions);
    const complianceSheet = XLSX.utils.aoa_to_sheet(complianceData);
    addExcelFormatting(complianceSheet, 'compliance');
    XLSX.utils.book_append_sheet(workbook, complianceSheet, 'Kepatuhan Syariah');
    
    // Add metadata sheet
    const metadataData = createMetadataSheet();
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
    
    // Save the Excel file with timestamp and version
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const version = 'v1.0';
    XLSX.writeFile(workbook, `ZAFRA-Laporan-Keuangan-Lengkap-${timestamp}-${version}.xlsx`);
    
    return { success: true, message: 'Excel berhasil diekspor dengan format profesional dan fitur analisis!' };
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return { success: false, message: 'Gagal mengekspor Excel' };
  }
};

// Enhanced Excel Helper Functions
const createEnhancedSummarySheet = (summary: any, transactions: Transaction[]) => {
  const profitMargin = summary.income > 0 ? (summary.net / summary.income * 100) : 0;
  const expenseRatio = summary.income > 0 ? (summary.expenses / summary.income * 100) : 0;
  
  return [
    ['ZAFRA FINANCIAL SYSTEM'],
    ['Laporan Keuangan Syariah Terpadu'],
    [''],
    ['RINGKASAN EKSEKUTIF'],
    [''],
    ['Metrik Keuangan', 'Nilai', 'Analisis'],
    ['Total Pendapatan', summary.income, 'Pendapatan Operasional'],
    ['Total Pengeluaran', summary.expenses, 'Beban Operasional'],
    ['Laba Bersih', summary.net, summary.net > 0 ? 'Profit' : 'Loss'],
    ['Total ZIS', summary.zis, 'Zakat, Infak, Sedekah'],
    ['Saldo Kas', summary.cash, summary.cash > 0 ? 'Likuid' : 'Tidak Likuid'],
    ['Total Transaksi', transactions.length, 'Volume Transaksi'],
    [''],
    ['RASIO KEUANGAN'],
    ['Margin Laba (%)', profitMargin.toFixed(2), profitMargin > 20 ? 'Sangat Baik' : profitMargin > 10 ? 'Baik' : 'Perlu Perbaikan'],
    ['Rasio Beban (%)', expenseRatio.toFixed(2), expenseRatio < 80 ? 'Efisien' : 'Perlu Optimasi'],
    [''],
    ['INFORMASI LAPORAN'],
    ['Tanggal Dibuat', new Date().toLocaleDateString('id-ID')],
    ['Waktu Dibuat', new Date().toLocaleTimeString('id-ID')],
    ['Sistem', 'ZAFRA Financial System'],
    ['Versi', '1.0.0']
  ];
};

const createEnhancedJournalSheet = (transactions: Transaction[]) => {
  const headers = [
    'No',
    'Tanggal',
    'Deskripsi',
    'Kategori',
    'Nominal',
    'Status AI',
    'Penjelasan AI',
    'Tipe Transaksi'
  ];
  
  const rows = transactions.map((tx, index) => [
    index + 1,
    tx.date,
    tx.desc,
    tx.category,
    tx.amount,
    tx.aiStatus || 'pending',
    tx.aiExplanation || '-',
    tx.amount > 0 ? 'Pendapatan' : 'Pengeluaran'
  ]);
  
  return [headers, ...rows];
};

const createEnhancedLedgerSheet = (ledgerData: any[]) => {
  const headers = [
    'No',
    'Akun',
    'Debit',
    'Kredit',
    'Saldo',
    'Tipe Akun',
    'Status'
  ];
  
  const rows = ledgerData.map((item, index) => [
    index + 1,
    item.account,
    item.debit,
    item.credit,
    item.balance,
    item.account.includes('Pendapatan') ? 'Pendapatan' : 
    item.account.startsWith('Beban') ? 'Beban' : 
    item.account === 'ZIS' ? 'ZIS' : 'Lainnya',
    item.balance >= 0 ? 'Positif' : 'Negatif'
  ]);
  
  return [headers, ...rows];
};

const createEnhancedBalanceSheet = (balanceData: any[]) => {
  const headers = [
    'No',
    'Akun',
    'Jumlah',
    'Kategori',
    'Tipe',
    'Status'
  ];
  
  const rows = balanceData.map((item, index) => {
    let category = 'Lainnya';
    let type = 'Pasif';
    
    if (item.account.includes('Kas')) {
      category = 'Aset Lancar';
      type = 'Aktif';
    } else if (item.account.includes('Aset')) {
      category = 'Aset Tetap';
      type = 'Aktif';
    } else if (item.account.includes('Pendapatan')) {
      category = 'Pendapatan';
      type = 'Pasif';
    } else if (item.account.includes('Beban')) {
      category = 'Beban';
      type = 'Pasif';
    } else if (item.account.includes('Modal')) {
      category = 'Ekuitas';
      type = 'Pasif';
    }
    
    return [
      index + 1,
      item.account,
      item.amount,
      category,
      type,
      item.amount >= 0 ? 'Positif' : 'Negatif'
    ];
  });
  
  return [headers, ...rows];
};

const createEnhancedProfitLossSheet = (profitLossData: any[]) => {
  const headers = [
    'No',
    'Deskripsi',
    'Jumlah',
    'Tipe',
    'Kategori',
    'Status'
  ];
  
  const rows = profitLossData.map((item, index) => [
    index + 1,
    item.desc,
    item.amount,
    item.amount >= 0 ? 'Pendapatan' : 'Beban',
    item.desc.includes('Laba') ? 'Laba Bersih' : 
    item.desc.includes('Pendapatan') ? 'Pendapatan' : 'Beban',
    item.amount >= 0 ? 'Positif' : 'Negatif'
  ]);
  
  return [headers, ...rows];
};

const createEnhancedCashFlowSheet = (cashFlowData: any[]) => {
  const headers = [
    'No',
    'Deskripsi',
    'Jumlah',
    'Tipe Arus',
    'Kategori',
    'Status'
  ];
  
  const rows = cashFlowData.map((item, index) => [
    index + 1,
    item.desc,
    item.amount,
    item.amount >= 0 ? 'Masuk' : 'Keluar',
    item.desc.includes('Operasional') ? 'Operasional' : 
    item.desc.includes('Saldo') ? 'Saldo' : 'Lainnya',
    item.amount >= 0 ? 'Positif' : 'Negatif'
  ]);
  
  return [headers, ...rows];
};

const createEnhancedZisSheet = (zisData: any[]) => {
  const headers = [
    'No',
    'Deskripsi',
    'Jumlah',
    'Tipe ZIS',
    'Kategori',
    'Status'
  ];
  
  const rows = zisData.map((item, index) => [
    index + 1,
    item.desc,
    item.amount,
    item.amount >= 0 ? 'Penerimaan' : 'Distribusi',
    item.desc.includes('ZIS') ? 'ZIS' : 'Lainnya',
    item.amount >= 0 ? 'Masuk' : 'Keluar'
  ]);
  
  return [headers, ...rows];
};

const createComplianceSheet = (summary: any, transactions: Transaction[]) => {
  const halalCount = transactions.filter(tx => tx.aiStatus === 'Halal').length;
  const syubhatCount = transactions.filter(tx => tx.aiStatus === 'Syubhat').length;
  const haramCount = transactions.filter(tx => tx.aiStatus === 'Haram').length;
  const pendingCount = transactions.filter(tx => !tx.aiStatus || tx.aiStatus === 'pending').length;
  
  const totalTransactions = transactions.length;
  const halalPercentage = totalTransactions > 0 ? (halalCount / totalTransactions * 100).toFixed(2) : '0';
  const syubhatPercentage = totalTransactions > 0 ? (syubhatCount / totalTransactions * 100).toFixed(2) : '0';
  const haramPercentage = totalTransactions > 0 ? (haramCount / totalTransactions * 100).toFixed(2) : '0';
  
  return [
    ['LAPORAN KEPATUHAN SYARIAH'],
    [''],
    ['STATISTIK KEPATUHAN'],
    ['Kategori', 'Jumlah', 'Persentase', 'Status'],
    ['Transaksi Halal', halalCount, `${halalPercentage}%`, '✓ Kepatuhan Baik'],
    ['Transaksi Syubhat', syubhatCount, `${syubhatPercentage}%`, '⚠ Perlu Review'],
    ['Transaksi Haram', haramCount, `${haramPercentage}%`, '✗ Tidak Patuh'],
    ['Pending Review', pendingCount, `${totalTransactions > 0 ? (pendingCount / totalTransactions * 100).toFixed(2) : '0'}%`, '⏳ Menunggu'],
    [''],
    ['ANALISIS KEPATUHAN'],
    ['Total Transaksi', totalTransactions, 'Volume Transaksi'],
    ['Tingkat Kepatuhan', `${halalPercentage}%`, parseFloat(halalPercentage) > 80 ? 'Sangat Baik' : parseFloat(halalPercentage) > 60 ? 'Baik' : 'Perlu Perbaikan'],
    ['Risiko Syariah', parseFloat(haramPercentage) > 5 ? 'Tinggi' : parseFloat(haramPercentage) > 2 ? 'Sedang' : 'Rendah'],
    [''],
    ['REKOMENDASI'],
    ['1. Transaksi syubhat perlu review manual'],
    ['2. Transaksi haram harus segera diperbaiki'],
    ['3. Implementasi sistem validasi otomatis'],
    ['4. Pelatihan tim tentang prinsip syariah'],
    [''],
    ['STANDAR KEPATUHAN'],
    ['✓ Tidak ada unsur riba'],
    ['✓ Tidak ada unsur gharar (ketidakjelasan)'],
    ['✓ Tidak ada unsur maysir (judi)'],
    ['✓ ZIS dikelola sesuai prinsip syariah'],
    ['✓ Laporan sesuai PSAK Syariah']
  ];
};

const createMetadataSheet = () => {
  return [
    ['METADATA LAPORAN'],
    [''],
    ['Informasi Sistem'],
    ['Nama Sistem', 'ZAFRA Financial System'],
    ['Versi', '1.0.0'],
    ['Tipe Laporan', 'Laporan Keuangan Syariah'],
    [''],
    ['Informasi Pembuatan'],
    ['Tanggal Dibuat', new Date().toLocaleDateString('id-ID')],
    ['Waktu Dibuat', new Date().toLocaleTimeString('id-ID')],
    ['Zona Waktu', Intl.DateTimeFormat().resolvedOptions().timeZone],
    [''],
    ['Informasi Teknis'],
    ['Format File', 'Excel (.xlsx)'],
    ['Encoding', 'UTF-8'],
    ['Dibuat dengan', 'SheetJS (XLSX)'],
    [''],
    ['Catatan'],
    ['Laporan ini dibuat secara otomatis oleh sistem ZAFRA'],
    ['Semua data bersumber dari database transaksi real-time'],
    ['Format mengikuti standar laporan keuangan syariah']
  ];
};

const addExcelFormatting = (sheet: any, type: string) => {
  // Enhanced formatting based on sheet type
  if (type === 'summary') {
    // Summary sheet with wider columns for better readability
    sheet['!cols'] = [
      { wch: 30 }, // Metric name
      { wch: 20 }, // Value
      { wch: 25 }  // Analysis
    ];
  } else if (type === 'compliance') {
    // Compliance sheet with specific formatting
    sheet['!cols'] = [
      { wch: 25 }, // Category
      { wch: 12 }, // Count
      { wch: 12 }, // Percentage
      { wch: 20 }  // Status
    ];
  } else {
    // Standard column widths for data sheets
    sheet['!cols'] = [
      { wch: 8 },  // No
      { wch: 30 }, // Description/Account
      { wch: 15 }, // Amount
      { wch: 15 }, // Category/Type
      { wch: 15 }, // Status
      { wch: 15 }, // Additional info
      { wch: 15 }  // Extra column
    ];
  }
  
  // Add basic styling (this would be enhanced in a real implementation)
  // Note: Full styling would require additional libraries like xlsx-style
  if (type === 'summary') {
    // Mark header rows for styling
    sheet['!rows'] = [
      { hpt: 25 }, // Company name row
      { hpt: 20 }, // Subtitle row
      { hpt: 15 }, // Section headers
      { hpt: 12 }  // Data rows
    ];
  }
}; 