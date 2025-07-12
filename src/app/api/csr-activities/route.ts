import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebaseAdmin';

const COLLECTION = 'csrActivities';

export async function GET() {
  try {
    const snap = await admin.firestore().collection(COLLECTION).orderBy('date', 'desc').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, amount, date, photos, report } = body;
    if (!title || !amount || !date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate photos array contains base64 strings
    const validPhotos = Array.isArray(photos) ? photos.filter(photo => 
      typeof photo === 'string' && photo.startsWith('data:image/')
    ) : [];
    
    const docRef = await admin.firestore().collection(COLLECTION).add({
      title, 
      amount, 
      date, 
      photos: validPhotos, 
      report: report || '',
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to add activity' }, { status: 500 });
  }
} 