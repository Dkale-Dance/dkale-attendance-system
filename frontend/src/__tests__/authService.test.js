import AuthService from "../services/AuthService";
import { AuthRepository } from "../repository/AuthRepository";
import { UserRepository } from "../repository/UserRepository";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from "firebase/auth";
import { doc, setDoc, getDoc, getFirestore } from "firebase/firestore";

// Mock Firebase Auth
jest.mock("firebase/auth", () => {
  const actualAuth = jest.requireActual("firebase/auth");
  return {
    ...actualAuth,
    auth: { currentUser: null }, // Add mock auth object
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    getAuth: jest.fn(),
    signOut: jest.fn(),
  };
});

// Mock Firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

describe("AuthService (Unit Test)", () => {
  let authService;
  let authRepository;
  let userRepository;
  const mockFirestore = { id: "mockFirestore" };
  const mockDocRef = { id: "mockDocRef" };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Firestore mocks
    getFirestore.mockReturnValue(mockFirestore);
    doc.mockReturnValue(mockDocRef);
    setDoc.mockResolvedValue();
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "student" })
    });

    authRepository = new AuthRepository();
    
    // Mock registerWithoutSignIn method
    authRepository.registerWithoutSignIn = jest.fn();
    
    userRepository = new UserRepository();
    authService = new AuthService(authRepository, userRepository);
  });

  it("should register a new user and assign student role", async () => {
    // Mock user creation
    const mockUser = { 
      uid: "12345", 
      email: "test@example.com"
    };
    
    // Create a mock for authRepository.register that returns the mock user
    authRepository.register = jest.fn().mockResolvedValue(mockUser);

    // Perform registration
    const result = await authService.register("test@example.com", "password123");

    // Verify auth repository was called with correct params
    expect(authRepository.register).toHaveBeenCalledWith("test@example.com", "password123");

    // Verify role assignment
    expect(doc).toHaveBeenCalledWith(
      mockFirestore,
      "users",
      mockUser.uid
    );
    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      { role: "student" },
      { merge: true }
    );

    // Verify returned user object
    expect(result).toEqual({
      ...mockUser,
      role: "student"
    });
  });

  it("should register a student without affecting admin session", async () => {
    // Mock user creation
    const mockUser = { 
      uid: "student123", 
      email: "student@example.com"
    };
    
    // Mock the registerWithoutSignIn method
    authRepository.registerWithoutSignIn.mockResolvedValue(mockUser);

    // Perform student registration
    const result = await authService.registerStudent("student@example.com", "password123");

    // Verify the admin-friendly registration method was called
    expect(authRepository.registerWithoutSignIn).toHaveBeenCalledWith(
      "student@example.com",
      "password123"
    );

    // Verify role assignment
    expect(doc).toHaveBeenCalledWith(
      mockFirestore,
      "users",
      mockUser.uid
    );
    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      { role: "student" },
      { merge: true }
    );

    // Verify returned user object
    expect(result).toEqual({
      ...mockUser,
      role: "student"
    });
  });

  it("should not allow duplicate registration", async () => {
    createUserWithEmailAndPassword.mockRejectedValue(new Error("User already exists"));
    await expect(authService.register("test@example.com", "password123"))
      .rejects.toThrow("User already exists");
  });

  it("should log in a registered user", async () => {
    const mockUser = { uid: "12345", email: "test@example.com" };
    
    // Create a mock implementation for login
    authRepository.login = jest.fn().mockResolvedValue(mockUser);
    
    const user = await authService.login("test@example.com", "password123");
    
    expect(authRepository.login).toHaveBeenCalledWith("test@example.com", "password123");
    expect(user.email).toBe("test@example.com");
  });

  it("should not log in an unregistered user", async () => {
    // Create a mock implementation that rejects
    authRepository.login = jest.fn().mockRejectedValue(new Error("Invalid credentials"));
    
    await expect(authService.login("unknown@example.com", "password123"))
      .rejects.toThrow("Invalid credentials");
  });

  it("should log out a user", async () => {
    // Mock the auth object to be defined for this test
    jest.mock("firebase/auth", () => ({
      ...jest.requireActual("firebase/auth"),
      auth: {},
      signOut: jest.fn().mockResolvedValue(undefined)
    }));
    
    // Create a new mock function for this test
    const mockSignOut = jest.fn().mockResolvedValue(undefined);
    authRepository.logout = jest.fn().mockImplementation(() => mockSignOut());
    
    await authService.logout();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("should handle logout errors", async () => {
    // Create a mock function that rejects
    const mockSignOut = jest.fn().mockRejectedValue(new Error("No user logged in"));
    authRepository.logout = jest.fn().mockImplementation(() => mockSignOut());
    
    await expect(authService.logout()).rejects.toThrow("No user logged in");
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});