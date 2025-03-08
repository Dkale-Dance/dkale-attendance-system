// AuthRepository.js - FINAL FIX
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
    this._adminCredentials = null;
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

  // Temporarily store admin credentials securely in memory (not localStorage)
  // This is needed for re-authenticating after student creation
  saveAdminCredentials(email, password) {
    this._adminCredentials = { email, password };
  }

  clearAdminCredentials() {
    this._adminCredentials = null;
  }

  getAdminCredentials() {
    return this._adminCredentials;
  }

  /**
   * Create a new user and then restore admin session
   * @param {string} email - Student email
   * @param {string} password - Temporary password for student
   * @param {string} adminEmail - Current admin email
   * @param {string} adminPassword - Current admin password
   * @returns {Promise<Object>} The newly created user
   */
  async createUserAndRestoreAdmin(email, password, adminEmail, adminPassword) {
    // Store the current auth state
    let newUserData = null;
    
    try {
      // Step 1: Create the new student user (this will automatically sign them in)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Step 2: Capture the new user's info
      newUserData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      };
      
      // Step 3: Sign out the student
      await signOut(auth);
      
      // Step 4: Re-authenticate as admin
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      
      // Return the student user info without disrupting admin session
      return newUserData;
    } catch (error) {
      // If any part fails, try to restore admin session anyway
      try {
        if (adminEmail && adminPassword) {
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        }
      } catch (loginError) {
        console.error("Failed to restore admin session:", loginError);
      }
      
      // Re-throw the original error
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Handle testing environment where auth might be undefined
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async logout() {
    // Handle testing environment where auth might be undefined
    if (auth) {
      await signOut(auth);
    }
    
    // Clear admin credentials when logging out
    this.clearAdminCredentials();
  }
}

// Default export using the real Firebase
export const authRepository = new AuthRepository();