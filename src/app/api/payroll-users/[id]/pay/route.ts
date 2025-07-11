import { NextRequest, NextResponse } from 'next/server';
import { processPayrollPayment } from '../../../service/payrollService';
import { admin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // Only allow HR users
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'hr-keuangan') {
      return NextResponse.json({ message: 'Forbidden: Not authorized' }, { status: 403 });
    }
    const { id } = params;
    const result = await processPayrollPayment(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to process payroll payment' }, { status: 500 });
  }
} 