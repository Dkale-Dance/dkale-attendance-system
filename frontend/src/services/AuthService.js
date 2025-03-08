import { authRepository } from "../repository/AuthRepository";
import { userRepository } from "../repository/UserRepository";

export default class AuthService {
  constructor(authRepository, userRepository) {
    this.authRepository = authRepository;
    this.userRepository = userRepository;
  }

  async register(email, password) {
    // First register the user with Firebase Auth
    const user = await this.authRepository.register(email, password);
    
    // Then assign the default role
    await this.userRepository.assignRole(user.uid, "student");
    
    // Get the role to include in the response
    const role = await this.userRepository.getRole(user.uid);
    
    // Return user with role
    return {
      ...user,
      role
    };
  }

  async login(email, password) {
    try {
      const user = await this.authRepository.login(email, password);
      
      // For admin users, securely store credentials for session restoration
      const role = await this.userRepository.getRole(user.uid);
      if (role === "admin") {
        this.authRepository.saveAdminCredentials(email, password);
      }
      
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Register a student account and maintain admin session
   * @param {string} email - The student's email
   * @param {string} password - The temporary password
   * @returns {Promise<Object>} The newly registered user object with role
   */
  async registerStudent(email, password) {
    try {
      // Get admin credentials (needed to restore admin session)
      const adminCreds = this.authRepository.getAdminCredentials();
      if (!adminCreds) {
        throw new Error("Admin credentials not available. Please log in again.");
      }
      
      // Create student and restore admin session in one operation
      const user = await this.authRepository.createUserAndRestoreAdmin(
        email, 
        password,
        adminCreds.email,
        adminCreds.password
      );
      
      // Assign the student role
      await this.userRepository.assignRole(user.uid, "student");
      
      // Return user with role
      return {
        ...user,
        role: "student"
      };
    } catch (error) {
      console.error("Error in registerStudent:", error);
      throw error;
    }
  }

  async logout() {
    return this.authRepository.logout();
  }
}

// Default export with the real repositories
export const authService = new AuthService(authRepository, userRepository);