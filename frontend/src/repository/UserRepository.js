import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

export class UserRepository {
  constructor() {
    this.db = getFirestore();
  }

  async assignRole(userId, role) {
    try {
      const userRef = doc(this.db, "users", userId);
      // Use setDoc with merge option instead of updateDoc
      // This ensures the document is created even if it doesn't exist
      await setDoc(userRef, { role }, { merge: true });
    } catch (error) {
      console.error(`Error assigning role ${role} to user ${userId}:`, error);
      throw error;
    }
  }

  async getRole(userId) {
    try {
      const userRef = doc(this.db, "users", userId);
      const docSnap = await getDoc(userRef);
      return docSnap.exists() ? docSnap.data().role : "anonymous";
    } catch (error) {
      console.error(`Error getting role for user ${userId}:`, error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();