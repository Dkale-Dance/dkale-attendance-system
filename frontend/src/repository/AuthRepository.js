import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "../lib/firebase/config/config";

export class AuthRepository {
  constructor() {
    // Initialize persistence when repository is created
    this.initializePersistence();
  }

  // Set Firebase persistence to local to persist auth state on refresh
  async initializePersistence() {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.error("Error setting auth persistence:", error);
    }
  }

  // Method to listen for auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current authenticated user
  getCurrentUser() {
    return auth.currentUser;
  }

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
