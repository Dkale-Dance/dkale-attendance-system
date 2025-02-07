import { getFirestore, doc, setDoc } from "firebase/firestore";

export class UserRepository {
  constructor() {
    this.db = getFirestore();
  }

  async assignRole(userId, role) {
    const userRef = doc(this.db, "users", userId); // Ensure "users" collection is specified
    await setDoc(userRef, { role }, { merge: true });
  }
}

export const userRepository = new UserRepository();
