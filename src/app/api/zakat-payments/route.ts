import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebaseAdmin';

const COLLECTION = 'zakatPayments';

// POST: Karyawan logs zakat payment
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const body = await req.json();
    const { userId, payrollId, month, amount, laz, type, paymentMethod } = body;
    if (!payrollId || !month || !amount || !laz || !type || !paymentMethod) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    // In POST handler, before adding, check for existing payment
    const existingSnap = await admin.firestore().collection(COLLECTION)
      .where('userId', '==', decodedToken.uid)
      .where('month', '==', month)
      .where('payrollId', '==', payrollId)
      .limit(1).get();
    if (!existingSnap.empty) {
      return NextResponse.json({ message: 'Zakat payment already exists for this user and month', id: existingSnap.docs[0].id }, { status: 409 });
    }
    // Store zakatPaid: true and all fields
    const doc = await admin.firestore().collection(COLLECTION).add({
      userId: decodedToken.uid,
      payrollId,
      month,
      amount,
      laz,
      type,
      paymentMethod,
      zakatPaid: true,
      date: new Date().toISOString(),
      status: 'pending',
    });
    return NextResponse.json({ success: true, id: doc.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to log zakat payment' }, { status: 500 });
  }
}

// GET: HR fetches all zakat payments
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // Only HR can view all
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'hr-keuangan') {
      return NextResponse.json({ message: 'Forbidden: Not authorized' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    let query = admin.firestore().collection(COLLECTION) as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
    if (status) query = query.where('status', '==', status);
    query = query.orderBy('date', 'desc');
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch zakat payments' }, { status: 500 });
  }
}

// PUT: HR marks zakat payment as forwarded to LAZ
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    // Only HR can update
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'hr-keuangan') {
      return NextResponse.json({ message: 'Forbidden: Not authorized' }, { status: 403 });
    }
    const body = await req.json();
    const { zakatPaymentId, laz } = body;
    if (!zakatPaymentId || !laz) {
      return NextResponse.json({ message: 'Missing zakatPaymentId or laz' }, { status: 400 });
    }
    await admin.firestore().collection(COLLECTION).doc(zakatPaymentId).update({
      status: 'forwarded',
      laz,
      forwardedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to update zakat payment' }, { status: 500 });
  }
} 