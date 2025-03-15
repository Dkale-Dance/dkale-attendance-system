// PaymentService.test.js

// Create mock repositories with Jest mock functions
const mockPaymentRepository = {
  createPayment: jest.fn(),
  getPaymentById: jest.fn(),
  getPaymentsByStudentId: jest.fn(),
  getAllPayments: jest.fn(),
  getPaymentsByDateRange: jest.fn()
};

const mockStudentRepository = {
  getStudentById: jest.fn(),
  updateStudent: jest.fn()
};

// Mock the repositories
jest.mock("../repository/PaymentRepository", () => ({
  paymentRepository: mockPaymentRepository
}));

jest.mock("../repository/StudentRepository", () => ({
  studentRepository: mockStudentRepository
}));

// Import PaymentService after mocking using require to avoid hoisting issues
const PaymentService = require("../services/PaymentService").default;

describe("PaymentService", () => {
  let paymentService;
  
  const mockStudentData = {
    id: "student123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: "student",
    balance: 500
  };

  const mockPaymentData = {
    id: "payment123",
    studentId: "student123",
    amount: 100,
    date: new Date(),
    paymentMethod: "cash",
    notes: "Monthly fee",
    adminId: "admin123"
  };

  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
    
    // Create service instance with the mock repositories
    paymentService = new PaymentService(mockPaymentRepository, mockStudentRepository);
  });

  test("should record a payment and update student balance", async () => {
    // Arrange
    const paymentData = {
      studentId: "student123",
      amount: 100,
      date: new Date(),
      paymentMethod: "cash",
      notes: "Monthly fee",
      adminId: "admin123"
    };
    
    const initialBalance = 500;
    const expectedBalance = 400;
    
    mockStudentRepository.getStudentById.mockResolvedValue({
      ...mockStudentData,
      balance: initialBalance
    });
    
    mockPaymentRepository.createPayment.mockResolvedValue({
      id: "payment123",
      ...paymentData
    });
    
    mockStudentRepository.updateStudent.mockResolvedValue({
      ...mockStudentData,
      balance: expectedBalance
    });

    // Act
    const result = await paymentService.recordPayment(paymentData);

    // Assert
    expect(mockStudentRepository.getStudentById).toHaveBeenCalledWith(paymentData.studentId);
    expect(mockPaymentRepository.createPayment).toHaveBeenCalledWith(paymentData);
    expect(mockStudentRepository.updateStudent).toHaveBeenCalledWith(
      paymentData.studentId,
      { balance: expectedBalance }
    );
    expect(result).toHaveProperty("payment");
    expect(result).toHaveProperty("updatedStudent");
    expect(result.updatedStudent.balance).toBe(expectedBalance);
  });

  test("should throw error if amount is not positive", async () => {
    // Arrange
    const paymentData = {
      studentId: "student123",
      amount: 0,
      date: new Date(),
      paymentMethod: "cash",
      notes: "Monthly fee",
      adminId: "admin123"
    };

    // Act & Assert
    await expect(paymentService.recordPayment(paymentData))
      .rejects
      .toThrow("Payment amount must be greater than zero");
    
    expect(mockStudentRepository.getStudentById).not.toHaveBeenCalled();
    expect(mockPaymentRepository.createPayment).not.toHaveBeenCalled();
    expect(mockStudentRepository.updateStudent).not.toHaveBeenCalled();
  });

  test("should throw error if student not found", async () => {
    // Arrange
    const paymentData = {
      studentId: "nonexistent",
      amount: 100,
      date: new Date(),
      paymentMethod: "cash",
      notes: "Monthly fee",
      adminId: "admin123"
    };
    
    mockStudentRepository.getStudentById.mockResolvedValue(null);

    // Act & Assert
    await expect(paymentService.recordPayment(paymentData))
      .rejects
      .toThrow("Student not found");
    
    expect(mockStudentRepository.getStudentById).toHaveBeenCalledWith(paymentData.studentId);
    expect(mockPaymentRepository.createPayment).not.toHaveBeenCalled();
    expect(mockStudentRepository.updateStudent).not.toHaveBeenCalled();
  });

  test("should validate payment method", async () => {
    // Arrange
    const paymentData = {
      studentId: "student123",
      amount: 100,
      date: new Date(),
      paymentMethod: "invalid",
      notes: "Monthly fee",
      adminId: "admin123"
    };

    // Act & Assert
    await expect(paymentService.recordPayment(paymentData))
      .rejects
      .toThrow("Invalid payment method. Must be one of: cash, card");
    
    expect(mockPaymentRepository.createPayment).not.toHaveBeenCalled();
    expect(mockStudentRepository.updateStudent).not.toHaveBeenCalled();
  });

  test("should get payments by student", async () => {
    // Arrange
    const studentId = "student123";
    const mockPayments = [
      { ...mockPaymentData, id: "payment1" },
      { ...mockPaymentData, id: "payment2", amount: 150 }
    ];
    
    mockPaymentRepository.getPaymentsByStudentId.mockResolvedValue(mockPayments);
    mockStudentRepository.getStudentById.mockResolvedValue(mockStudentData);

    // Act
    const result = await paymentService.getPaymentsByStudent(studentId);

    // Assert
    expect(mockPaymentRepository.getPaymentsByStudentId).toHaveBeenCalledWith(studentId);
    expect(mockStudentRepository.getStudentById).toHaveBeenCalledWith(studentId);
    expect(result).toHaveProperty("student");
    expect(result).toHaveProperty("payments");
    expect(result.payments).toEqual(mockPayments);
    expect(result.student).toEqual(mockStudentData);
  });

  test("should get all payments with student names", async () => {
    // Arrange
    const mockPayments = [
      { ...mockPaymentData, id: "payment1" },
      { ...mockPaymentData, id: "payment2", amount: 150, studentId: "student456" }
    ];
    
    const mockStudents = [
      { id: "student123", firstName: "John", lastName: "Doe" },
      { id: "student456", firstName: "Jane", lastName: "Smith" }
    ];
    
    mockPaymentRepository.getAllPayments.mockResolvedValue(mockPayments);
    mockStudentRepository.getAllStudents = jest.fn().mockResolvedValue(mockStudents);

    // Act
    const result = await paymentService.getAllPayments();

    // Assert
    expect(mockPaymentRepository.getAllPayments).toHaveBeenCalled();
    expect(mockStudentRepository.getAllStudents).toHaveBeenCalled();
    expect(result[0].studentName).toBe("John Doe");
    expect(result[1].studentName).toBe("Jane Smith");
  });

  test("should get payments by date range with student names", async () => {
    // Arrange
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-01-31");
    const mockPayments = [
      { ...mockPaymentData, id: "payment1", date: new Date("2023-01-15") },
      { ...mockPaymentData, id: "payment2", amount: 150, studentId: "student456", date: new Date("2023-01-20") }
    ];
    
    const mockStudents = [
      { id: "student123", firstName: "John", lastName: "Doe" },
      { id: "student456", firstName: "Jane", lastName: "Smith" }
    ];
    
    mockPaymentRepository.getPaymentsByDateRange.mockResolvedValue(mockPayments);
    mockStudentRepository.getAllStudents = jest.fn().mockResolvedValue(mockStudents);

    // Act
    const result = await paymentService.getPaymentsByDateRange(startDate, endDate);

    // Assert
    expect(mockPaymentRepository.getPaymentsByDateRange).toHaveBeenCalledWith(startDate, endDate);
    expect(mockStudentRepository.getAllStudents).toHaveBeenCalled();
    expect(result[0].studentName).toBe("John Doe");
    expect(result[1].studentName).toBe("Jane Smith");
  });

  test("should validate payment date", async () => {
    // Arrange
    const paymentDataWithInvalidDate = {
      studentId: "student123",
      amount: 100,
      date: "invalid-date", // Invalid date format
      paymentMethod: "cash",
      notes: "Monthly fee",
      adminId: "admin123"
    };

    // Act & Assert
    await expect(paymentService.recordPayment(paymentDataWithInvalidDate))
      .rejects
      .toThrow("Invalid payment date");
    
    expect(mockPaymentRepository.createPayment).not.toHaveBeenCalled();
    expect(mockStudentRepository.updateStudent).not.toHaveBeenCalled();
  });
});