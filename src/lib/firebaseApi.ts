import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export the initialized services
export { auth, db };

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function saveUserToFirestore({ uid, email, name, role, createdAt }: { uid: string; email: string; name: string; role: string; createdAt: string }) {
  const userDoc = {
    name,
    email,
    role,
    createdAt
  };
  await db.collection('users').doc(uid).set(userDoc);
}

export async function saveMitraData({ uid, namaMitra, alamatMitra, detailBisnis, jenisUsaha, createdAt }: { uid: string; namaMitra: string; alamatMitra: string; detailBisnis: string; jenisUsaha: string; createdAt: string }) {
  const mitraDoc = {
    userId: uid,
    namaMitra,
    alamatMitra,
    detailBisnis,
    jenisUsaha,
    createdAt
  };
  await db.collection('mitra').doc(uid).set(mitraDoc);
} 
