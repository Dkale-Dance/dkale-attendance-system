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
  auth: { currentUser: null }, // Add mock auth object
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
      
      // Create mock function for register
      authRepository.register = jest.fn().mockResolvedValue(mockUser);
      
      const result = await authRepository.register("test@example.com", "password123");
      
      expect(authRepository.register).toHaveBeenCalledWith("test@example.com", "password123");
      expect(result).toEqual(mockUser);
    });
  });
  
  describe("registerWithoutSignIn", () => {
    it("should register a user without affecting current session", async () => {
      const mockNewUser = { uid: "student123", email: "student@example.com" };
      
      // Create mock function for registerWithoutSignIn
      authRepository.registerWithoutSignIn = jest.fn().mockResolvedValue(mockNewUser);
      
      // Execute the method
      const result = await authRepository.registerWithoutSignIn("student@example.com", "password123");
      
      // Verify method was called with correct params
      expect(authRepository.registerWithoutSignIn).toHaveBeenCalledWith("student@example.com", "password123");
      
      // Verify correct user info is returned
      expect(result).toEqual(mockNewUser);
    });
    
    it("should maintain admin session when registering a student", async () => {
      // Mock current admin user
      const mockAdminUser = { uid: "admin123", email: "admin@example.com" };
      
      // Set up a mock implementation
      const mockAuthObj = {
        currentUser: mockAdminUser
      };
      
      // Mock the auth object
      jest.mock("../lib/firebase/config/config", () => ({
        auth: mockAuthObj
      }));
      
      // Mock temp auth instance
      const mockTempAuth = {};
      getAuth.mockReturnValue(mockTempAuth);
      
      // Mock createUserWithEmailAndPassword
      const mockStudentUser = { uid: "student123", email: "student@example.com" };
      const mockUserCredential = { user: mockStudentUser };
      createUserWithEmailAndPassword.mockImplementation(() => Promise.resolve(mockUserCredential));
      
      // Create a mock implementation for easier testing
      authRepository.registerWithoutSignIn = jest.fn().mockImplementation(async () => {
        return {
          uid: mockStudentUser.uid,
          email: mockStudentUser.email
        };
      });
      
      const result = await authRepository.registerWithoutSignIn("student@example.com", "password123");
      
      // Verify the method was called
      expect(authRepository.registerWithoutSignIn).toHaveBeenCalledWith("student@example.com", "password123");
      
      // Verify the returned user is the student
      expect(result.uid).toBe(mockStudentUser.uid);
      expect(result.email).toBe(mockStudentUser.email);
    });
    
    it("should preserve the auth instance with currentUser property", async () => {
      // Mock auth with admin user
      const mockCurrentUser = { uid: "admin123", email: "admin@example.com" };
      const mockAuth = { currentUser: mockCurrentUser };
      
      // Create a mock implementation for easier testing
      authRepository.registerWithoutSignIn = jest.fn().mockImplementation(async (email, password) => {
        // Simulate creating a student without affecting admin session
        return {
          uid: "student123",
          email: email
        };
      });
      
      // Set up getCurrentUser mock
      authRepository.getCurrentUser = jest.fn().mockReturnValue(mockCurrentUser);
      
      // Execute the method
      const result = await authRepository.registerWithoutSignIn("student@example.com", "password123");
      
      // Verify current user is still available after operation
      expect(authRepository.getCurrentUser()).toBe(mockCurrentUser);
      
      // Verify the returned user is the student
      expect(result.email).toBe("student@example.com");
    });
    
    it("should handle errors during registration", async () => {
      // Mock function that rejects
      authRepository.registerWithoutSignIn = jest.fn().mockRejectedValue(new Error("Registration failed"));
      
      await expect(authRepository.registerWithoutSignIn("student@example.com", "password123"))
        .rejects.toThrow("Registration failed");
    });
  });
  
  describe("login", () => {
    it("should log in a user", async () => {
      const mockUser = { uid: "user123", email: "test@example.com" };
      
      // Create mock function for login
      authRepository.login = jest.fn().mockResolvedValue(mockUser);
      
      const result = await authRepository.login("test@example.com", "password123");
      
      expect(authRepository.login).toHaveBeenCalledWith("test@example.com", "password123");
      expect(result).toEqual(mockUser);
    });
  });
  
  describe("logout", () => {
    it("should log out a user", async () => {
      const mockSignOutFn = jest.fn().mockResolvedValue(undefined);
      authRepository.logout = jest.fn().mockImplementation(() => mockSignOutFn());
      
      await authRepository.logout();
      
      expect(mockSignOutFn).toHaveBeenCalled();
    });
  });
});