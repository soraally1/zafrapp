import { Transaction } from './financialReportLogic';

// Enhanced CSV Export functionality with professional formatting
export const exportToCSV = (
  transactions: Transaction[],
  activeTab: string,
  ledgerData: any[],
  balanceData: any[],
  profitLossData: any[],
  cashFlowData: any[],
  zisData: any[]
) => {
  try {
    let csvContent = '';
    let filename = '';
    
    // Add header information
    const headerInfo = [
      ['ZAFRA FINANCIAL SYSTEM'],
      ['Laporan Keuangan Syariah Terpadu'],
      [''],
      ['Informasi Laporan'],
      ['Tanggal Dibuat', new Date().toLocaleDateString('id-ID')],
      ['Waktu Dibuat', new Date().toLocaleTimeString('id-ID')],
      ['Sistem', 'ZAFRA Financial System'],
      ['Versi', 'v1.0'],
      [''],
      ['CATATAN: File ini dibuat secara otomatis oleh sistem ZAFRA'],
      ['Semua data bersumber dari database transaksi real-time'],
      ['Format mengikuti standar laporan keuangan syariah'],
      [''],
      ['DATA LAPORAN'],
      ['']
    ];
    
    switch (activeTab) {
      case 'journal':
        csvContent = generateEnhancedJournalCSV(transactions, headerInfo);
        filename = `ZAFRA-Jurnal-Transaksi-${new Date().toISOString().split('T')[0]}-v1.0.csv`;
        break;
      case 'ledger':
        csvContent = generateEnhancedLedgerCSV(ledgerData, headerInfo);
        filename = `ZAFRA-Buku-Besar-${new Date().toISOString().split('T')[0]}-v1.0.csv`;
        break;
      case 'balance':
        csvContent = generateEnhancedBalanceCSV(balanceData, headerInfo);
        filename = `ZAFRA-Neraca-${new Date().toISOString().split('T')[0]}-v1.0.csv`;
        break;
      case 'pl':
        csvContent = generateEnhancedProfitLossCSV(profitLossData, headerInfo);
        filename = `ZAFRA-Laba-Rugi-${new Date().toISOString().split('T')[0]}-v1.0.csv`;
        break;
      case 'cash':
        csvContent = generateEnhancedCashFlowCSV(cashFlowData, headerInfo);
        filename = `ZAFRA-Arus-Kas-${new Date().toISOString().split('T')[0]}-v1.0.csv`;
        break;
      case 'zis':
        csvContent = generateEnhancedZisCSV(zisData, headerInfo);
        filename = `ZAFRA-Laporan-ZIS-${new Date().toISOString().split('T')[0]}-v1.0.csv`;
        break;
      default:
        csvContent = generateEnhancedJournalCSV(transactions, headerInfo);
        filename = `ZAFRA-Transaksi-${new Date().toISOString().split('T')[0]}-v1.0.csv`;
    }
    
    // Create and download CSV file with BOM for proper encoding
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, message: 'CSV berhasil diekspor dengan format profesional dan metadata lengkap!' };
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return { success: false, message: 'Gagal mengekspor CSV' };
  }
};

// Enhanced CSV Helper Functions
const generateEnhancedJournalCSV = (transactions: Transaction[], headerInfo: string[][] = []): string => {
  const headers = ['No', 'Tanggal', 'Deskripsi', 'Kategori', 'Nominal', 'Status AI', 'Tipe Transaksi'];
  const rows = transactions.map((tx, index) => [
    index + 1,
    tx.date,
    tx.desc,
    tx.category,
    tx.amount,
    tx.aiStatus || 'pending',
    tx.amount > 0 ? 'Pendapatan' : 'Pengeluaran'
  ]);
  
  const allRows = [...headerInfo, headers, ...rows];
  return allRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
};

const generateEnhancedLedgerCSV = (ledgerData: any[], headerInfo: string[][] = []): string => {
  const headers = ['No', 'Akun', 'Debit', 'Kredit', 'Saldo', 'Tipe Akun'];
  const rows = ledgerData.map((item, index) => [
    index + 1,
    item.account,
    item.debit,
    item.credit,
    item.balance,
    item.account.includes('Pendapatan') ? 'Pendapatan' : 
    item.account.startsWith('Beban') ? 'Beban' : 
    item.account === 'ZIS' ? 'ZIS' : 'Lainnya'
  ]);
  
  const allRows = [...headerInfo, headers, ...rows];
  return allRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
};

const generateEnhancedBalanceCSV = (balanceData: any[], headerInfo: string[][] = []): string => {
  const headers = ['No', 'Akun', 'Jumlah', 'Kategori', 'Tipe'];
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
    
    return [index + 1, item.account, item.amount, category, type];
  });
  
  const allRows = [...headerInfo, headers, ...rows];
  return allRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
};

const generateEnhancedProfitLossCSV = (profitLossData: any[], headerInfo: string[][] = []): string => {
  const headers = ['No', 'Deskripsi', 'Jumlah', 'Tipe', 'Kategori'];
  const rows = profitLossData.map((item, index) => [
    index + 1,
    item.desc,
    item.amount,
    item.amount >= 0 ? 'Pendapatan' : 'Beban',
    item.desc.includes('Laba') ? 'Laba Bersih' : 
    item.desc.includes('Pendapatan') ? 'Pendapatan' : 'Beban'
  ]);
  
  const allRows = [...headerInfo, headers, ...rows];
  return allRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
};

const generateEnhancedCashFlowCSV = (cashFlowData: any[], headerInfo: string[][] = []): string => {
  const headers = ['No', 'Deskripsi', 'Jumlah', 'Tipe Arus', 'Kategori'];
  const rows = cashFlowData.map((item, index) => [
    index + 1,
    item.desc,
    item.amount,
    item.amount >= 0 ? 'Masuk' : 'Keluar',
    item.desc.includes('Operasional') ? 'Operasional' : 
    item.desc.includes('Saldo') ? 'Saldo' : 'Lainnya'
  ]);
  
  const allRows = [...headerInfo, headers, ...rows];
  return allRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
};

const generateEnhancedZisCSV = (zisData: any[], headerInfo: string[][] = []): string => {
  const headers = ['No', 'Deskripsi', 'Jumlah', 'Tipe ZIS', 'Kategori'];
  const rows = zisData.map((item, index) => [
    index + 1,
    item.desc,
    item.amount,
    item.amount >= 0 ? 'Penerimaan' : 'Distribusi',
    item.desc.includes('ZIS') ? 'ZIS' : 'Lainnya'
  ]);
  
  const allRows = [...headerInfo, headers, ...rows];
  return allRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
}; 