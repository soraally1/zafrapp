import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    // Zakat Payments
    const zakatSnap = await admin.firestore().collection('zakatPayments').get();
    const zakatPayments = zakatSnap.docs.map(doc => doc.data());
    // CSR Activities
    const csrSnap = await admin.firestore().collection('csrActivities').get();
    const csrActivities = csrSnap.docs.map(doc => doc.data());

    // Monthly Distribution
    const monthly: Record<string, number> = {};
    zakatPayments.forEach((zp: any) => {
      const month = (zp.date || '').slice(0, 7);
      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += zp.amount || 0;
    });
    // Per-LAZ
    const perLaz: Record<string, number> = {};
    zakatPayments.forEach((zp: any) => {
      const laz = zp.laz || 'Lainnya';
      if (!perLaz[laz]) perLaz[laz] = 0;
      perLaz[laz] += zp.amount || 0;
    });
    // Allocation with type mapping
    const allocation: Record<string, number> = { zakat: 0, infaq: 0, sedekah: 0 };
    zakatPayments.forEach((zp: any) => {
      let type = (zp.type || 'zakat').toLowerCase();
      if (type.includes('zakat')) type = 'zakat';
      else if (type.includes('infaq')) type = 'infaq';
      else if (type.includes('sedekah')) type = 'sedekah';
      if (Object.prototype.hasOwnProperty.call(allocation, type)) allocation[type] += zp.amount || 0;
    });

    // Calculate distributed and balance
    const totalAllocation = allocation.zakat + allocation.infaq + allocation.sedekah;
    const distributed = zakatPayments
      .filter((zp: any) => zp.status === 'Distributed')
      .reduce((sum: number, zp: any) => sum + (zp.amount || 0), 0);
    const balance = totalAllocation - distributed;

    return NextResponse.json({
      success: true,
      monthly,
      perLaz,
      allocation,
      distributed,
      balance,
      csrActivities
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
} 