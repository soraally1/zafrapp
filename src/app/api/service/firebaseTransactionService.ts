import { firestore, admin } from '@/lib/firebaseAdmin';
import { getFirestore } from "firebase-admin/firestore";

interface Transaction {
    userId: string;
    date: string;
    description: string;
    category: string;
    nominal: number;
    type: 'Halal' | 'Haram' | 'Syubhat';
}

export async function addTransaction(data: Transaction) {
    try {
        // Use the server-side timestamp for accuracy
        const transactionWithTimestamp = {
            ...data,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await firestore.collection('transactionReports').add(transactionWithTimestamp);
        return { success: true, transactionId: docRef.id };
    } catch (error: any) {
        console.error("Error in addTransaction service:", error);
        return { success: false, error: error.message };
    }
}

export async function getAllTransactions(limit?: number) {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firestore.collection('transactionReports').orderBy('createdAt', 'desc');

        if (limit) {
            query = query.limit(limit);
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}



export async function getTransactionReportsByUserId(userId: string) {
  const db = getFirestore();
  const reportsRef = db.collection("transactionReports");
  const snapshot = await reportsRef.where("userId", "==", userId).get();
  const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return reports;
}
