import { NextRequest, NextResponse } from 'next/server';
import { getAllPayrollUsersWithProfile, createOrUpdatePayroll } from '../service/payrollService';
import { admin } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
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
    const result = await getAllPayrollUsersWithProfile(month);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch payroll users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // ... existing code ...
}

export async function PUT(req: NextRequest) {
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
    const targetUid = searchParams.get('uid');
    if (!targetUid) {
      return NextResponse.json({ message: 'Missing uid parameter' }, { status: 400 });
    }
    const body = await req.json();
    const result = await createOrUpdatePayroll(targetUid, body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update payroll' }, { status: 500 });
  }
} 