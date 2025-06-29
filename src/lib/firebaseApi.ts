import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyK7iC0qxP5ZHNrIE5J4iCbQX8nRPEC4o",
  authDomain: "zafrapp-9b0eb.firebaseapp.com",
  projectId: "zafrapp-9b0eb",
  storageBucket: "zafrapp-9b0eb.firebasestorage.app",
  messagingSenderId: "790770531133",
  appId: "1:790770531133:web:7fa12ab0ed0827fc4fe354",
  measurementId: "G-8YQV0HYT6W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function saveUserToFirestore({ uid, email, name, role }: { uid: string, email: string, name: string, role: string }) {
  return setDoc(doc(db, "users", uid), {
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
  });
} 