import { registerWithEmail, saveUserToFirestore } from "@/lib/firebaseApi";

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