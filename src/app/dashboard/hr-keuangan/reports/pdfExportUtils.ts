import { Transaction } from './financialReportLogic';

// Simple PDF Export functionality with ZAFRA logo
export const exportToPDF = async (
  transactions: Transaction[],
  ledgerData: any[],
  balanceData: any[],
  profitLossData: any[],
  cashFlowData: any[],
  zisData: any[],
  summary: any,
  activeTab: string
) => {
  try {
    // Dynamic import for jsPDF to avoid SSR issues
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    
    // Set font for Indonesian characters
    doc.setFont('helvetica');
    
    // Add simple header with ZAFRA branding
    addSimpleHeader(doc, activeTab);
    
    // Add basic summary
    addBasicSummary(doc, summary, transactions);
    
    // Add active tab content
    let yPosition = 80;
    
    switch (activeTab) {
      case 'journal':
        yPosition = addSimpleJournalToPDF(doc, transactions, yPosition);
        break;
      case 'ledger':
        yPosition = addSimpleLedgerToPDF(doc, ledgerData, yPosition);
        break;
      case 'balance':
        yPosition = addSimpleBalanceToPDF(doc, balanceData, yPosition);
        break;
      case 'pl':
        yPosition = addSimpleProfitLossToPDF(doc, profitLossData, yPosition);
        break;
      case 'cash':
        yPosition = addSimpleCashFlowToPDF(doc, cashFlowData, yPosition);
        break;
      case 'zis':
        yPosition = addSimpleZisToPDF(doc, zisData, yPosition);
        break;
    }
    
    // Add simple footer
    addSimpleFooter(doc);
    
    // Add page numbers
    addPageNumbers(doc);
    
    // Save the PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    doc.save(`ZAFRA-Laporan-${activeTab}-${timestamp}.pdf`);
    
    return { success: true, message: 'PDF berhasil diekspor!' };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return { success: false, message: 'Gagal mengekspor PDF' };
  }
};


const addSimpleHeader = (doc: any, activeTab: string) => {
  
  // Company name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ZAFRA FINANCIAL SYSTEM', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem Keuangan Syariah Terpadu', 20, 28);
  
  // Add line separator
  doc.setDrawColor(0, 197, 112);
  doc.setLineWidth(1);
  doc.line(20, 35, 190, 35);
  
  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Laporan ${getReportTitle(activeTab)}`, 20, 45);
  
  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 55);
};

const addBasicSummary = (doc: any, summary: any, transactions: Transaction[]) => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Keuangan', 20, 70);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const summaryData = [
    `Total Pendapatan: ${formatCurrencyForPDF(summary.income)}`,
    `Total Pengeluaran: ${formatCurrencyForPDF(summary.expenses)}`,
    `Laba Bersih: ${formatCurrencyForPDF(summary.net)}`,
    `Total ZIS: ${formatCurrencyForPDF(summary.zis)}`,
    `Saldo Kas: ${formatCurrencyForPDF(summary.cash)}`,
    `Total Transaksi: ${transactions.length}`
  ];
  
  summaryData.forEach((item, index) => {
    doc.text(item, 20, 80 + (index * 6));
  });
};

const addPageNumbers = (doc: any) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add page number
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' });
  }
};

const addSimpleFooter = (doc: any) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Dibuat pada: ${new Date().toLocaleString('id-ID')}`, 105, 285, { align: 'center' });
    doc.text('ZAFRA Financial System', 105, 290, { align: 'center' });
  }
};

// Simple PDF Content Functions
const addSimpleJournalToPDF = (doc: any, transactions: Transaction[], startY: number): number => {
  // Add extra spacing after summary
  let y = startY + 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Jurnal Transaksi', 150, y);
  
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 3, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Tanggal', 22, y);
  doc.text('Deskripsi', 45, y);
  doc.text('Kategori', 110, y);
  doc.text('Nominal', 150, y);
  doc.text('Status', 170, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  let rowCount = 0;
  
  transactions.forEach((tx, index) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
      rowCount = 0;
      // Redraw table header on new page
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y - 3, 170, 8, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text('Tanggal', 22, y);
      doc.text('Deskripsi', 45, y);
      doc.text('Kategori', 110, y);
      doc.text('Nominal', 150, y);
      doc.text('Status', 170, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
    }
    
    // Alternate row colors
    if (rowCount % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 2, 170, 6, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.text(tx.date, 22, y);
    doc.text(tx.desc.substring(0, 25), 45, y);
    doc.text(tx.category, 110, y);
    doc.text(formatCurrencyForPDF(tx.amount), 150, y);
    
    // Status with color coding and padding
    let statusX = 170;
    const status = tx.aiStatus || 'pending';
    switch (status) {
      case 'Halal':
        doc.setTextColor(0, 197, 112);
        break;
      case 'Syubhat':
        doc.setTextColor(245, 158, 11);
        break;
      case 'Haram':
        doc.setTextColor(239, 68, 68);
        break;
      default:
        doc.setTextColor(107, 114, 128);
    }
    doc.text(status, statusX, y, { maxWidth: 20 });
    
    y += 6;
    rowCount++;
  });
  
  return y;
};

const addSimpleLedgerToPDF = (doc: any, ledgerData: any[], startY: number): number => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Buku Besar', 20, startY);
  
  let y = startY + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 3, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Akun', 22, y);
  doc.text('Debit', 80, y);
  doc.text('Kredit', 120, y);
  doc.text('Saldo', 160, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  let rowCount = 0;
  
  ledgerData.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
      rowCount = 0;
    }
    
    // Alternate row colors
    if (rowCount % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 2, 170, 6, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.text(item.account, 22, y);
    doc.text(formatCurrencyForPDF(item.debit), 80, y);
    doc.text(formatCurrencyForPDF(item.credit), 120, y);
    
    // Balance with color coding
    if (item.balance >= 0) {
      doc.setTextColor(0, 197, 112);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(formatCurrencyForPDF(item.balance), 160, y);
    
    y += 6;
    rowCount++;
  });
  
  return y;
};

