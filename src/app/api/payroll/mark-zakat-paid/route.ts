import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { userId, month } = await req.json();
    if (!userId || !month) {
      return NextResponse.json({ message: 'Missing userId or month' }, { status: 400 });
    }
    // Find zakatPayment for this user/month
    const zakatSnap = await admin.firestore().collection('zakatPayments')
      .where('userId', '==', userId)
      .where('month', '==', month)
      .limit(1).get();
    if (zakatSnap.empty) {
      return NextResponse.json({ message: 'No zakat payment found' }, { status: 404 });
    }
    const zakatDoc = zakatSnap.docs[0];
    await zakatDoc.ref.update({ zakatPaid: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to mark zakat as paid' }, { status: 500 });
  }
} 