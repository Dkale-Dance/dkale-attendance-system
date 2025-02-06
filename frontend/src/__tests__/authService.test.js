import AuthService from "../services/AuthService";
import { AuthRepository } from "../repository/AuthRepository";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

jest.mock("firebase/auth", () => {
  const actualAuth = jest.requireActual("firebase/auth"); // Preserve real Firebase functions
  return {
    ...actualAuth, // Spread actual functions so `getAuth` remains available
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  };
});

describe("AuthService (Unit Test)", () => {
  let authService;
  let authRepository;

  beforeEach(() => {
    authRepository = new AuthRepository();
    authService = new AuthService(authRepository);
  });

  it("should register a new user", async () => {
    const mockUser = { uid: "12345", email: "test@example.com" };
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    const user = await authService.register("test@example.com", "password123");
    
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), "test@example.com", "password123");
    expect(user).toHaveProperty("uid", "12345");
    expect(user.email).toBe("test@example.com");
  });

  it("should not allow duplicate registration", async () => {
    createUserWithEmailAndPassword.mockResolvedValue({ user: { email: "test@example.com" } });
    
    await authService.register("test@example.com", "password123");

    createUserWithEmailAndPassword.mockRejectedValue(new Error("User already exists"));

    await expect(authService.register("test@example.com", "password123")).rejects.toThrow("User already exists");
  });

  it("should log in a registered user", async () => {
    const mockUser = { uid: "12345", email: "test@example.com" };
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    const user = await authService.login("test@example.com", "password123");
    
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), "test@example.com", "password123");
    expect(user.email).toBe("test@example.com");
  });

  it("should not log in an unregistered user", async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error("Invalid credentials"));

    await expect(authService.login("unknown@example.com", "password123")).rejects.toThrow("Invalid credentials");
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
});
