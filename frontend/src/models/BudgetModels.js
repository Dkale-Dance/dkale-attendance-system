/**
 * Budget domain models following SOLID principles
 * Each model has a single responsibility and clear interface
 */

export const BUDGET_TYPES = {
  FEE_REVENUE: 'fee_revenue',
  CONTRIBUTION_REVENUE: 'contribution_revenue', 
  EXPENSE: 'expense'
};

export const BUDGET_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

/**
 * Base Budget Entry - Abstract base for all budget items
 */
export class BaseBudgetEntry {
  constructor(id, amount, date, description, adminId, status = BUDGET_STATUS.ACTIVE) {
    if (this.constructor === BaseBudgetEntry) {
      throw new Error("BaseBudgetEntry is abstract and cannot be instantiated directly");
    }
    
    this.id = id;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.adminId = adminId;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  getBudgetType() {
    throw new Error("getBudgetType() must be implemented by subclass");
  }

  /**
   * Validate common budget entry fields
   */
  validate() {
    if (!this.amount || this.amount <= 0) {
      throw new Error("Amount must be a positive number");
    }
    if (!this.description || this.description.trim().length === 0) {
      throw new Error("Description is required");
    }
    if (!this.date) {
      throw new Error("Date is required");
    }
    if (!this.adminId) {
      throw new Error("Admin ID is required");
    }
  }

  /**
   * Update the entry's timestamp
   */
  touch() {
    this.updatedAt = new Date();
  }
}

/**
 * Fee Revenue Entry - Revenue from late fees, absent fees, etc.
 */
export class FeeRevenueEntry extends BaseBudgetEntry {
  constructor(id, amount, date, description, adminId, feeType, studentId, status) {
    super(id, amount, date, description, adminId, status);
    this.feeType = feeType; // 'late', 'absent', 'penalty', etc.
    this.studentId = studentId;
  }

  getBudgetType() {
    return BUDGET_TYPES.FEE_REVENUE;
  }

  validate() {
    super.validate();
    if (!this.feeType) {
      throw new Error("Fee type is required");
    }
    if (!this.studentId) {
      throw new Error("Student ID is required for fee revenue");
    }
  }

  /**
   * Check if this is a late fee
   */
  isLateFee() {
    return this.feeType === 'late';
  }

  /**
   * Check if this is an absent fee
   */
  isAbsentFee() {
    return this.feeType === 'absent';
  }
}

/**
 * Contribution Revenue Entry - Revenue from member contributions ($70 payments)
 */
export class ContributionRevenueEntry extends BaseBudgetEntry {
  constructor(id, amount, date, description, adminId, contributorId, contributorName, expectedAmount = 70, status) {
    super(id, amount, date, description, adminId, status);
    this.contributorId = contributorId;
    this.contributorName = contributorName;
    this.expectedAmount = expectedAmount;
  }

  getBudgetType() {
    return BUDGET_TYPES.CONTRIBUTION_REVENUE;
  }

  validate() {
    super.validate();
    if (!this.contributorId) {
      throw new Error("Contributor ID is required");
    }
    if (!this.contributorName || this.contributorName.trim().length === 0) {
      throw new Error("Contributor name is required");
    }
    if (!this.expectedAmount || this.expectedAmount <= 0) {
      throw new Error("Expected amount must be a positive number");
    }
  }

  /**
   * Check if the contribution is complete (paid in full)
   */
  isComplete() {
    return this.amount >= this.expectedAmount;
  }

  /**
   * Calculate remaining amount to be paid
   */
  getRemainingAmount() {
    return Math.max(0, this.expectedAmount - this.amount);
  }

  /**
   * Check if this is an overpayment
   */
  isOverpayment() {
    return this.amount > this.expectedAmount;
  }

  /**
   * Calculate overpayment amount
   */
  getOverpaymentAmount() {
    return Math.max(0, this.amount - this.expectedAmount);
  }
}

/**
 * Expense Entry - All outgoing expenses
 */
export class ExpenseEntry extends BaseBudgetEntry {
  constructor(id, amount, date, description, adminId, category, notes, status) {
    super(id, amount, date, description, adminId, status);
    this.category = category;
    this.notes = notes;
  }

  getBudgetType() {
    return BUDGET_TYPES.EXPENSE;
  }

  validate() {
    super.validate();
    if (!this.category) {
      throw new Error("Expense category is required");
    }
  }

  /**
   * Check if this is a major expense (over a threshold)
   */
  isMajorExpense(threshold = 500) {
    return this.amount >= threshold;
  }
}

/**
 * Budget Summary - Aggregated view of budget data
 */
export class BudgetSummary {
  constructor(feeRevenue = 0, contributionRevenue = 0, totalExpenses = 0, period = null) {
    this.feeRevenue = feeRevenue;
    this.contributionRevenue = contributionRevenue;
    this.totalExpenses = totalExpenses;
    this.period = period; // { startDate, endDate }
    this.generatedAt = new Date();
  }

  /**
   * Calculate total revenue from all sources
   */
  getTotalRevenue() {
    return this.feeRevenue + this.contributionRevenue;
  }

  /**
   * Calculate net budget (revenue - expenses)
   */
  getNetBudget() {
    return this.getTotalRevenue() - this.totalExpenses;
  }

  /**
   * Check if budget is positive
   */
  isPositive() {
    return this.getNetBudget() > 0;
  }

  /**
   * Calculate revenue breakdown percentages
   */
  getRevenueBreakdown() {
    const totalRevenue = this.getTotalRevenue();
    if (totalRevenue === 0) {
      return { feePercentage: 0, contributionPercentage: 0 };
    }

    return {
      feePercentage: (this.feeRevenue / totalRevenue) * 100,
      contributionPercentage: (this.contributionRevenue / totalRevenue) * 100
    };
  }
}