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

  /**
   * Register a student account without affecting the current user session
   * This is used by administrators to create student accounts
   * @param {string} email - The student's email
   * @param {string} password - The temporary password
   * @returns {Promise<Object>} The newly registered user object with role
   */
  async registerStudent(email, password) {
    // Use the admin-friendly register method that doesn't affect current session
    const user = await this.authRepository.registerWithoutSignIn(email, password);
    
    // Assign the student role
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
    return this.authRepository.login(email, password);
  }

  async logout() {
    return this.authRepository.logout();
  }
}

// ✅ Default export with the real repositories
export const authService = new AuthService(authRepository, userRepository);