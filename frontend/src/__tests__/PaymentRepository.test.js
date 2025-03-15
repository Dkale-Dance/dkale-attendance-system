// PaymentRepository.test.js
import { PaymentRepository } from "../repository/PaymentRepository";
import { getFirestore, doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs, orderBy } from "firebase/firestore";

// Mock Firestore functions
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn().mockImplementation((date) => ({ toDate: () => date }))
  }
}));

describe("PaymentRepository", () => {
  let paymentRepository;
  const mockFirestore = { id: "mockFirestore" };
  const mockDocRef = { id: "mockDocRef" };
  const mockQuery = { id: "mockQuery" };
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
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    getFirestore.mockReturnValue(mockFirestore);
    doc.mockReturnValue(mockDocRef);
    collection.mockReturnValue({ id: "paymentsCollection" });
    query.mockReturnValue(mockQuery);
    setDoc.mockResolvedValue();
    
    // Create new repository instance
    paymentRepository = new PaymentRepository();
  });

  it("should create a new payment record", async () => {
    // Arrange
    const paymentData = {
      studentId: "student123",
      amount: 100,
      date: new Date(),
      paymentMethod: "cash",
      notes: "Monthly fee",
      adminId: "admin123"
    };

    // Act
    const result = await paymentRepository.createPayment(paymentData);

    // Assert
    expect(doc).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
    expect(result).toHaveProperty('id');
    expect(result.studentId).toBe(paymentData.studentId);
    expect(result.amount).toBe(paymentData.amount);
  });

  it("should fetch a payment by ID", async () => {
    // Arrange
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockPaymentData,
      id: "payment123"
    });

    // Act
    const payment = await paymentRepository.getPaymentById("payment123");

    // Assert
    expect(doc).toHaveBeenCalledWith(mockFirestore, "payments", "payment123");
    expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    expect(payment).toEqual({ ...mockPaymentData, id: "payment123" });
  });

  it("should return null for non-existent payment", async () => {
    // Arrange
    getDoc.mockResolvedValue({
      exists: () => false
    });

    // Act
    const payment = await paymentRepository.getPaymentById("nonexistent");

    // Assert
    expect(payment).toBeNull();
  });

  it("should get payments by student ID", async () => {
    // Arrange
    const studentId = "student123";
    const mockPayments = [
      { ...mockPaymentData, id: "payment1" },
      { ...mockPaymentData, id: "payment2", amount: 150 }
    ];
    
    getDocs.mockResolvedValue({
      docs: mockPayments.map(payment => ({
        data: () => payment,
        id: payment.id
      }))
    });

    // Act
    const payments = await paymentRepository.getPaymentsByStudentId(studentId);

    // Assert
    expect(collection).toHaveBeenCalledWith(mockFirestore, "payments");
    expect(where).toHaveBeenCalledWith("studentId", "==", studentId);
    expect(orderBy).toHaveBeenCalledWith("date", "desc");
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(payments).toEqual(mockPayments);
  });

  it("should get all payments", async () => {
    // Arrange
    const mockPayments = [
      { ...mockPaymentData, id: "payment1" },
      { ...mockPaymentData, id: "payment2", amount: 150, studentId: "student456" }
    ];
    
    getDocs.mockResolvedValue({
      docs: mockPayments.map(payment => ({
        data: () => payment,
        id: payment.id
      }))
    });

    // Act
    const payments = await paymentRepository.getAllPayments();

    // Assert
    expect(collection).toHaveBeenCalledWith(mockFirestore, "payments");
    expect(orderBy).toHaveBeenCalledWith("date", "desc");
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(payments).toEqual(mockPayments);
  });

  it("should get payments by date range", async () => {
    // Arrange
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-01-31");
    const mockPayments = [
      { ...mockPaymentData, id: "payment1", date: new Date("2023-01-15") },
      { ...mockPaymentData, id: "payment2", amount: 150, date: new Date("2023-01-20") }
    ];
    
    getDocs.mockResolvedValue({
      docs: mockPayments.map(payment => ({
        data: () => payment,
        id: payment.id
      }))
    });

    // Act
    const payments = await paymentRepository.getPaymentsByDateRange(startDate, endDate);

    // Assert
    expect(collection).toHaveBeenCalledWith(mockFirestore, "payments");
    expect(where).toHaveBeenCalledWith("date", ">=", startDate);
    expect(where).toHaveBeenCalledWith("date", "<=", endDate);
    expect(orderBy).toHaveBeenCalledWith("date", "desc");
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledWith(mockQuery);
    expect(payments).toEqual(mockPayments);
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});