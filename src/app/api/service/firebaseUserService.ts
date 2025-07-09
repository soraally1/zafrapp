import { registerWithEmail, loginWithEmail, saveUserToFirestore } from "@/lib/firebaseApi";
import { getFirestore, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

const db = getFirestore();

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string;
}

export async function registerUser({ name, email, password, role }: { name: string, email: string, password: string, role: string }) {
  try {
    const userCredential = await registerWithEmail(email, password);
    const user = userCredential.user;
    if (!user?.uid) throw new Error("User UID not found after registration.");
    await saveUserToFirestore({
      uid: user.uid,
      email,
      name,
      role,
    });
    return { success: true, uid: user.uid };
  } catch (err: any) {
    return { success: false, error: err?.message || "Register failed" };
  }
} 

export async function loginUser({ email, password }: { email: string, password: string }) {
  try {
    const userCredential = await loginWithEmail(email, password);
    const user = userCredential.user;
    if (!user?.email) throw new Error("User email not found after login.");
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      throw new Error("User data not found in database.");
    }
    
    const userData = userDoc.data();
    return { success: true, email: user.email, role: userData.role };
  } catch (err: any) {
    return { success: false, error: err?.message || "Login failed" };
  }
}

export async function getUser(email: string) {
  try {
    // Query users collection to find user by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (err: any) {
    console.error("Error getting user:", err);
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<User, 'id'>)
    }));
    
    return users;
  } catch (err: any) {
    console.error("Error getting all users:", err);
    return [];
  }
}

export async function deleteUser(uid: string) {
  try {
    await deleteDoc(doc(db, "users", uid));
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return { success: false, error: err?.message || "Failed to delete user" };
  }
}

export async function updateUserRole(uid: string, newRole: string) {
  try {
    await updateDoc(doc(db, "users", uid), { role: newRole });
    return { success: true };
  } catch (err: any) {
    console.error("Error updating user role:", err);
    return { success: false, error: err?.message || "Failed to update user role" };
  }
}

export async function createUser({ name, email, password, role }: { name: string, email: string, password: string, role: string }) {
  try {
    // First register the user with Firebase Auth
    const registerResult = await registerUser({ name, email, password, role });
    if (!registerResult.success) {
      throw new Error(registerResult.error || "Failed to register user");
    }
    
    return { success: true, uid: registerResult.uid };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create user" };
  }
}

// Helper to check if user is karyawan
export function isKaryawan(user: { role?: string }) {
  return user.role === 'karyawan';
}