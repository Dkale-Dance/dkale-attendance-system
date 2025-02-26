// StudentRepository.test.js
import { StudentRepository } from "../repository/StudentRepository";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, query, collection, where, getDocs } from "firebase/firestore";

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

describe("StudentRepository (Unit Test)", () => {
  let studentRepository;
  const mockFirestore = { id: "mockFirestore" };
  const mockDocRef = { id: "mockDocRef" };
  const mockQuery = { id: "mockQuery" };
  const mockStudentData = {
    id: "student123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    enrollmentStatus: "Enrolled",
    balance: 0,
    role: "student"
  };
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    getFirestore.mockReturnValue(mockFirestore);
    doc.mockReturnValue(mockDocRef);
    collection.mockReturnValue({ id: "usersCollection" });
    query.mockReturnValue(mockQuery);
    setDoc.mockResolvedValue();
    updateDoc.mockResolvedValue();
    deleteDoc.mockResolvedValue();
    
    // Create new repository instance
    studentRepository = new StudentRepository();
  });

  it("should update student information in the users collection", async () => {
    // Arrange
    const updateData = {
      firstName: "Jane",
      enrollmentStatus: "Inactive"
    };

    // Act
    await studentRepository.updateStudent(mockStudentData.id, updateData);

    // Assert
    expect(doc).toHaveBeenCalledWith(mockFirestore, "users", mockStudentData.id);
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, updateData);
  });

  it("should get a student by ID from the users collection", async () => {
    // Arrange
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockStudentData,
      id: mockStudentData.id
    });

    // Act
    const student = await studentRepository.getStudentById(mockStudentData.id);

    // Assert
    expect(doc).toHaveBeenCalledWith(mockFirestore, "users", mockStudentData.id);
    expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    expect(student).toEqual({ ...mockStudentData, id: mockStudentData.id });
  });

  it("should return null for non-existent student", async () => {
    // Arrange
    getDoc.mockResolvedValue({
      exists: () => false
    });

    // Act
    const student = await studentRepository.getStudentById("nonexistent");

    // Assert
    expect(student).toBeNull();
  });

  it("should not remove student with positive balance", async () => {
    // Arrange
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...mockStudentData, balance: 100 }),
      id: mockStudentData.id
    });

    // Act & Assert
    await expect(studentRepository.removeStudent(mockStudentData.id))
      .rejects
      .toThrow("Cannot remove student with outstanding balance");
    
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it("should set student status to Removed with zero balance", async () => {
    // Arrange
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...mockStudentData, balance: 0 }),
      id: mockStudentData.id
    });

    // Act
    await studentRepository.removeStudent(mockStudentData.id);

    // Assert
    expect(doc).toHaveBeenCalledWith(mockFirestore, "users", mockStudentData.id);
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { enrollmentStatus: "Removed" });
  });

  it("should get all students with role student", async () => {
    // Arrange
    const studentsData = [
      { ...mockStudentData, id: "student1" },
      { ...mockStudentData, id: "student2", firstName: "Jane" }
    ];
    
    getDocs.mockResolvedValue({
      docs: studentsData.map(student => ({
        data: () => student,
        id: student.id
      }))
    });

    // Act
    const students = await studentRepository.getAllStudents();

    // Assert
    expect(collection).toHaveBeenCalledWith(mockFirestore, "users");
    expect(where).toHaveBeenCalledWith("role", "==", "student");
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(students).toEqual(studentsData);
  });

  it("should get students with specific enrollment status", async () => {
    // Arrange
    const enrolledStudents = [
      { ...mockStudentData, id: "student1" },
      { ...mockStudentData, id: "student2", firstName: "Jane" }
    ];
    
    getDocs.mockResolvedValue({
      docs: enrolledStudents.map(student => ({
        data: () => student,
        id: student.id
      }))
    });

    // Act
    const students = await studentRepository.getStudentsByStatus("Enrolled");

    // Assert
    expect(collection).toHaveBeenCalledWith(mockFirestore, "users");
    expect(where).toHaveBeenCalledWith("role", "==", "student");
    expect(where).toHaveBeenCalledWith("enrollmentStatus", "==", "Enrolled");
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(students).toEqual(enrolledStudents);
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});