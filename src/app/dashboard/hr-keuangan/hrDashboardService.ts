// Service for HR Dashboard data (dummy/static for now)

import { db } from '@/lib/firebaseApi';
import { collection, getDocs, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

export async function fetchSummary(userId: string) {
  // Example: fetch payroll summary for the user
  const q = query(collection(db, 'payrolls'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  // Aggregate summary here or in logic layer
  return snapshot.docs.map(doc => doc.data());
}

export async function fetchStats() {
  // Example: fetch stats from a 'stats' collection
  const q = query(collection(db, 'stats'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function fetchTasks(userId: string) {
  // Example: fetch tasks assigned to the user
  const q = query(collection(db, 'tasks'), where('assignedTo', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function fetchUpcoming(userId: string) {
  // Example: fetch upcoming events for the user
  const q = query(collection(db, 'upcoming'), where('userId', '==', userId), orderBy('date', 'asc'), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function fetchReports(userId: string) {
  // Example: fetch reports for the user
  const q = query(collection(db, 'reports'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function addTask(task: any) {
  // Adds a new task to the 'tasks' collection
  const docRef = await addDoc(collection(db, 'tasks'), task);
  return docRef.id;
}

export async function logActivity({ type, message, userId, timestamp }: { type: string, message: string, userId: string, timestamp?: any }) {
  await addDoc(collection(db, 'activities'), {
    type,
    message,
    userId,
    timestamp: timestamp || serverTimestamp(),
  });
}

export async function fetchRecentActivities() {
  const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
