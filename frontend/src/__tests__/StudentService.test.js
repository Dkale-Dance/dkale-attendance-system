// StudentService.test.js

// Create mock repository with Jest mock functions
const mockStudentRepository = {
    getStudentById: jest.fn(),
    updateStudent: jest.fn(),
    removeStudent: jest.fn(),
    getStudentsByStatus: jest.fn(),
    getAllStudents: jest.fn(),
    setStudentData: jest.fn()
  };
  
  // Mock the StudentRepository module BEFORE importing StudentService
  jest.mock("../repository/StudentRepository", () => ({
    studentRepository: mockStudentRepository
  }));
  
  // Import StudentService after mocking using require to avoid hoisting issues
  const StudentService = require("../services/StudentService").default;
  
  describe("StudentService", () => {
    let studentService;
    
    const mockStudentData = {
      id: "user123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      role: "student"
    };
  
    beforeEach(() => {
      // Clear mock calls before each test
      jest.clearAllMocks();
      
      // Create service instance with the mock repository
      studentService = new StudentService(mockStudentRepository);
    });
  
    test("should update student profile information", async () => {
      // Arrange
      const updateData = {
        firstName: "Jane",
        lastName: "Smith"
      };
      
      const updatedStudent = {
        ...mockStudentData,
        ...updateData
      };
      
      mockStudentRepository.updateStudent.mockResolvedValue(updatedStudent);
  
      // Act
      const result = await studentService.updateStudent(mockStudentData.id, updateData);
  
      // Assert
      expect(mockStudentRepository.updateStudent).toHaveBeenCalledWith(mockStudentData.id, updateData);
      expect(result).toEqual(updatedStudent);
    });
  
    test("should initialize student profile", async () => {
      // Arrange
      const userId = "user123";
      const initialData = {
        firstName: "John",
        lastName: "Doe"
      };
      
      const expectedData = {
        enrollmentStatus: "Pending Payment",
        balance: 0,
        role: "student",
        danceRole: "Lead",
        ...initialData
      };
      
      mockStudentRepository.setStudentData.mockResolvedValue({ 
        id: userId, 
        ...expectedData 
      });
  
      // Act
      const result = await studentService.initializeStudentProfile(userId, initialData);
  
      // Assert
      expect(mockStudentRepository.setStudentData).toHaveBeenCalledWith(userId, expectedData);
      expect(result).toHaveProperty("id", userId);
      expect(result).toHaveProperty("firstName", "John");
    });
  
    test("should change student enrollment status", async () => {
      // Arrange
      const currentStudent = {
        ...mockStudentData,
        enrollmentStatus: "Pending Payment"
      };
      
      const updatedStatus = "Enrolled";
      
      mockStudentRepository.getStudentById.mockResolvedValue(currentStudent);
      mockStudentRepository.updateStudent.mockResolvedValue({
        ...currentStudent,
        enrollmentStatus: updatedStatus
      });
  
      // Act
      const result = await studentService.changeEnrollmentStatus(mockStudentData.id, updatedStatus);
  
      // Assert
      expect(mockStudentRepository.updateStudent).toHaveBeenCalledWith(
        mockStudentData.id, 
        { enrollmentStatus: updatedStatus }
      );
      expect(result.enrollmentStatus).toBe(updatedStatus);
    });
  
    test("should not remove student with balance", async () => {
      // Arrange
      mockStudentRepository.removeStudent.mockRejectedValue(
        new Error("Cannot remove student with outstanding balance")
      );
  
      // Act & Assert
      await expect(studentService.removeStudent(mockStudentData.id))
        .rejects
        .toThrow("Cannot remove student with outstanding balance");
    });
  
    test("should remove student with zero balance", async () => {
      // Arrange
      mockStudentRepository.removeStudent.mockResolvedValue(true);
  
      // Act
      const result = await studentService.removeStudent(mockStudentData.id);
  
      // Assert
      expect(mockStudentRepository.removeStudent).toHaveBeenCalledWith(mockStudentData.id);
      expect(result).toBe(true);
    });
  
    test("should get students by enrollment status", async () => {
      // Arrange
      const mockStudents = [
        { id: "student1", firstName: "John", enrollmentStatus: "Enrolled", role: "student" },
        { id: "student2", firstName: "Jane", enrollmentStatus: "Enrolled", role: "student" }
      ];
      
      mockStudentRepository.getStudentsByStatus.mockResolvedValue(mockStudents);
  
      // Act
      const result = await studentService.getStudentsByStatus("Enrolled");
  
      // Assert
      expect(mockStudentRepository.getStudentsByStatus).toHaveBeenCalledWith("Enrolled");
      
      // Since we're now sorting by firstName, we need to sort the mock data the same way
      const expectedSortedStudents = [...mockStudents].sort((a, b) => {
        const firstNameA = (a.firstName || '').toLowerCase();
        const firstNameB = (b.firstName || '').toLowerCase();
        return firstNameA.localeCompare(firstNameB);
      });
      
      expect(result).toEqual(expectedSortedStudents);
    });
  
    test("should add student balance", async () => {
      // Arrange
      const initialBalance = 100;
      const amountToAdd = 250;
      const expectedBalance = 350;
      
      mockStudentRepository.getStudentById.mockResolvedValue({
        ...mockStudentData,
        balance: initialBalance
      });
      
      mockStudentRepository.updateStudent.mockResolvedValue({
        ...mockStudentData,
        balance: expectedBalance
      });
  
      // Act
      const result = await studentService.addBalance(mockStudentData.id, amountToAdd);
  
      // Assert
      expect(mockStudentRepository.updateStudent).toHaveBeenCalledWith(
        mockStudentData.id,
        { balance: expectedBalance }
      );
      expect(result.balance).toBe(expectedBalance);
    });
  
    test("should reduce student balance", async () => {
      // Arrange
      const initialBalance = 200;
      const amountToReduce = 50;
      const expectedBalance = 150;
      
      mockStudentRepository.getStudentById.mockResolvedValue({
        ...mockStudentData,
        balance: initialBalance
      });
      
      mockStudentRepository.updateStudent.mockResolvedValue({
        ...mockStudentData,
        balance: expectedBalance
      });
  
      // Act
      const result = await studentService.reduceBalance(mockStudentData.id, amountToReduce);
  
      // Assert
      expect(mockStudentRepository.updateStudent).toHaveBeenCalledWith(
        mockStudentData.id,
        { balance: expectedBalance }
      );
      expect(result.balance).toBe(expectedBalance);
    });
  
    test("should allow negative balances (credits)", async () => {
      // Arrange
      const initialBalance = 30;
      const amountToReduce = 50;
      const expectedBalance = -20; // 30 - 50 = -20 (credit)
      
      mockStudentRepository.getStudentById.mockResolvedValue({
        ...mockStudentData,
        balance: initialBalance
      });
      
      mockStudentRepository.updateStudent.mockResolvedValue({
        ...mockStudentData,
        balance: expectedBalance
      });
  
      // Act
      const result = await studentService.reduceBalance(mockStudentData.id, amountToReduce);
  
      // Assert
      expect(mockStudentRepository.updateStudent).toHaveBeenCalledWith(
        mockStudentData.id,
        { balance: expectedBalance }
      );
      expect(result.balance).toBe(expectedBalance);
    });
  });
  