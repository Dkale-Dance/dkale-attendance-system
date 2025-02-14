import { AuthService } from './AuthService';
import { AuthRepository } from '../repository/AuthRepository';
import { UserRepository } from '../repository/UserRepository';
import { getFirestore } from 'firebase/firestore';

let authServiceInstance = null;

export const createAuthService = () => {
  if (!authServiceInstance) {
    const db = getFirestore();
    const authRepository = new AuthRepository();
    const userRepository = new UserRepository(db);
    authServiceInstance = new AuthService(authRepository, userRepository);
  }
  return authServiceInstance;
};
