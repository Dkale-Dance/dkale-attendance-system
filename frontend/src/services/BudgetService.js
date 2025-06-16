import { 
  FeeRevenueEntry, 
  ContributionRevenueEntry, 
  ExpenseEntry,
  BudgetSummary,
  BUDGET_TYPES,
  BUDGET_STATUS 
} from "../models/BudgetModels";
import { budgetRepository } from "../repository/BudgetRepository";

/**
 * Budget Service following Single Responsibility Principle
 * Handles business logic for budget operations
 */
export class BudgetService {
  constructor(repository = budgetRepository) {
    this.budgetRepository = repository;
  }

  /**
   * Creates a new fee revenue entry with validation
   * @param {Object} feeData - Fee revenue data
   * @returns {Promise<Object>} Created fee revenue entry
   */
  async createFeeRevenue(feeData) {
    try {
      // Validate the data using domain model
      const tempEntry = new FeeRevenueEntry(
        'temp',
        feeData.amount,
        feeData.date,
        feeData.description,
        feeData.adminId,
        feeData.feeType,
        feeData.studentId,
        feeData.status
      );
      tempEntry.validate();

      return await this.budgetRepository.createFeeRevenue(feeData);
    } catch (error) {
      console.error("Error creating fee revenue:", error);
      throw error;
    }
  }

  /**
   * Creates a new contribution revenue entry with validation
   * @param {Object} contributionData - Contribution revenue data
   * @returns {Promise<Object>} Created contribution revenue entry
   */
  async createContributionRevenue(contributionData) {
    try {
      // Validate the data using domain model
      const tempEntry = new ContributionRevenueEntry(
        'temp',
        contributionData.amount,
        contributionData.date,
        contributionData.description,
        contributionData.adminId,
        contributionData.contributorId,
        contributionData.contributorName,
        contributionData.expectedAmount || 70,
        contributionData.status
      );
      tempEntry.validate();

      // Determine status based on payment completeness
      if (!contributionData.status) {
        if (contributionData.amount >= (contributionData.expectedAmount || 70)) {
          contributionData.status = BUDGET_STATUS.COMPLETED;
        } else {
          contributionData.status = BUDGET_STATUS.PENDING;
        }
      }

      return await this.budgetRepository.createContributionRevenue(contributionData);
    } catch (error) {
      console.error("Error creating contribution revenue:", error);
      throw error;
    }
  }

