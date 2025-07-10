import { db } from "@/lib/firebaseApi";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";

interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  photo?: string;
  headerPhoto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getUserProfile(uid: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

export async function createOrUpdateProfile(uid: string, profileData: Partial<UserProfile>) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    const now = new Date().toISOString();
    
    if (!userSnap.exists()) {
      // Create new profile
      await setDoc(userRef, {
        ...profileData,
        createdAt: now,
        updatedAt: now
      });
    } else {
      // Update existing profile
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: now
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error };
  }
}

export async function updateUserProfilePhoto(uid: string, photoUrl: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create the document if it doesn't exist
      await setDoc(userRef, {
        photo: photoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing document
      await updateDoc(userRef, {
        photo: photoUrl,
        updatedAt: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user photo:", error);
    return { success: false, error };
  }
}

export async function updateUserHeaderPhoto(uid: string, headerPhotoUrl: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create the document if it doesn't exist
      await setDoc(userRef, {
        headerPhoto: headerPhotoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing document
      await updateDoc(userRef, {
        headerPhoto: headerPhotoUrl,
        updatedAt: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating header photo:", error);
    return { success: false, error };
  }
}

// New: Fetch all user profiles
export async function getAllUserProfiles() {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    const profiles: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      profiles.push({ id: doc.id, ...doc.data() } as UserProfile);
    });
    return profiles;
  } catch (error) {
    console.error("Error fetching all user profiles:", error);
    return [];
  }
} 