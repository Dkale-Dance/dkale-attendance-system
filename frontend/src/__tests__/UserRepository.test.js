import { UserRepository } from "../repository/UserRepository";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Mock Firestore functions first
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

describe("UserRepository (Unit Test)", () => {
  let userRepository;
  const mockFirestore = { id: "mockFirestore" };
  const mockDocRef = { id: "mockDocRef" };
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    getFirestore.mockReturnValue(mockFirestore);
    doc.mockReturnValue(mockDocRef);
    setDoc.mockResolvedValue();
    
    // Create new repository instance
    userRepository = new UserRepository();
  });

  it("should assign a role to a user", async () => {
    await userRepository.assignRole("user123", "admin");

    expect(doc).toHaveBeenCalledWith(mockFirestore, "users", "user123");
    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      { role: "admin" },
      { merge: true }
    );
  });

  it("should get role for existing user", async () => {
    // Mock existing user with admin role
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: "admin" })
    });

    const role = await userRepository.getRole("user123");

    expect(doc).toHaveBeenCalledWith(mockFirestore, "users", "user123");
    expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    expect(role).toBe("admin");
  });

  it("should return anonymous for non-existing user", async () => {
    // Mock non-existing user
    getDoc.mockResolvedValue({
      exists: () => false,
      data: () => null
    });

    const role = await userRepository.getRole("nonexistent");

    expect(doc).toHaveBeenCalledWith(mockFirestore, "users", "nonexistent");
    expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    expect(role).toBe("anonymous");
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});