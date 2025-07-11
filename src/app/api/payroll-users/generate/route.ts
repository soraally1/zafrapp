import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyPayroll } from '../../service/payrollService';
import { admin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
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
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    if (!month) {
      return NextResponse.json({ message: 'Missing month parameter' }, { status: 400 });
    }
    const result = await generateMonthlyPayroll(month);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to generate payroll' }, { status: 500 });
  }
} 