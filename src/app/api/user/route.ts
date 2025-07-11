import { NextResponse } from "next/server";
import { admin } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const userData = { id: userDoc.id, ...(userDoc.data() as any) };

    // If user is mitra, fetch mitra info
    let mitraData = null;
    if (userData.role === 'umkm-amil') {
      const mitraDoc = await admin.firestore().doc(`mitra/${uid}`).get();
      if (mitraDoc.exists) {
        mitraData = { id: mitraDoc.id, ...mitraDoc.data() };
      }
    }
    return NextResponse.json({ ...userData, mitra: mitraData }, { status: 200 });
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ message: 'Sesi Anda telah berakhir. Silakan login kembali.' }, { status: 401 });
    } else if (error.code === 'auth/argument-error') {
      return NextResponse.json({ message: 'Token tidak valid.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
} 