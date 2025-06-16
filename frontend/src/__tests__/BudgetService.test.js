import { BudgetService } from '../services/BudgetService';
import { BUDGET_TYPES, BUDGET_STATUS } from '../models/BudgetModels';

// Mock BudgetRepository
const mockBudgetRepository = {
  createFeeRevenue: jest.fn(),
  createContributionRevenue: jest.fn(),
  createExpense: jest.fn(),
  getBudgetEntryById: jest.fn(),
  getAllBudgetEntries: jest.fn(),
  getBudgetEntriesByType: jest.fn(),
  getBudgetEntriesByDateRange: jest.fn(),
  getContributionsByContributor: jest.fn(),
  updateBudgetEntry: jest.fn(),
  deleteBudgetEntry: jest.fn()
};

describe('BudgetService', () => {
  let budgetService;

  beforeEach(() => {
    budgetService = new BudgetService(mockBudgetRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeeRevenue', () => {
    test('should create fee revenue successfully', async () => {
      const feeData = {
        amount: 25,
        date: new Date('2024-01-15'),
        description: 'Late fee for John',
        adminId: 'admin123',
        feeType: 'late',
        studentId: 'student456'
      };

      const mockCreatedFee = {
        id: 'fee123',
        ...feeData,
        budgetType: BUDGET_TYPES.FEE_REVENUE,
        status: BUDGET_STATUS.ACTIVE
      };

      mockBudgetRepository.createFeeRevenue.mockResolvedValue(mockCreatedFee);

      const result = await budgetService.createFeeRevenue(feeData);

      expect(mockBudgetRepository.createFeeRevenue).toHaveBeenCalledWith(feeData);
      expect(result).toEqual(mockCreatedFee);
    });

    test('should validate fee revenue data', async () => {
      const invalidFeeData = {
        amount: -25, // Invalid amount
        date: new Date(),
        description: 'Late fee',
        adminId: 'admin123',
        feeType: 'late',
        studentId: 'student456'
      };

      await expect(budgetService.createFeeRevenue(invalidFeeData)).rejects.toThrow('Amount must be a positive number');
    });

    test('should handle repository errors', async () => {
      const feeData = {
        amount: 25,
        date: new Date(),
        description: 'Late fee',
        adminId: 'admin123',
        feeType: 'late',
        studentId: 'student456'
      };

      mockBudgetRepository.createFeeRevenue.mockRejectedValue(new Error('Repository error'));

      await expect(budgetService.createFeeRevenue(feeData)).rejects.toThrow('Repository error');
    });
  });

  describe('createContributionRevenue', () => {
    test('should create contribution revenue successfully', async () => {
      const contributionData = {
        amount: 70,
        date: new Date('2024-01-15'),
        description: 'Monthly contribution from John',
        adminId: 'admin123',
        contributorId: 'member456',
        contributorName: 'John Doe',
        expectedAmount: 70
      };

      const mockCreatedContribution = {
        id: 'contrib123',
        ...contributionData,
        budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
        status: BUDGET_STATUS.ACTIVE
      };

      mockBudgetRepository.createContributionRevenue.mockResolvedValue(mockCreatedContribution);

      const result = await budgetService.createContributionRevenue(contributionData);

      expect(mockBudgetRepository.createContributionRevenue).toHaveBeenCalledWith(contributionData);
      expect(result).toEqual(mockCreatedContribution);
    });

    test('should handle partial payments', async () => {
      const partialPayment = {
        amount: 50,
        date: new Date(),
        description: 'Partial payment',
        adminId: 'admin123',
        contributorId: 'member456',
        contributorName: 'John Doe',
        expectedAmount: 70
      };

      const mockCreatedContribution = {
        id: 'contrib123',
        ...partialPayment,
        budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
        status: BUDGET_STATUS.PENDING // Should be pending for partial payments
      };

      mockBudgetRepository.createContributionRevenue.mockResolvedValue(mockCreatedContribution);

      const result = await budgetService.createContributionRevenue(partialPayment);
      expect(result.status).toBe(BUDGET_STATUS.PENDING);
    });

    test('should validate contribution data', async () => {
      const invalidContributionData = {
        amount: 70,
        date: new Date(),
        description: '',  // Invalid description
        adminId: 'admin123',
        contributorId: 'member456',
        contributorName: 'John Doe',
        expectedAmount: 70
      };

      await expect(budgetService.createContributionRevenue(invalidContributionData)).rejects.toThrow('Description is required');
    });
  });

  describe('calculateBudgetSummary', () => {
    test('should calculate budget summary correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEntries = [
        {
          id: 'fee1',
          budgetType: BUDGET_TYPES.FEE_REVENUE,
          amount: 25,
          date: new Date('2024-01-15')
        },
        {
          id: 'fee2',
          budgetType: BUDGET_TYPES.FEE_REVENUE,
          amount: 30,
          date: new Date('2024-01-10')
        },
        {
          id: 'contrib1',
          budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
          amount: 70,
          date: new Date('2024-01-20')
        },
        {
          id: 'contrib2',
          budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
          amount: 70,
          date: new Date('2024-01-25')
        },
        {
          id: 'exp1',
          budgetType: BUDGET_TYPES.EXPENSE,
          amount: 150,
          date: new Date('2024-01-18')
        }
      ];

      mockBudgetRepository.getBudgetEntriesByDateRange.mockResolvedValue(mockEntries);

      const summary = await budgetService.calculateBudgetSummary(startDate, endDate);

      expect(summary.feeRevenue).toBe(55); // 25 + 30
      expect(summary.contributionRevenue).toBe(140); // 70 + 70
      expect(summary.totalExpenses).toBe(150);
      expect(summary.getTotalRevenue()).toBe(195); // 55 + 140
      expect(summary.getNetBudget()).toBe(45); // 195 - 150
      expect(summary.isPositive()).toBe(true);
    });

    test('should handle empty date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockBudgetRepository.getBudgetEntriesByDateRange.mockResolvedValue([]);

      const summary = await budgetService.calculateBudgetSummary(startDate, endDate);

      expect(summary.feeRevenue).toBe(0);
      expect(summary.contributionRevenue).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.getTotalRevenue()).toBe(0);
      expect(summary.getNetBudget()).toBe(0);
    });
  });

  describe('getContributorPaymentStatus', () => {
    test('should return payment status for contributor', async () => {
      const contributorId = 'member456';
      const expectedAmount = 70;

      const mockContributions = [
        {
          id: 'contrib1',
          contributorId: contributorId,
          amount: 50,
          expectedAmount: expectedAmount,
          date: new Date('2024-01-15')
        },
        {
          id: 'contrib2',
          contributorId: contributorId,
          amount: 20,
          expectedAmount: expectedAmount,
          date: new Date('2024-01-20')
        }
      ];

      mockBudgetRepository.getContributionsByContributor.mockResolvedValue(mockContributions);

      const status = await budgetService.getContributorPaymentStatus(contributorId, expectedAmount);

      expect(status.totalPaid).toBe(70);
      expect(status.expectedAmount).toBe(70);
      expect(status.remainingAmount).toBe(0);
      expect(status.isComplete).toBe(true);
      expect(status.isOverpaid).toBe(false);
      expect(status.payments).toHaveLength(2);
    });

    test('should handle partial payments', async () => {
      const contributorId = 'member456';
      const expectedAmount = 70;

      const mockContributions = [
        {
          id: 'contrib1',
          contributorId: contributorId,
          amount: 40,
          expectedAmount: expectedAmount,
          date: new Date('2024-01-15')
        }
      ];

      mockBudgetRepository.getContributionsByContributor.mockResolvedValue(mockContributions);

      const status = await budgetService.getContributorPaymentStatus(contributorId, expectedAmount);

      expect(status.totalPaid).toBe(40);
      expect(status.remainingAmount).toBe(30);
      expect(status.isComplete).toBe(false);
      expect(status.isOverpaid).toBe(false);
    });

    test('should handle overpayments', async () => {
      const contributorId = 'member456';
      const expectedAmount = 70;

      const mockContributions = [
        {
          id: 'contrib1',
          contributorId: contributorId,
          amount: 100,
          expectedAmount: expectedAmount,
          date: new Date('2024-01-15')
        }
      ];

      mockBudgetRepository.getContributionsByContributor.mockResolvedValue(mockContributions);

      const status = await budgetService.getContributorPaymentStatus(contributorId, expectedAmount);

      expect(status.totalPaid).toBe(100);
      expect(status.remainingAmount).toBe(0);
      expect(status.overpaidAmount).toBe(30);
      expect(status.isComplete).toBe(true);
      expect(status.isOverpaid).toBe(true);
    });
  });

  describe('getRevenueBreakdown', () => {
    test('should return revenue breakdown by type', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEntries = [
        {
          budgetType: BUDGET_TYPES.FEE_REVENUE,
          amount: 100
        },
        {
          budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
          amount: 400
        }
      ];

      mockBudgetRepository.getBudgetEntriesByDateRange.mockResolvedValue(mockEntries);

      const breakdown = await budgetService.getRevenueBreakdown(startDate, endDate);

      expect(breakdown.feeRevenue).toBe(100);
      expect(breakdown.contributionRevenue).toBe(400);
      expect(breakdown.totalRevenue).toBe(500);
      expect(breakdown.feePercentage).toBe(20);
      expect(breakdown.contributionPercentage).toBe(80);
    });
  });

  describe('validateBudgetEntry', () => {
    test('should validate required fields', () => {
      const invalidEntry = {
        amount: 0, // Invalid
        description: '',  // Invalid
        adminId: 'admin123'
      };

      expect(() => budgetService.validateBudgetEntry(invalidEntry)).toThrow('Amount must be a positive number');

      invalidEntry.amount = 100;
      expect(() => budgetService.validateBudgetEntry(invalidEntry)).toThrow('Description is required');
    });

    test('should pass validation for valid entry', () => {
      const validEntry = {
        amount: 100,
        date: new Date(),
        description: 'Valid description',
        adminId: 'admin123'
      };

      expect(() => budgetService.validateBudgetEntry(validEntry)).not.toThrow();
    });
  });
});