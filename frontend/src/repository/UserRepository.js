import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

export class UserRepository {
  constructor() {
    this.db = getFirestore();
  }

  async assignRole(userId, role) {
    const userRef = doc(this.db, "users", userId); // Ensure "users" collection is specified
    await setDoc(userRef, { role }, { merge: true });
  }

  async getRole(userId) {
    const userRef = doc(this.db, "users", userId);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? docSnap.data().role : "anonymous";
  }
}

export const userRepository = new UserRepository();
