import {
  BaseBudgetEntry,
  FeeRevenueEntry,
  ContributionRevenueEntry,
  ExpenseEntry,
  BudgetSummary,
  BUDGET_TYPES,
  BUDGET_STATUS
} from '../models/BudgetModels';

describe('Budget Models', () => {
  describe('BaseBudgetEntry', () => {
    test('should not allow direct instantiation', () => {
      expect(() => {
        new BaseBudgetEntry('1', 100, new Date(), 'Test', 'admin123');
      }).toThrow('BaseBudgetEntry is abstract and cannot be instantiated directly');
    });

    test('should require getBudgetType to be implemented by subclasses', () => {
      class TestEntry extends BaseBudgetEntry {}
      const entry = new TestEntry('1', 100, new Date(), 'Test', 'admin123');
      
      expect(() => {
        entry.getBudgetType();
      }).toThrow('getBudgetType() must be implemented by subclass');
    });

    test('should validate required fields', () => {
      class TestEntry extends BaseBudgetEntry {
        getBudgetType() { return 'test'; }
      }

      // Test invalid amount
      const entry1 = new TestEntry('1', 0, new Date(), 'Test', 'admin123');
      expect(() => entry1.validate()).toThrow('Amount must be a positive number');

      // Test missing description
      const entry2 = new TestEntry('1', 100, new Date(), '', 'admin123');
      expect(() => entry2.validate()).toThrow('Description is required');

      // Test missing date
      const entry3 = new TestEntry('1', 100, null, 'Test', 'admin123');
      expect(() => entry3.validate()).toThrow('Date is required');

      // Test missing admin ID
      const entry4 = new TestEntry('1', 100, new Date(), 'Test', '');
      expect(() => entry4.validate()).toThrow('Admin ID is required');
    });

    test('should update timestamp when touched', () => {
      class TestEntry extends BaseBudgetEntry {
        getBudgetType() { return 'test'; }
      }
      
      const entry = new TestEntry('1', 100, new Date(), 'Test', 'admin123');
      const originalTime = entry.updatedAt;
      
      // Wait a bit then touch
      setTimeout(() => {
        entry.touch();
        expect(entry.updatedAt).not.toEqual(originalTime);
      }, 10);
    });
  });

  describe('FeeRevenueEntry', () => {
    test('should create valid fee revenue entry', () => {
      const entry = new FeeRevenueEntry(
        'fee1',
        25,
        new Date(),
        'Late fee for John',
        'admin123',
        'late',
        'student456'
      );

      expect(entry.getBudgetType()).toBe(BUDGET_TYPES.FEE_REVENUE);
      expect(entry.amount).toBe(25);
      expect(entry.feeType).toBe('late');
      expect(entry.studentId).toBe('student456');
      expect(() => entry.validate()).not.toThrow();
    });

    test('should validate fee-specific fields', () => {
      const entry = new FeeRevenueEntry(
        'fee1',
        25,
        new Date(),
        'Late fee',
        'admin123',
        '', // Missing fee type
        'student456'
      );

      expect(() => entry.validate()).toThrow('Fee type is required');

      entry.feeType = 'late';
      entry.studentId = ''; // Missing student ID
      expect(() => entry.validate()).toThrow('Student ID is required for fee revenue');
    });

    test('should identify fee types correctly', () => {
      const lateFee = new FeeRevenueEntry('1', 25, new Date(), 'Late', 'admin', 'late', 'student1');
      const absentFee = new FeeRevenueEntry('2', 30, new Date(), 'Absent', 'admin', 'absent', 'student2');

      expect(lateFee.isLateFee()).toBe(true);
      expect(lateFee.isAbsentFee()).toBe(false);
      expect(absentFee.isLateFee()).toBe(false);
      expect(absentFee.isAbsentFee()).toBe(true);
    });
  });

  describe('ContributionRevenueEntry', () => {
    test('should create valid contribution revenue entry', () => {
      const entry = new ContributionRevenueEntry(
        'contrib1',
        70,
        new Date(),
        'Monthly contribution',
        'admin123',
        'member456',
        'John Doe',
        70
      );

      expect(entry.getBudgetType()).toBe(BUDGET_TYPES.CONTRIBUTION_REVENUE);
      expect(entry.amount).toBe(70);
      expect(entry.contributorId).toBe('member456');
      expect(entry.contributorName).toBe('John Doe');
      expect(entry.expectedAmount).toBe(70);
      expect(() => entry.validate()).not.toThrow();
    });

    test('should validate contribution-specific fields', () => {
      const entry = new ContributionRevenueEntry(
        'contrib1',
        70,
        new Date(),
        'Contribution',
        'admin123',
        '', // Missing contributor ID
        'John Doe',
        70
      );

      expect(() => entry.validate()).toThrow('Contributor ID is required');

      entry.contributorId = 'member456';
      entry.contributorName = ''; // Missing contributor name
      expect(() => entry.validate()).toThrow('Contributor name is required');

      entry.contributorName = 'John Doe';
      entry.expectedAmount = 0; // Invalid expected amount
      expect(() => entry.validate()).toThrow('Expected amount must be a positive number');
    });

    test('should calculate completion status correctly', () => {
      const fullPayment = new ContributionRevenueEntry('1', 70, new Date(), 'Full', 'admin', 'member1', 'John', 70);
      const partialPayment = new ContributionRevenueEntry('2', 50, new Date(), 'Partial', 'admin', 'member2', 'Jane', 70);
      const overpayment = new ContributionRevenueEntry('3', 100, new Date(), 'Over', 'admin', 'member3', 'Bob', 70);

      expect(fullPayment.isComplete()).toBe(true);
      expect(fullPayment.getRemainingAmount()).toBe(0);
      expect(fullPayment.isOverpayment()).toBe(false);

      expect(partialPayment.isComplete()).toBe(false);
      expect(partialPayment.getRemainingAmount()).toBe(20);
      expect(partialPayment.isOverpayment()).toBe(false);

      expect(overpayment.isComplete()).toBe(true);
      expect(overpayment.getRemainingAmount()).toBe(0);
      expect(overpayment.isOverpayment()).toBe(true);
      expect(overpayment.getOverpaymentAmount()).toBe(30);
    });
  });

  describe('ExpenseEntry', () => {
    test('should create valid expense entry', () => {
      const entry = new ExpenseEntry(
        'exp1',
        150,
        new Date(),
        'Dance shoes',
        'admin123',
        'supplies',
        'Bulk purchase for winter classes'
      );

      expect(entry.getBudgetType()).toBe(BUDGET_TYPES.EXPENSE);
      expect(entry.amount).toBe(150);
      expect(entry.category).toBe('supplies');
      expect(entry.notes).toBe('Bulk purchase for winter classes');
      expect(() => entry.validate()).not.toThrow();
    });

    test('should validate expense-specific fields', () => {
      const entry = new ExpenseEntry(
        'exp1',
        150,
        new Date(),
        'Dance shoes',
        'admin123',
        '', // Missing category
        'Notes'
      );

      expect(() => entry.validate()).toThrow('Expense category is required');
    });

    test('should identify major expenses correctly', () => {
      const smallExpense = new ExpenseEntry('1', 100, new Date(), 'Small', 'admin', 'supplies', 'Notes');
      const majorExpense = new ExpenseEntry('2', 600, new Date(), 'Major', 'admin', 'equipment', 'Notes');

      expect(smallExpense.isMajorExpense()).toBe(false);
      expect(majorExpense.isMajorExpense()).toBe(true);
      expect(smallExpense.isMajorExpense(50)).toBe(true); // Custom threshold
    });
  });

  describe('BudgetSummary', () => {
    test('should create valid budget summary', () => {
      const summary = new BudgetSummary(500, 1400, 800);

      expect(summary.feeRevenue).toBe(500);
      expect(summary.contributionRevenue).toBe(1400);
      expect(summary.totalExpenses).toBe(800);
      expect(summary.generatedAt).toBeInstanceOf(Date);
    });

    test('should calculate totals correctly', () => {
      const summary = new BudgetSummary(500, 1400, 800);

      expect(summary.getTotalRevenue()).toBe(1900);
      expect(summary.getNetBudget()).toBe(1100);
      expect(summary.isPositive()).toBe(true);
    });

    test('should handle negative budget', () => {
      const summary = new BudgetSummary(200, 300, 800);

      expect(summary.getTotalRevenue()).toBe(500);
      expect(summary.getNetBudget()).toBe(-300);
      expect(summary.isPositive()).toBe(false);
    });

    test('should calculate revenue breakdown correctly', () => {
      const summary = new BudgetSummary(300, 700, 500);
      const breakdown = summary.getRevenueBreakdown();

      expect(breakdown.feePercentage).toBe(30);
      expect(breakdown.contributionPercentage).toBe(70);
    });

    test('should handle zero revenue breakdown', () => {
      const summary = new BudgetSummary(0, 0, 100);
      const breakdown = summary.getRevenueBreakdown();

      expect(breakdown.feePercentage).toBe(0);
      expect(breakdown.contributionPercentage).toBe(0);
    });

    test('should support period filtering', () => {
      const period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };
      const summary = new BudgetSummary(500, 1400, 800, period);

      expect(summary.period).toEqual(period);
    });
  });
});