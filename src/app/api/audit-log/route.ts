import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebaseAdmin';

const COLLECTION = 'zakatAuditLog';

export async function GET() {
  try {
    const snap = await admin.firestore().collection(COLLECTION).orderBy('date', 'desc').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch audit log' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, by, date, details } = body;
    if (!action || !by || !date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const docRef = await admin.firestore().collection(COLLECTION).add({
      action, by, date, details: details || ''
    });
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to add audit log' }, { status: 500 });
  }
} 