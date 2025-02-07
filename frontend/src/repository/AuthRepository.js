import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase/config/config";

export class AuthRepository {
  async register(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async login(email, password) {  
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async logout() {
    await signOut(auth);
  }
}

// ✅ Default export using the real Firebase
export const authRepository = new AuthRepository();
