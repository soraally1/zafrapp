import { NextResponse } from "next/server";
import { admin } from "@/lib/firebaseAdmin";
import { addTransaction, getTransactionReportsByUserId } from "../service/firebaseTransactionService";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await request.json();
    const { type, ...restOfBody } = body;
    const transactionData = { ...restOfBody, type, userId: uid, shariaStatus: 'pending', createdAt: new Date().toISOString() };

    const result = await addTransaction(transactionData);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 500 });
    }

        const newTransaction = { id: result.transactionId, ...transactionData };
    return NextResponse.json(newTransaction, { status: 201 });

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

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch all transaction reports for this user
    const transactions = await getTransactionReportsByUserId(uid);
    return NextResponse.json(transactions, { status: 200 });
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
