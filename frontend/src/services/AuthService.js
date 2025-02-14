class AuthService {
  constructor(authRepository, userRepository) {
    this.authRepository = authRepository;
    this.userRepository = userRepository;
  }

  async register(email, password) {
    // First register the user with Firebase Auth
    const user = await this.authRepository.register(email, password);
    
    // Then assign the default role
    await this.userRepository.updateRole(user.uid, "student");
    
    // Get the role to include in the response
    const role = await this.userRepository.getRole(user.uid);
    
    // Return user with role
    return {
      ...user,
      role
    };
  }

  async login(email, password) {
    // Login with Firebase Auth
    const user = await this.authRepository.login(email, password);
    
    // Get the user's role
    const role = await this.userRepository.getRole(user.uid);
    
    // Return user with role
    return {
      ...user,
      role
    };
  }

  async logout() {
    return this.authRepository.logout();
  }
}

export { AuthService };