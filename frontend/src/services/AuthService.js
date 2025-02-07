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
    return this.authRepository.login(email, password);
  }

  async logout() {
    return this.authRepository.logout();
  }
}

// ✅ Default export with the real repositories
export const authService = new AuthService(authRepository, userRepository);