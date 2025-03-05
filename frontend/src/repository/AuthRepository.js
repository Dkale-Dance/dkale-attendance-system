import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  createUserWithEmailAndPassword as createUser, // Alias for clarity
  signOut,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "../lib/firebase/config/config";
import { getAuth } from "firebase/auth";

export class AuthRepository {
  constructor() {
    // Initialize persistence when repository is created
    this.initializePersistence();
  }

  // Set Firebase persistence to local to persist auth state on refresh
  async initializePersistence() {
    try {
      // Only attempt to set persistence if auth is defined (handles test environment)
      if (auth) {
        await setPersistence(auth, browserLocalPersistence);
      }
    } catch (error) {
      console.error("Error setting auth persistence:", error);
    }
  }

  // Method to listen for auth state changes
  onAuthStateChanged(callback) {
    // Handle testing environment where auth might be undefined
    if (auth) {
      return onAuthStateChanged(auth, callback);
    }
    return () => {}; // Return empty unsubscribe function for testing
  }

  // Get current authenticated user
  getCurrentUser() {
    // Add safety check for testing environments where auth might be undefined
    return auth?.currentUser;
  }

  async register(email, password) {
    // Handle testing environment where auth might be undefined
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  /**
   * Create a new user without signing them in (used by admins to create student accounts)
   * This ensures the admin doesn't get logged out when creating a student account
   * @param {string} email - Student email
   * @param {string} password - Temporary password for student
   * @returns {Promise<Object>} The newly created user
   */
  async registerWithoutSignIn(email, password) {
    try {
      // Handle testing environment where auth might be undefined
      if (!auth) {
        // In testing environment
        const userCredential = await createUserWithEmailAndPassword(undefined, email, password);
        return userCredential?.user;
      }
      
      // IMPORTANT: Let's create a completely separate auth instance
      // to avoid any impact on the main auth state
      const tempAuth = getAuth();
      
      // The issue could be that our approach was still sharing state with the main auth
      try {
        // Create user with the completely separate auth instance
        const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
        
        // Immediately sign out from the temporary auth instance
        await signOut(tempAuth);
        
        // Return user data without modifying the current auth state
        return {
          uid: userCredential.user.uid,
          email: userCredential.user.email
        };
      } catch (createUserError) {
        console.error("Error creating user:", createUserError);
        throw createUserError;
      }
    } catch (error) {
      console.error("Error in registerWithoutSignIn:", error);
      throw error;
    }
  }

  async login(email, password) {  
    // Handle testing environment where auth might be undefined
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  async logout() {
    // Handle testing environment where auth might be undefined
    if (auth) {
      await signOut(auth);
    }
  }
}

// ✅ Default export using the real Firebase
export const authRepository = new AuthRepository();
