import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebaseAdmin';

const COLLECTION = 'events';

// POST: Add a new event
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const body = await req.json();
    const { date, title, type } = body;
    if (!date || !title || !type) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    // Prevent duplicate event for same user/date/title
    const existing = await admin.firestore().collection(COLLECTION)
      .where('userId', '==', decodedToken.uid)
      .where('date', '==', date)
      .where('title', '==', title)
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json({ message: 'Duplicate event' }, { status: 409 });
    }
    await admin.firestore().collection(COLLECTION).add({
      userId: decodedToken.uid,
      date,
      title,
      type,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to add event' }, { status: 500 });
  }
}

// GET: Get all events for the authenticated user (optionally filter by month/year)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    let query = admin.firestore().collection(COLLECTION).where('userId', '==', decodedToken.uid);
    if (month && year) {
      // Ensure month is always two digits
      const paddedMonth = String(month).padStart(2, '0');
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const startDateStr = `${year}-${paddedMonth}-01`;
      const endDateStr = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
      // If your 'date' field is a string in 'YYYY-MM-DD' format:
      query = query
        .where('date', '>=', startDateStr)
        .where('date', '<=', endDateStr);
      // If your 'date' field is a Firestore Timestamp, use this instead:
      // import { Timestamp } from 'firebase-admin/firestore';
      // const startDate = new Date(Number(year), Number(month) - 1, 1);
      // const endDate = new Date(Number(year), Number(month) - 1, lastDay, 23, 59, 59, 999);
      // query = query
      //   .where('date', '>=', Timestamp.fromDate(startDate))
      //   .where('date', '<=', Timestamp.fromDate(endDate));
    }
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Events API error:', error); // Add error logging for debugging
    return NextResponse.json({ message: error.message || 'Failed to fetch events' }, { status: 500 });
  }
} 