import { registerWithEmail, loginWithEmail, saveUserToFirestore, saveMitraData } from "@/lib/firebaseApi";
import { firestore as db } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  photo?: string;
}

export async function registerUser({ name, email, password, role, createdAt, namaMitra, alamatMitra, detailBisnis, jenisUsaha }: { name: string; email: string; password: string; role: string; createdAt: string; namaMitra?: string; alamatMitra?: string; detailBisnis?: string; jenisUsaha?: string; }) {
  try {
    // Check if Auth user already exists
    let userRecord;
    try {
      userRecord = await getAuth().getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        userRecord = null;
      } else {
        throw e;
      }
    }
    let uid = userRecord?.uid;
    if (!uid) {
      // Register new Auth user
      const userCredential = await registerWithEmail(email, password);
      const user = userCredential.user;
      if (!user?.uid) throw new Error("User UID not found after registration.");
      uid = user.uid;
    }
    // Check if Firestore user exists
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      // Save core user data using Admin SDK
      await db.collection("users").doc(uid).set({
        name,
        email,
        role,
        createdAt
      });
      // If the user is a Mitra, save their specific data to the 'mitra' collection using Admin SDK
      if (role === 'umkm-amil' && namaMitra && alamatMitra && detailBisnis && jenisUsaha) {
        await db.collection("mitra").doc(uid).set({
          userId: uid,
          namaMitra,
          alamatMitra,
          detailBisnis,
          jenisUsaha,
          createdAt
        });
      }
      return { success: true, uid };
    } else {
      // Firestore user already exists
      return { success: false, error: "User already exists in Firestore." };
    }
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
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      throw new Error("User data not found in database.");
    }
    
    const userData = userDoc.data();
    if (!userData) {
      throw new Error("User data not found in database.");
    }
    return { success: true, email: user.email, role: userData.role };
  } catch (err: any) {
    return { success: false, error: err?.message || "Login failed" };
  }
}

export async function getUser(email: string) {
  try {
    // Query users collection to find user by email
    const usersRef = db.collection("users");
    const q = usersRef.where("email", "==", email);
    const querySnapshot = await q.get();
    
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
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.get();
    
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
    await db.collection("users").doc(uid).delete();
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return { success: false, error: err?.message || "Failed to delete user" };
  }
}

export async function updateUserRole(uid: string, newRole: string) {
  try {
    await db.collection("users").doc(uid).update({ role: newRole });
    return { success: true };
  } catch (err: any) {
    console.error("Error updating user role:", err);
    return { success: false, error: err?.message || "Failed to update user role" };
  }
}

export async function createUser({ name, email, password, role, createdAt, namaMitra, alamatMitra, detailBisnis, jenisUsaha }: { name: string, email: string, password: string, role: string, createdAt: string, namaMitra?: string, alamatMitra?: string, detailBisnis?: string, jenisUsaha?: string }) {
  try {
    // First try to register or sync user
    const registerResult = await registerUser({ name, email, password, role, createdAt, namaMitra, alamatMitra, detailBisnis, jenisUsaha });
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