import { expenseRepository } from "../repository/ExpenseRepository";

export default class ExpenseService {
  constructor(expenseRepositoryInstance = expenseRepository) {
    this.expenseRepository = expenseRepositoryInstance;
  }

  /**
   * Valid expense categories following business requirements
   */
  static get VALID_CATEGORIES() {
    return [
      "supplies",      // Dance supplies, shoes, uniforms, etc.
      "utilities",     // Electricity, water, internet, etc.
      "maintenance",   // Studio maintenance, repairs, cleaning
      "equipment",     // Sound systems, mirrors, dance equipment
      "marketing",     // Advertising, promotional materials
      "administrative", // Office supplies, software subscriptions
      "insurance",     // Liability insurance, property insurance
      "other"          // Miscellaneous expenses
    ];
  }

  /**
   * Validates expense data
   * @param {Object} expenseData - The expense data to validate
   * @throws {Error} If expense data is invalid
   */
  validateExpense(expenseData) {
    if (!expenseData.amount || expenseData.amount <= 0) {
      throw new Error("Expense amount must be greater than zero");
    }

    if (!ExpenseService.VALID_CATEGORIES.includes(expenseData.category)) {
      throw new Error(`Invalid expense category. Must be one of: ${ExpenseService.VALID_CATEGORIES.join(", ")}`);
    }

    if (!expenseData.description || expenseData.description.trim() === "") {
      throw new Error("Expense description is required");
    }

    if (expenseData.date) {
      const expenseDate = new Date(expenseData.date);
      if (isNaN(expenseDate.getTime())) {
        throw new Error("Invalid expense date");
      }
    } else {
      throw new Error("Expense date is required");
    }

    if (!expenseData.adminId || expenseData.adminId.trim() === "") {
      throw new Error("Admin ID is required");
    }
  }

  /**
   * Creates a new expense record
   * @param {Object} expenseData - Expense data with category, description, amount, date, adminId, notes
   * @returns {Promise<Object>} Created expense record
   */
  async createExpense(expenseData) {
    try {
      this.validateExpense(expenseData);
      return await this.expenseRepository.createExpense(expenseData);
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  /**
   * Gets expense by ID
   * @param {string} expenseId - The expense ID
   * @returns {Promise<Object|null>} Expense data or null if not found
   */
  async getExpenseById(expenseId) {
    try {
      return await this.expenseRepository.getExpenseById(expenseId);
    } catch (error) {
      console.error("Error fetching expense:", error);
      throw error;
    }
  }

  /**
   * Gets all expenses
   * @returns {Promise<Array>} Array of all expense records
   */
  async getAllExpenses() {
    try {
      return await this.expenseRepository.getAllExpenses();
    } catch (error) {
      console.error("Error fetching all expenses:", error);
      throw error;
    }
  }

  /**
   * Gets expenses within a specific date range
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>} Array of expense records within the date range
   */
  async getExpensesByDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid date range");
      }
      
      return await this.expenseRepository.getExpensesByDateRange(start, end);
    } catch (error) {
      console.error("Error fetching expenses by date range:", error);
      throw error;
    }
  }

  /**
   * Gets expenses by category
   * @param {string} category - The expense category
   * @returns {Promise<Array>} Array of expense records for the category
   */
  async getExpensesByCategory(category) {
    try {
      if (!ExpenseService.VALID_CATEGORIES.includes(category)) {
        throw new Error(`Invalid expense category. Must be one of: ${ExpenseService.VALID_CATEGORIES.join(", ")}`);
      }
      
      return await this.expenseRepository.getExpensesByCategory(category);
    } catch (error) {
      console.error("Error fetching expenses by category:", error);
      throw error;
    }
  }

  /**
   * Deletes an expense record
   * @param {string} expenseId - The expense ID to delete
   * @returns {Promise<Object>} Result containing success status and deleted expense
   */
  async deleteExpense(expenseId) {
    try {
      const expense = await this.expenseRepository.getExpenseById(expenseId);
      
      if (!expense) {
        throw new Error("Expense not found");
      }
      
      await this.expenseRepository.deleteExpense(expenseId);
      
      return { 
        success: true, 
        deletedExpense: expense
      };
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  /**
   * Gets expense summary grouped by category
   * @returns {Promise<Object>} Object with categories as keys and total amounts as values
   */
  async getExpenseSummaryByCategory() {
    try {
      const expenses = await this.expenseRepository.getAllExpenses();
      
      return expenses.reduce((summary, expense) => {
        const category = expense.category;
        summary[category] = (summary[category] || 0) + expense.amount;
        return summary;
      }, {});
    } catch (error) {
      console.error("Error getting expense summary by category:", error);
      throw error;
    }
  }

  /**
   * Gets total amount of all expenses
   * @returns {Promise<number>} Total expense amount
   */
  async getTotalExpenses() {
    try {
      const expenses = await this.expenseRepository.getAllExpenses();
      
      return expenses.reduce((total, expense) => total + expense.amount, 0);
    } catch (error) {
      console.error("Error getting total expenses:", error);
      throw error;
    }
  }

  /**
   * Gets expense summary for a specific date range
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Object>} Summary object with totals and category breakdown
   */
  async getExpenseSummaryByDateRange(startDate, endDate) {
    try {
      const expenses = await this.getExpensesByDateRange(startDate, endDate);
      
      const totalAmount = expenses.reduce((total, expense) => total + expense.amount, 0);
      
      const categoryBreakdown = expenses.reduce((summary, expense) => {
        const category = expense.category;
        summary[category] = (summary[category] || 0) + expense.amount;
        return summary;
      }, {});
      
      return {
        totalAmount,
        categoryBreakdown,
        expenseCount: expenses.length,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      console.error("Error getting expense summary by date range:", error);
      throw error;
    }
  }
}

export const expenseService = new ExpenseService();