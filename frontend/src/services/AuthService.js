import { authRepository } from "../repository/AuthRepository";

export default class AuthService {
    constructor(authRepository) {
      this.authRepository = authRepository;
    }
  
    async register(email, password) {
      return this.authRepository.register(email, password);
    }
  
    async login(email, password) {
      return this.authRepository.login(email, password);
    }
  
    async logout() {
      return this.authRepository.logout();
    }
  }
  
  // ✅ Default export with the real repository

  export const authService = new AuthService(authRepository);
  