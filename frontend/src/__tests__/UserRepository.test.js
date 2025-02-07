import { UserRepository } from "../repository/UserRepository";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Mock Firestore functions first
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
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

    // First verify doc() was called correctly
    expect(doc).toHaveBeenCalledWith(mockFirestore, "users", "user123");
    
    // Then verify setDoc() was called with the returned mockDocRef
    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      { role: "admin" },
      { merge: true }
    );
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});