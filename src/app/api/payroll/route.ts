import { NextRequest, NextResponse } from 'next/server';
import { getUserPayroll } from '../service/payrollService';
import { admin } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    if (!userId || !month) {
      return NextResponse.json({ message: 'Missing userId or month parameter' }, { status: 400 });
    }
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // Allow if HR or requesting own payroll
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    const role = userDoc.exists ? userDoc.data()?.role : null;
    if (uid !== userId && role !== 'hr-keuangan') {
      return NextResponse.json({ message: 'Forbidden: Not authorized' }, { status: 403 });
    }
    const result = await getUserPayroll(userId, month);
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json({}, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch payroll' }, { status: 500 });
  }
} 