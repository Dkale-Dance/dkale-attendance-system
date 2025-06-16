import { BudgetRepository } from '../repository/BudgetRepository';
import { 
  FeeRevenueEntry, 
  ContributionRevenueEntry, 
  ExpenseEntry,
  BUDGET_TYPES,
  BUDGET_STATUS 
} from '../models/BudgetModels';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
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

// Mock DateConverterUtils
jest.mock('../utils/DateConverterUtils', () => ({
  DateConverterUtils: {
    convertToTimestamp: jest.fn((date) => date ? { toDate: () => date } : null),
    convertToDate: jest.fn((date) => date && typeof date.toDate === 'function' ? date.toDate() : new Date(date))
  }
}));

describe('BudgetRepository', () => {
  let budgetRepository;
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
    const firestore = require('firebase/firestore');
    const { DateConverterUtils } = require('../utils/DateConverterUtils');
    
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

    budgetRepository = new BudgetRepository();
    budgetRepository.db = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeeRevenue', () => {
    test('should create fee revenue entry successfully', async () => {
      const feeData = {
        amount: 25,
        date: new Date('2024-01-15'),
        description: 'Late fee for John',
        adminId: 'admin123',
        feeType: 'late',
        studentId: 'student456'
      };

      const mockEntryRef = { id: 'fee123' };
      mockDoc.mockReturnValue(mockEntryRef);
      mockSetDoc.mockResolvedValue();

      const result = await budgetRepository.createFeeRevenue(feeData);

      expect(mockDoc).toHaveBeenCalledWith({}, 'budget_entries', expect.any(String));
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockEntryRef,
        expect.objectContaining({
          budgetType: BUDGET_TYPES.FEE_REVENUE,
          amount: feeData.amount,
          description: feeData.description,
          feeType: feeData.feeType,
          studentId: feeData.studentId
        })
      );
      expect(result).toHaveProperty('id');
      expect(result.budgetType).toBe(BUDGET_TYPES.FEE_REVENUE);
    });

    test('should handle creation error for fee revenue', async () => {
      const feeData = {
        amount: 25,
        date: new Date(),
        description: 'Late fee',
        adminId: 'admin123',
        feeType: 'late',
        studentId: 'student456'
      };

      mockDoc.mockReturnValue({ id: 'fee123' });
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(budgetRepository.createFeeRevenue(feeData)).rejects.toThrow('Failed to create fee revenue: Operation failed after 3 attempts: Firestore error');
    });
  });

  describe('createContributionRevenue', () => {
    test('should create contribution revenue entry successfully', async () => {
      const contributionData = {
        amount: 70,
        date: new Date('2024-01-15'),
        description: 'Monthly contribution from John',
        adminId: 'admin123',
        contributorId: 'member456',
        contributorName: 'John Doe',
        expectedAmount: 70
      };

      const mockEntryRef = { id: 'contrib123' };
      mockDoc.mockReturnValue(mockEntryRef);
      mockSetDoc.mockResolvedValue();

      const result = await budgetRepository.createContributionRevenue(contributionData);

      expect(mockSetDoc).toHaveBeenCalledWith(
        mockEntryRef,
        expect.objectContaining({
          budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
          amount: contributionData.amount,
          contributorId: contributionData.contributorId,
          contributorName: contributionData.contributorName,
          expectedAmount: contributionData.expectedAmount
        })
      );
      expect(result.budgetType).toBe(BUDGET_TYPES.CONTRIBUTION_REVENUE);
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

      mockDoc.mockReturnValue({ id: 'contrib123' });
      mockSetDoc.mockResolvedValue();

      const result = await budgetRepository.createContributionRevenue(partialPayment);
      expect(result.amount).toBe(50);
      expect(result.expectedAmount).toBe(70);
    });
  });

  describe('getBudgetEntriesByType', () => {
    test('should return entries filtered by budget type', async () => {
      const mockEntries = [
        {
          id: 'fee1',
          data: () => ({
            budgetType: BUDGET_TYPES.FEE_REVENUE,
            amount: 25,
            feeType: 'late',
            date: { toDate: () => new Date('2024-01-15') }
          })
        },
        {
          id: 'fee2', 
          data: () => ({
            budgetType: BUDGET_TYPES.FEE_REVENUE,
            amount: 30,
            feeType: 'absent',
            date: { toDate: () => new Date('2024-01-10') }
          })
        }
      ];

      const mockQuerySnapshot = { docs: mockEntries };

      mockCollection.mockReturnValue('budgetRef');
      mockWhere.mockReturnValue('whereRef');
      mockOrderBy.mockReturnValue('orderByRef');
      mockQuery.mockReturnValue('queryRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await budgetRepository.getBudgetEntriesByType(BUDGET_TYPES.FEE_REVENUE);

      expect(mockWhere).toHaveBeenCalledWith('budgetType', '==', BUDGET_TYPES.FEE_REVENUE);
      expect(result).toHaveLength(2);
      expect(result[0].budgetType).toBe(BUDGET_TYPES.FEE_REVENUE);
    });
  });

  describe('getBudgetEntriesByDateRange', () => {
    test('should return entries within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockEntries = [
        {
          id: 'entry1',
          data: () => ({
            budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
            amount: 70,
            date: { toDate: () => new Date('2024-01-15') }
          })
        }
      ];

      const mockQuerySnapshot = { docs: mockEntries };

      mockCollection.mockReturnValue('budgetRef');
      mockWhere.mockReturnValue('whereRef');
      mockOrderBy.mockReturnValue('orderByRef');
      mockQuery.mockReturnValue('queryRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await budgetRepository.getBudgetEntriesByDateRange(startDate, endDate);

      expect(mockWhere).toHaveBeenCalledWith('date', '>=', expect.any(Object));
      expect(mockWhere).toHaveBeenCalledWith('date', '<=', expect.any(Object));
      expect(result).toHaveLength(1);
    });
  });

  describe('getContributionsByContributor', () => {
    test('should return contributions for specific contributor', async () => {
      const contributorId = 'member456';
      const mockContributions = [
        {
          id: 'contrib1',
          data: () => ({
            budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
            contributorId: contributorId,
            amount: 70,
            expectedAmount: 70,
            date: { toDate: () => new Date('2024-01-15') }
          })
        }
      ];

      const mockQuerySnapshot = { docs: mockContributions };

      mockCollection.mockReturnValue('budgetRef');
      mockWhere.mockReturnValue('whereRef');
      mockOrderBy.mockReturnValue('orderByRef');
      mockQuery.mockReturnValue('queryRef');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await budgetRepository.getContributionsByContributor(contributorId);

      expect(mockWhere).toHaveBeenCalledWith('budgetType', '==', BUDGET_TYPES.CONTRIBUTION_REVENUE);
      expect(mockWhere).toHaveBeenCalledWith('contributorId', '==', contributorId);
      expect(result).toHaveLength(1);
      expect(result[0].contributorId).toBe(contributorId);
    });
  });

  describe('updateBudgetEntry', () => {
    test('should update existing budget entry', async () => {
      const entryId = 'entry123';
      const updateData = {
        amount: 100,
        description: 'Updated description',
        status: BUDGET_STATUS.COMPLETED
      };

      const mockEntryRef = { id: entryId };
      mockDoc.mockReturnValue(mockEntryRef);
      mockSetDoc.mockResolvedValue();

      await budgetRepository.updateBudgetEntry(entryId, updateData);

      expect(mockDoc).toHaveBeenCalledWith({}, 'budget_entries', entryId);
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockEntryRef,
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Object)
        }),
        { merge: true }
      );
    });
  });

  describe('deleteBudgetEntry', () => {
    test('should delete budget entry successfully', async () => {
      const entryId = 'entry123';
      const mockEntryRef = { id: entryId };

      mockDoc.mockReturnValue(mockEntryRef);
      mockDeleteDoc.mockResolvedValue();

      await budgetRepository.deleteBudgetEntry(entryId);

      expect(mockDoc).toHaveBeenCalledWith({}, 'budget_entries', entryId);
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockEntryRef);
    });

    test('should handle delete error', async () => {
      const entryId = 'entry123';
      mockDoc.mockReturnValue({ id: entryId });
      mockDeleteDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(budgetRepository.deleteBudgetEntry(entryId)).rejects.toThrow('Failed to delete budget entry: Firestore error');
    });
  });
});