  /**
   * Creates a new expense entry with validation
   * @param {Object} expenseData - Expense data
   * @returns {Promise<Object>} Created expense entry
   */
  async createExpense(expenseData) {
    try {
      // Validate the data using domain model
      const tempEntry = new ExpenseEntry(
        'temp',
        expenseData.amount,
        expenseData.date,
        expenseData.description,
        expenseData.adminId,
        expenseData.category,
        expenseData.notes,
        expenseData.status
      );
      tempEntry.validate();

      return await this.budgetRepository.createExpense(expenseData);
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  /**
   * Retrieves all budget entries
   * @returns {Promise<Array>} Array of all budget entries
   */
  async getAllBudgetEntries() {
    try {
      return await this.budgetRepository.getAllBudgetEntries();
    } catch (error) {
      console.error("Error fetching all budget entries:", error);
      throw error;
    }
  }

  /**
   * Retrieves budget entries by type
   * @param {string} budgetType - Budget type to filter by
   * @returns {Promise<Array>} Array of budget entries
   */
  async getBudgetEntriesByType(budgetType) {
    try {
      if (!Object.values(BUDGET_TYPES).includes(budgetType)) {
        throw new Error(`Invalid budget type: ${budgetType}`);
      }
      
      return await this.budgetRepository.getBudgetEntriesByType(budgetType);
    } catch (error) {
      console.error("Error fetching budget entries by type:", error);
      throw error;
    }
  }

  /**
   * Retrieves budget entries within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of budget entries
   */
  async getBudgetEntriesByDateRange(startDate, endDate) {
    try {
      if (!startDate || !endDate) {
        throw new Error("Start date and end date are required");
      }
      
      if (startDate > endDate) {
        throw new Error("Start date must be before end date");
      }
      
      return await this.budgetRepository.getBudgetEntriesByDateRange(startDate, endDate);
    } catch (error) {
      console.error("Error fetching budget entries by date range:", error);
      throw error;
    }
  }

  /**
   * Calculates budget summary for a given period
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<BudgetSummary>} Budget summary
   */
  async calculateBudgetSummary(startDate, endDate) {
    try {
      const entries = await this.getBudgetEntriesByDateRange(startDate, endDate);
      
      let feeRevenue = 0;
      let contributionRevenue = 0;
      let totalExpenses = 0;

      entries.forEach(entry => {
        switch (entry.budgetType) {
          case BUDGET_TYPES.FEE_REVENUE:
            feeRevenue += entry.amount;
            break;
          case BUDGET_TYPES.CONTRIBUTION_REVENUE:
            contributionRevenue += entry.amount;
            break;
          case BUDGET_TYPES.EXPENSE:
            totalExpenses += entry.amount;
            break;
          default:
            // Unknown budget type - skip this entry
            console.warn(`Unknown budget type: ${entry.budgetType}`);
            break;
        }
      });

      return new BudgetSummary(
        feeRevenue,
        contributionRevenue,
        totalExpenses,
        { startDate, endDate }
      );
    } catch (error) {
      console.error("Error calculating budget summary:", error);
      throw error;
    }
  }

  /**
   * Gets payment status for a specific contributor
   * @param {string} contributorId - Contributor ID
   * @param {number} expectedAmount - Expected contribution amount (default 70)
   * @returns {Promise<Object>} Payment status details
   */
  async getContributorPaymentStatus(contributorId, expectedAmount = 70) {
    try {
      if (!contributorId) {
        throw new Error("Contributor ID is required");
      }

      const contributions = await this.budgetRepository.getContributionsByContributor(contributorId);
      
      const totalPaid = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
      const remainingAmount = Math.max(0, expectedAmount - totalPaid);
      const overpaidAmount = Math.max(0, totalPaid - expectedAmount);
      const isComplete = totalPaid >= expectedAmount;
      const isOverpaid = totalPaid > expectedAmount;

      return {
        contributorId,
        totalPaid,
        expectedAmount,
        remainingAmount,
        overpaidAmount,
        isComplete,
        isOverpaid,
        payments: contributions,
        paymentHistory: contributions.map(c => ({
          id: c.id,
          amount: c.amount,
          date: c.date,
          description: c.description,
          status: c.status
        }))
      };
    } catch (error) {
      console.error("Error getting contributor payment status:", error);
      throw error;
    }
  }

  /**
   * Gets revenue breakdown by type for a given period
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Revenue breakdown
   */
  async getRevenueBreakdown(startDate, endDate) {
    try {
      const entries = await this.getBudgetEntriesByDateRange(startDate, endDate);
      
      let feeRevenue = 0;
      let contributionRevenue = 0;

      entries.forEach(entry => {
        if (entry.budgetType === BUDGET_TYPES.FEE_REVENUE) {
          feeRevenue += entry.amount;
        } else if (entry.budgetType === BUDGET_TYPES.CONTRIBUTION_REVENUE) {
          contributionRevenue += entry.amount;
        }
      });

      const totalRevenue = feeRevenue + contributionRevenue;
      const feePercentage = totalRevenue > 0 ? (feeRevenue / totalRevenue) * 100 : 0;
      const contributionPercentage = totalRevenue > 0 ? (contributionRevenue / totalRevenue) * 100 : 0;

      return {
        feeRevenue,
        contributionRevenue,
        totalRevenue,
        feePercentage,
        contributionPercentage,
        period: { startDate, endDate }
      };
    } catch (error) {
      console.error("Error getting revenue breakdown:", error);
      throw error;
    }
  }

  /**
   * Gets all contributors with their payment status
   * @param {number} expectedAmount - Expected contribution amount (default 70)
   * @returns {Promise<Array>} Array of contributor payment statuses
   */
  async getAllContributorStatuses(expectedAmount = 70) {
    try {
      const allContributions = await this.budgetRepository.getBudgetEntriesByType(BUDGET_TYPES.CONTRIBUTION_REVENUE);
      
      // Group contributions by contributor and calculate status in single pass
      const contributorMap = {};
      allContributions.forEach(contribution => {
        const contributorId = contribution.contributorId;
        if (!contributorMap[contributorId]) {
          contributorMap[contributorId] = {
            contributorId: contributorId,
            contributorName: contribution.contributorName,
            totalAmount: 0,
            contributions: [],
            latestPaymentDate: null
          };
        }
        contributorMap[contributorId].contributions.push(contribution);
        contributorMap[contributorId].totalAmount += contribution.amount;
        
        // Track latest payment date
        const paymentDate = contribution.date;
        if (!contributorMap[contributorId].latestPaymentDate || paymentDate > contributorMap[contributorId].latestPaymentDate) {
          contributorMap[contributorId].latestPaymentDate = paymentDate;
        }
      });

      // Calculate status for each contributor without additional database calls
      const statuses = Object.values(contributorMap).map(contributor => {
        const totalAmount = contributor.totalAmount;
        const difference = totalAmount - expectedAmount;
        
        let status;
        let isOverpaid = false;
        let isComplete = false;
        let isPartial = false;
        
        if (totalAmount === 0) {
          status = 'No payments made';
        } else if (totalAmount >= expectedAmount) {
          status = totalAmount === expectedAmount ? 'Payment complete' : 'Overpaid';
          isComplete = totalAmount === expectedAmount;
          isOverpaid = totalAmount > expectedAmount;
        } else {
          status = 'Partial payment';
          isPartial = true;
        }

        return {
          contributorId: contributor.contributorId,
          contributorName: contributor.contributorName,
          totalAmount: totalAmount,
          expectedAmount: expectedAmount,
          difference: difference,
          status: status,
          isOverpaid: isOverpaid,
          isComplete: isComplete,
          isPartial: isPartial,
          paymentCount: contributor.contributions.length,
          latestPaymentDate: contributor.latestPaymentDate,
          contributions: contributor.contributions
        };
      });

      return statuses;
    } catch (error) {
      console.error("Error getting all contributor statuses:", error);
      throw error;
    }
  }

  /**
   * Updates a budget entry
   * @param {string} entryId - Entry ID to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateBudgetEntry(entryId, updateData) {
    try {
      if (!entryId) {
        throw new Error("Entry ID is required");
      }

      // Validate update data if it contains validation fields
      if (updateData.amount !== undefined || updateData.description !== undefined) {
        this.validateBudgetEntry(updateData);
      }

      return await this.budgetRepository.updateBudgetEntry(entryId, updateData);
    } catch (error) {
      console.error("Error updating budget entry:", error);
      throw error;
    }
  }

  /**
   * Deletes a budget entry
   * @param {string} entryId - Entry ID to delete
   * @returns {Promise<void>}
   */
  async deleteBudgetEntry(entryId) {
    try {
      if (!entryId) {
        throw new Error("Entry ID is required");
      }

      return await this.budgetRepository.deleteBudgetEntry(entryId);
    } catch (error) {
      console.error("Error deleting budget entry:", error);
      throw error;
    }
  }

  /**
   * Validates budget entry data
   * @param {Object} entryData - Entry data to validate
   * @throws {Error} If validation fails
   */
  validateBudgetEntry(entryData) {
    if (entryData.amount !== undefined && (!entryData.amount || entryData.amount <= 0)) {
      throw new Error("Amount must be a positive number");
    }
    if (entryData.description !== undefined && (!entryData.description || entryData.description.trim().length === 0)) {
      throw new Error("Description is required");
    }
    if (entryData.date !== undefined && !entryData.date) {
      throw new Error("Date is required");
    }
    if (entryData.adminId !== undefined && !entryData.adminId) {
      throw new Error("Admin ID is required");
    }
  }

  /**
   * Gets outstanding contributions (incomplete payments)
   * @param {number} expectedAmount - Expected contribution amount (default 70)
   * @returns {Promise<Array>} Array of contributors with outstanding payments
   */
  async getOutstandingContributions(expectedAmount = 70) {
    try {
      const allStatuses = await this.getAllContributorStatuses(expectedAmount);
      
      return allStatuses.filter(status => !status.isComplete);
    } catch (error) {
      console.error("Error getting outstanding contributions:", error);
      throw error;
    }
  }

  /**
   * Gets overpaid contributions
   * @param {number} expectedAmount - Expected contribution amount (default 70)
   * @returns {Promise<Array>} Array of contributors who overpaid
   */
  async getOverpaidContributions(expectedAmount = 70) {
    try {
      const allStatuses = await this.getAllContributorStatuses(expectedAmount);
      
      return allStatuses.filter(status => status.isOverpaid);
    } catch (error) {
      console.error("Error getting overpaid contributions:", error);
      throw error;
    }
  }
}

export const budgetService = new BudgetService();