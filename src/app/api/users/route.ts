import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '../service/firebaseUserService';
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
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

// Allow public registration for POST (no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, createdAt, namaMitra, alamatMitra, detailBisnis, jenisUsaha } = body;
    if (!name || !email || !password || !role || !createdAt) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    // Pass all fields to createUser
    const result = await createUser({ name, email, password, role, createdAt, namaMitra, alamatMitra, detailBisnis, jenisUsaha });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to create user' }, { status: 500 });
  }
} 