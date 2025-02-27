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
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    // Perform registration
    const result = await authService.register("test@example.com", "password123");

    // Verify Auth creation
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com",
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
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    const user = await authService.login("test@example.com", "password123");
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com",
      "password123"
    );
    expect(user.email).toBe("test@example.com");
  });

  it("should not log in an unregistered user", async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error("Invalid credentials"));
    await expect(authService.login("unknown@example.com", "password123"))
      .rejects.toThrow("Invalid credentials");
  });

  it("should log out a user", async () => {
    signOut.mockResolvedValue();
    await authService.logout();
    expect(signOut).toHaveBeenCalled();
  });

  it("should handle logout errors", async () => {
    signOut.mockRejectedValue(new Error("No user logged in"));
    await expect(authService.logout()).rejects.toThrow("No user logged in");
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});