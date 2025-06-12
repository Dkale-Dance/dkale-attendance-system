import ExpenseService from "../services/ExpenseService";

describe("ExpenseService", () => {
  let expenseService;
  let mockExpenseRepository;

  beforeEach(() => {
    mockExpenseRepository = {
      createExpense: jest.fn(),
      getExpenseById: jest.fn(),
      getAllExpenses: jest.fn(),
      getExpensesByDateRange: jest.fn(),
      getExpensesByCategory: jest.fn(),
      deleteExpense: jest.fn(),
    };

    expenseService = new ExpenseService(mockExpenseRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateExpense", () => {
    test("should validate valid expense data", () => {
      const validExpense = {
        category: "supplies",
        description: "Dance shoes",
        amount: 150.00,
        date: new Date("2024-01-15"),
        adminId: "admin123"
      };

      expect(() => expenseService.validateExpense(validExpense)).not.toThrow();
    });

    test("should throw error for missing amount", () => {
      const invalidExpense = {
        category: "supplies",
        description: "Dance shoes",
        date: new Date(),
        adminId: "admin123"
      };

      expect(() => expenseService.validateExpense(invalidExpense)).toThrow("Expense amount must be greater than zero");
    });

    test("should throw error for negative amount", () => {
      const invalidExpense = {
        category: "supplies",
        description: "Dance shoes",
        amount: -50,
        date: new Date(),
        adminId: "admin123"
      };

      expect(() => expenseService.validateExpense(invalidExpense)).toThrow("Expense amount must be greater than zero");
    });

    test("should throw error for invalid category", () => {
      const invalidExpense = {
        category: "invalid-category",
        description: "Dance shoes",
        amount: 150,
        date: new Date(),
        adminId: "admin123"
      };

      expect(() => expenseService.validateExpense(invalidExpense)).toThrow("Invalid expense category");
    });

    test("should throw error for missing description", () => {
      const invalidExpense = {
        category: "supplies",
        amount: 150,
        date: new Date(),
        adminId: "admin123"
      };

      expect(() => expenseService.validateExpense(invalidExpense)).toThrow("Expense description is required");
    });

    test("should throw error for invalid date", () => {
      const invalidExpense = {
        category: "supplies",
        description: "Dance shoes",
        amount: 150,
        date: "invalid-date",
        adminId: "admin123"
      };

      expect(() => expenseService.validateExpense(invalidExpense)).toThrow("Invalid expense date");
    });

    test("should throw error for missing adminId", () => {
      const invalidExpense = {
        category: "supplies",
        description: "Dance shoes",
        amount: 150,
        date: new Date()
      };

      expect(() => expenseService.validateExpense(invalidExpense)).toThrow("Admin ID is required");
    });
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

      const createdExpense = { id: "expense123", ...expenseData };
      mockExpenseRepository.createExpense.mockResolvedValue(createdExpense);

      const result = await expenseService.createExpense(expenseData);

      expect(mockExpenseRepository.createExpense).toHaveBeenCalledWith(expenseData);
      expect(result).toEqual(createdExpense);
    });

    test("should handle validation error", async () => {
      const invalidExpenseData = {
        category: "invalid",
        description: "Test",
        amount: 50, // Valid amount to test category validation
        date: new Date(),
        adminId: "admin123"
      };

      await expect(expenseService.createExpense(invalidExpenseData)).rejects.toThrow("Invalid expense category");
      expect(mockExpenseRepository.createExpense).not.toHaveBeenCalled();
    });

    test("should handle repository error", async () => {
      const expenseData = {
        category: "supplies",
        description: "Test expense",
        amount: 100,
        date: new Date(),
        adminId: "admin123"
      };

      mockExpenseRepository.createExpense.mockRejectedValue(new Error("Repository error"));

      await expect(expenseService.createExpense(expenseData)).rejects.toThrow("Repository error");
    });
  });

  describe("getAllExpenses", () => {
    test("should return all expenses", async () => {
      const mockExpenses = [
        { id: "exp1", category: "supplies", amount: 100, description: "Test 1" },
        { id: "exp2", category: "utilities", amount: 200, description: "Test 2" }
      ];

      mockExpenseRepository.getAllExpenses.mockResolvedValue(mockExpenses);

      const result = await expenseService.getAllExpenses();

      expect(mockExpenseRepository.getAllExpenses).toHaveBeenCalled();
      expect(result).toEqual(mockExpenses);
    });

    test("should handle repository error", async () => {
      mockExpenseRepository.getAllExpenses.mockRejectedValue(new Error("Repository error"));

      await expect(expenseService.getAllExpenses()).rejects.toThrow("Repository error");
    });
  });

  describe("getExpensesByDateRange", () => {
    test("should return expenses within date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockExpenses = [
        { id: "exp1", category: "supplies", amount: 100, date: new Date("2024-01-15") }
      ];

      mockExpenseRepository.getExpensesByDateRange.mockResolvedValue(mockExpenses);

      const result = await expenseService.getExpensesByDateRange(startDate, endDate);

      expect(mockExpenseRepository.getExpensesByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual(mockExpenses);
    });

    test("should handle invalid date range", async () => {
      const invalidStart = "invalid-date";
      const validEnd = new Date("2024-01-31");

      await expect(expenseService.getExpensesByDateRange(invalidStart, validEnd)).rejects.toThrow("Invalid date range");
      expect(mockExpenseRepository.getExpensesByDateRange).not.toHaveBeenCalled();
    });
  });

  describe("getExpensesByCategory", () => {
    test("should return expenses for valid category", async () => {
      const category = "supplies";
      const mockExpenses = [
        { id: "exp1", category: "supplies", amount: 100 },
        { id: "exp2", category: "supplies", amount: 150 }
      ];

      mockExpenseRepository.getExpensesByCategory.mockResolvedValue(mockExpenses);

      const result = await expenseService.getExpensesByCategory(category);

      expect(mockExpenseRepository.getExpensesByCategory).toHaveBeenCalledWith(category);
      expect(result).toEqual(mockExpenses);
    });

    test("should handle invalid category", async () => {
      const invalidCategory = "invalid-category";

      await expect(expenseService.getExpensesByCategory(invalidCategory)).rejects.toThrow("Invalid expense category");
      expect(mockExpenseRepository.getExpensesByCategory).not.toHaveBeenCalled();
    });
  });

  describe("deleteExpense", () => {
    test("should delete expense successfully", async () => {
      const expenseId = "expense123";
      const mockExpense = { id: expenseId, category: "supplies", amount: 100 };

      mockExpenseRepository.getExpenseById.mockResolvedValue(mockExpense);
      mockExpenseRepository.deleteExpense.mockResolvedValue();

      const result = await expenseService.deleteExpense(expenseId);

      expect(mockExpenseRepository.getExpenseById).toHaveBeenCalledWith(expenseId);
      expect(mockExpenseRepository.deleteExpense).toHaveBeenCalledWith(expenseId);
      expect(result).toEqual({ success: true, deletedExpense: mockExpense });
    });

    test("should handle expense not found", async () => {
      const expenseId = "nonexistent";

      mockExpenseRepository.getExpenseById.mockResolvedValue(null);

      await expect(expenseService.deleteExpense(expenseId)).rejects.toThrow("Expense not found");
      expect(mockExpenseRepository.deleteExpense).not.toHaveBeenCalled();
    });
  });

  describe("getExpenseSummaryByCategory", () => {
    test("should return expense summary grouped by category", async () => {
      const mockExpenses = [
        { id: "exp1", category: "supplies", amount: 100 },
        { id: "exp2", category: "supplies", amount: 150 },
        { id: "exp3", category: "utilities", amount: 200 },
        { id: "exp4", category: "maintenance", amount: 300 }
      ];

      mockExpenseRepository.getAllExpenses.mockResolvedValue(mockExpenses);

      const result = await expenseService.getExpenseSummaryByCategory();

      const expectedSummary = {
        supplies: 250,
        utilities: 200,
        maintenance: 300
      };

      expect(result).toEqual(expectedSummary);
    });

    test("should return empty object when no expenses", async () => {
      mockExpenseRepository.getAllExpenses.mockResolvedValue([]);

      const result = await expenseService.getExpenseSummaryByCategory();

      expect(result).toEqual({});
    });
  });

  describe("getTotalExpenses", () => {
    test("should return total of all expenses", async () => {
      const mockExpenses = [
        { id: "exp1", amount: 100 },
        { id: "exp2", amount: 150 },
        { id: "exp3", amount: 200 }
      ];

      mockExpenseRepository.getAllExpenses.mockResolvedValue(mockExpenses);

      const result = await expenseService.getTotalExpenses();

      expect(result).toBe(450);
    });

    test("should return 0 when no expenses", async () => {
      mockExpenseRepository.getAllExpenses.mockResolvedValue([]);

      const result = await expenseService.getTotalExpenses();

      expect(result).toBe(0);
    });
  });
});