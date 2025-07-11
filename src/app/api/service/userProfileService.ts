import { firestore as db } from "@/lib/firebaseAdmin";

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
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    
    if (userSnap.exists) {
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
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    
    const now = new Date().toISOString();
    
    if (!userSnap.exists) {
      // Create new profile
      await userRef.set({
        ...profileData,
        createdAt: now,
        updatedAt: now
      });
    } else {
      // Update existing profile
      await userRef.update({
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
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      // Create the document if it doesn't exist
      await userRef.set({
        photo: photoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing document
      await userRef.update({
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
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      // Create the document if it doesn't exist
      await userRef.set({
        headerPhoto: headerPhotoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Update existing document
      await userRef.update({
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
export async function getAllUserProfiles(summary = false) {
  try {
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.get();
    const profiles: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      if (summary) {
        const data = doc.data();
        profiles.push({ 
          id: doc.id, 
          name: data.name,
          role: data.role
        } as UserProfile);
      } else {
        profiles.push({ id: doc.id, ...doc.data() } as UserProfile);
      }
    });
    return profiles;
  } catch (error) {
    console.error("Error fetching all user profiles:", error);
    return [];
  }
} 