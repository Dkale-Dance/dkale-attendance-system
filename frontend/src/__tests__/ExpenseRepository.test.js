import { ExpenseRepository } from "../repository/ExpenseRepository";

// Mock DateConverterUtils
jest.mock("../utils/DateConverterUtils", () => ({
  DateConverterUtils: {
    convertToTimestamp: jest.fn((date) => date ? { toDate: () => date } : null),
    convertToDate: jest.fn((date) => date && typeof date.toDate === 'function' ? date.toDate() : new Date(date))
  }
}));

// Mock firebase/firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

describe("ExpenseRepository", () => {
  let expenseRepository;
  let mockDoc;
  let mockSetDoc;
  let mockGetDoc;
  let mockDeleteDoc;
  let mockCollection;
  let mockQuery;
  let mockWhere;
  let mockOrderBy;
  let mockGetDocs;

  beforeEach(() => {
    // Import the mocked functions
    const firestore = require("firebase/firestore");
    const { DateConverterUtils } = require("../utils/DateConverterUtils");
    
    mockDoc = firestore.doc;
    mockSetDoc = firestore.setDoc;
    mockGetDoc = firestore.getDoc;
    mockDeleteDoc = firestore.deleteDoc;
    mockCollection = firestore.collection;
    mockQuery = firestore.query;
    mockWhere = firestore.where;
    mockOrderBy = firestore.orderBy;
    mockGetDocs = firestore.getDocs;

    // Reset mocks
    DateConverterUtils.convertToTimestamp.mockImplementation((date) => 
      date ? { toDate: () => date } : null
    );

    expenseRepository = new ExpenseRepository();
    expenseRepository.db = {};
    expenseRepository.collectionName = "expenses";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createExpense", () => {
    test("should create expense with valid data", async () => {
      const expenseData = {
        category: "supplies",
        description: "Dance shoes for students",
        amount: 150.00,
        date: new Date("2024-01-15"),
        adminId: "admin123",
        notes: "Bulk purchase for winter classes"
      };

      const mockExpenseRef = { id: "expense123" };
      mockDoc.mockReturnValue(mockExpenseRef);
      mockSetDoc.mockResolvedValue();

      const result = await expenseRepository.createExpense(expenseData);

      expect(mockDoc).toHaveBeenCalledWith({}, "expenses", expect.any(String));
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockExpenseRef,
        expect.objectContaining({
          category: expenseData.category,
          description: expenseData.description,
          amount: expenseData.amount,
          adminId: expenseData.adminId,
          notes: expenseData.notes,
        })
      );
      expect(result).toHaveProperty("id");
      expect(result.category).toBe(expenseData.category);
    });

    test("should handle creation error", async () => {
      const expenseData = {
        category: "supplies",
        description: "Test expense",
        amount: 100,
        date: new Date(),
        adminId: "admin123"
      };

      mockDoc.mockReturnValue({ id: "expense123" });
      mockSetDoc.mockRejectedValue(new Error("Firestore error"));

      await expect(expenseRepository.createExpense(expenseData)).rejects.toThrow("Failed to create expense: Firestore error");
    });
  });

  describe("getExpenseById", () => {
    test("should return expense when found", async () => {
      const expenseId = "expense123";
      const mockExpenseData = {
        category: "supplies",
        description: "Test expense",
        amount: 100,
        date: { toDate: () => new Date("2024-01-15") },
        adminId: "admin123"
      };

      const mockExpenseRef = { id: expenseId };
      const mockDocSnap = {
        exists: () => true,
        data: () => mockExpenseData,
        id: expenseId
      };

      mockDoc.mockReturnValue(mockExpenseRef);
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await expenseRepository.getExpenseById(expenseId);

      expect(mockDoc).toHaveBeenCalledWith({}, "expenses", expenseId);
      expect(mockGetDoc).toHaveBeenCalledWith(mockExpenseRef);
      expect(result).toEqual({
        ...mockExpenseData,
        id: expenseId
      });
    });

    test("should return null when expense not found", async () => {
      const expenseId = "nonexistent";
      const mockExpenseRef = { id: expenseId };
      const mockDocSnap = {
        exists: () => false
      };

      mockDoc.mockReturnValue(mockExpenseRef);
      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await expenseRepository.getExpenseById(expenseId);

      expect(result).toBeNull();
    });

    test("should handle get error", async () => {
      const expenseId = "expense123";
      mockDoc.mockReturnValue({ id: expenseId });
      mockGetDoc.mockRejectedValue(new Error("Firestore error"));

      await expect(expenseRepository.getExpenseById(expenseId)).rejects.toThrow("Failed to fetch expense: Firestore error");
    });
  });

  describe("getAllExpenses", () => {
    test("should return all expenses ordered by date", async () => {
      const mockExpenses = [
        {
          id: "exp1",
          data: () => ({
            category: "supplies",
            description: "Test 1",
            amount: 100,
            date: { toDate: () => new Date("2024-01-15") }
          })
        },
        {
          id: "exp2",
          data: () => ({
            category: "utilities",
            description: "Test 2",
            amount: 200,
            date: { toDate: () => new Date("2024-01-10") }
          })
        }
      ];

      const mockQuerySnapshot = {
        docs: mockExpenses
      };

      mockCollection.mockReturnValue("expensesRef");
      mockOrderBy.mockReturnValue("orderByRef");
      mockQuery.mockReturnValue("queryRef");
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await expenseRepository.getAllExpenses();

      expect(mockCollection).toHaveBeenCalledWith({}, "expenses");
      expect(mockOrderBy).toHaveBeenCalledWith("date", "desc");
      expect(mockQuery).toHaveBeenCalledWith("expensesRef", "orderByRef");
      expect(mockGetDocs).toHaveBeenCalledWith("queryRef");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("exp1");
      expect(result[1].id).toBe("exp2");
    });

    test("should handle get all expenses error", async () => {
      mockCollection.mockReturnValue("expensesRef");
      mockOrderBy.mockReturnValue("orderByRef");
      mockQuery.mockReturnValue("queryRef");
      mockGetDocs.mockRejectedValue(new Error("Firestore error"));

      await expect(expenseRepository.getAllExpenses()).rejects.toThrow("Failed to fetch all expenses: Firestore error");
    });
  });

  describe("getExpensesByDateRange", () => {
    test("should return expenses within date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockExpenses = [
        {
          id: "exp1",
          data: () => ({
            category: "supplies",
            amount: 100,
            date: { toDate: () => new Date("2024-01-15") }
          })
        }
      ];

      const mockQuerySnapshot = { docs: mockExpenses };

      mockCollection.mockReturnValue("expensesRef");
      mockWhere.mockReturnValue("whereRef");
      mockOrderBy.mockReturnValue("orderByRef");
      mockQuery.mockReturnValue("queryRef");
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await expenseRepository.getExpensesByDateRange(startDate, endDate);

      expect(mockWhere).toHaveBeenCalledWith("date", ">=", expect.any(Object));
      expect(mockWhere).toHaveBeenCalledWith("date", "<=", expect.any(Object));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("exp1");
    });
  });

  describe("getExpensesByCategory", () => {
    test("should return expenses filtered by category", async () => {
      const category = "supplies";
      const mockExpenses = [
        {
          id: "exp1",
          data: () => ({
            category: "supplies",
            amount: 100,
            date: { toDate: () => new Date("2024-01-15") }
          })
        }
      ];

      const mockQuerySnapshot = { docs: mockExpenses };

      mockCollection.mockReturnValue("expensesRef");
      mockWhere.mockReturnValue("whereRef");
      mockOrderBy.mockReturnValue("orderByRef");
      mockQuery.mockReturnValue("queryRef");
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await expenseRepository.getExpensesByCategory(category);

      expect(mockWhere).toHaveBeenCalledWith("category", "==", category);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe(category);
    });
  });

  describe("deleteExpense", () => {
    test("should delete expense successfully", async () => {
      const expenseId = "expense123";
      const mockExpenseRef = { id: expenseId };

      mockDoc.mockReturnValue(mockExpenseRef);
      mockDeleteDoc.mockResolvedValue();

      await expenseRepository.deleteExpense(expenseId);

      expect(mockDoc).toHaveBeenCalledWith({}, "expenses", expenseId);
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockExpenseRef);
    });

    test("should handle delete error", async () => {
      const expenseId = "expense123";
      mockDoc.mockReturnValue({ id: expenseId });
      mockDeleteDoc.mockRejectedValue(new Error("Firestore error"));

      await expect(expenseRepository.deleteExpense(expenseId)).rejects.toThrow("Failed to delete expense: Firestore error");
    });
  });
});