const addSimpleBalanceToPDF = (doc: any, balanceData: any[], startY: number): number => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Neraca Keuangan', 20, startY);
  
  let y = startY + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 3, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Akun', 22, y);
  doc.text('Jumlah', 120, y);
  doc.text('Kategori', 170, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  let rowCount = 0;
  
  balanceData.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
      rowCount = 0;
    }
    
    // Alternate row colors
    if (rowCount % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 2, 170, 6, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.text(item.account, 22, y);
    doc.text(formatCurrencyForPDF(item.amount), 120, y);
    
    // Categorize accounts
    let category = 'Lainnya';
    if (item.account.includes('Kas')) category = 'Aset Lancar';
    else if (item.account.includes('Aset')) category = 'Aset Tetap';
    else if (item.account.includes('Pendapatan')) category = 'Pendapatan';
    else if (item.account.includes('Beban')) category = 'Beban';
    else if (item.account.includes('Modal')) category = 'Ekuitas';
    
    doc.text(category, 170, y);
    
    y += 6;
    rowCount++;
  });
  
  return y;
};

const addSimpleProfitLossToPDF = (doc: any, profitLossData: any[], startY: number): number => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Laba Rugi', 20, startY);
  
  let y = startY + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 3, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Deskripsi', 22, y);
  doc.text('Jumlah', 120, y);
  doc.text('Tipe', 170, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  let rowCount = 0;
  
  profitLossData.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
      rowCount = 0;
    }
    
    // Alternate row colors
    if (rowCount % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 2, 170, 6, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.text(item.desc, 22, y);
    
    // Amount with color coding
    if (item.amount >= 0) {
      doc.setTextColor(0, 197, 112);
      doc.text(formatCurrencyForPDF(item.amount), 120, y);
      doc.text('Pendapatan', 170, y);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text(formatCurrencyForPDF(item.amount), 120, y);
      doc.text('Beban', 170, y);
    }
    
    y += 6;
    rowCount++;
  });
  
  return y;
};

const addSimpleCashFlowToPDF = (doc: any, cashFlowData: any[], startY: number): number => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Arus Kas', 20, startY);
  
  let y = startY + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 3, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Deskripsi', 22, y);
  doc.text('Jumlah', 120, y);
  doc.text('Kategori', 170, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  let rowCount = 0;
  
  cashFlowData.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
      rowCount = 0;
    }
    
    // Alternate row colors
    if (rowCount % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 2, 170, 6, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.text(item.desc, 22, y);
    
    // Amount with color coding
    if (item.amount >= 0) {
      doc.setTextColor(0, 197, 112);
      doc.text(formatCurrencyForPDF(item.amount), 120, y);
      doc.text('Masuk', 170, y);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text(formatCurrencyForPDF(item.amount), 120, y);
      doc.text('Keluar', 170, y);
    }
    
    y += 6;
    rowCount++;
  });
  
  return y;
};

const addSimpleZisToPDF = (doc: any, zisData: any[], startY: number): number => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan ZIS (Zakat, Infak, Sedekah)', 20, startY);
  
  let y = startY + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 3, 170, 8, 'F');
  doc.setTextColor(0, 0, 0);
  doc.text('Deskripsi', 22, y);
  doc.text('Jumlah', 120, y);
  doc.text('Tipe', 170, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  let rowCount = 0;
  
  zisData.forEach((item) => {
    if (y > 250) {
      doc.addPage();
      y = 30;
      rowCount = 0;
    }
    
    // Alternate row colors
    if (rowCount % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 2, 170, 6, 'F');
    }
    
    doc.setTextColor(0, 0, 0);
    doc.text(item.desc, 22, y);
    
    // Amount with color coding
    if (item.amount >= 0) {
      doc.setTextColor(0, 197, 112);
      doc.text(formatCurrencyForPDF(item.amount), 120, y);
      doc.text('Penerimaan', 170, y);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text(formatCurrencyForPDF(item.amount), 120, y);
      doc.text('Distribusi', 170, y);
    }
    
    y += 6;
    rowCount++;
  });
  
  return y;
};

// Utility functions
const formatCurrencyForPDF = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getReportTitle = (activeTab: string): string => {
  switch (activeTab) {
    case 'journal': return 'Jurnal Transaksi';
    case 'ledger': return 'Buku Besar';
    case 'balance': return 'Neraca Keuangan';
    case 'pl': return 'Laba Rugi';
    case 'cash': return 'Arus Kas';
    case 'zis': return 'ZIS';
    default: return 'Keuangan';
  }
}; 