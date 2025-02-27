// authRepository.test.js
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from "firebase/auth";
import { AuthRepository } from "../repository/AuthRepository";

// Mock Firebase Auth methods
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(),
  setPersistence: jest.fn().mockResolvedValue(),
  browserLocalPersistence: "LOCAL",
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

describe("AuthRepository", () => {
  let authRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authRepository = new AuthRepository();
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const mockUser = { uid: "user123", email: "test@example.com" };
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      
      const result = await authRepository.register("test@example.com", "password123");
      
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(result).toEqual(mockUser);
    });
  });
  
  describe("registerWithoutSignIn", () => {
    it("should register a user without affecting current session", async () => {
      // Mock current user
      const mockCurrentUser = { uid: "admin123", email: "admin@example.com" };
      authRepository.getCurrentUser = jest.fn().mockReturnValue(mockCurrentUser);
      
      // Mock new user registration
      const mockNewUser = { uid: "student123", email: "student@example.com" };
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockNewUser });
      
      // Mock signOut
      signOut.mockResolvedValueOnce();
      
      // Execute the method
      const result = await authRepository.registerWithoutSignIn("student@example.com", "password123");
      
      // Verify user creation
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "student@example.com",
        "password123"
      );
      
      // Verify signOut was called to prevent session change
      expect(signOut).toHaveBeenCalled();
      
      // Verify correct user info is returned
      expect(result).toEqual(mockNewUser);
    });
    
    it("should handle errors during registration", async () => {
      createUserWithEmailAndPassword.mockRejectedValueOnce(new Error("Registration failed"));
      
      await expect(authRepository.registerWithoutSignIn("student@example.com", "password123"))
        .rejects.toThrow("Registration failed");
    });
  });
  
  describe("login", () => {
    it("should log in a user", async () => {
      const mockUser = { uid: "user123", email: "test@example.com" };
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
      
      const result = await authRepository.login("test@example.com", "password123");
      
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(result).toEqual(mockUser);
    });
  });
  
  describe("logout", () => {
    it("should log out a user", async () => {
      signOut.mockResolvedValueOnce();
      
      await authRepository.logout();
      
      expect(signOut).toHaveBeenCalled();
    });
  });
});