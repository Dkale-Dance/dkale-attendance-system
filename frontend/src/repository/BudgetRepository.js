import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import app from "../lib/firebase/config/config";
import { DateConverterUtils } from "../utils/DateConverterUtils";
import { 
  FeeRevenueEntry, 
  ContributionRevenueEntry, 
  ExpenseEntry,
  BUDGET_TYPES,
  BUDGET_STATUS 
} from "../models/BudgetModels";

/**
 * Budget Repository following Single Responsibility Principle
 * Handles all budget-related data persistence operations
 */
export class BudgetRepository {
  constructor() {
    try {
      this.db = getFirestore(app);
      if (!this.db && process.env.NODE_ENV !== 'test') {
        throw new Error("Failed to initialize Firestore database");
      }
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      if (process.env.NODE_ENV !== 'test') {
        throw new Error(`Firestore initialization failed: ${error.message}`);
      }
      this.db = null; // Use null instead of empty object for test environment
    }
    this.collectionName = "budget_entries";
  }

  /**
   * Retry utility for Firestore operations
   * @param {Function} operation - The operation to retry
   * @param {number} maxRetries - Maximum number of retries (default: 3)
   * @param {number} delay - Delay between retries in ms (default: 1000)
   * @returns {Promise} Operation result
   */
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry for certain error types
        if (error.code === 'permission-denied' || 
            error.code === 'invalid-argument' ||
            error.code === 'not-found') {
          throw error;
        }
        
        if (attempt === maxRetries) {
          console.error(`Operation failed after ${maxRetries} attempts:`, error);
          throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        const currentDelay = delay;
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        delay *= 1.5; // Exponential backoff
      }
    }
    
    throw lastError;
  }

  /**
   * Creates a new fee revenue entry (late fees, absent fees, etc.)
   * @param {Object} feeData - Fee revenue data
   * @returns {Promise<Object>} Created fee revenue entry with ID
   */
  async createFeeRevenue(feeData) {
    try {
      const entryId = uuidv4();
      const entryRef = doc(this.db, this.collectionName, entryId);
      
      // Create FeeRevenueEntry instance for validation
      const feeEntry = new FeeRevenueEntry(
        entryId,
        feeData.amount,
        feeData.date,
        feeData.description,
        feeData.adminId,
        feeData.feeType,
        feeData.studentId,
        feeData.status || BUDGET_STATUS.ACTIVE
      );
      
      // Validate before saving
      feeEntry.validate();

      const budgetEntry = {
        id: entryId,
        budgetType: BUDGET_TYPES.FEE_REVENUE,
        amount: feeData.amount,
        date: DateConverterUtils.convertToTimestamp(feeData.date),
        description: feeData.description,
        adminId: feeData.adminId,
        feeType: feeData.feeType,
        studentId: feeData.studentId,
        status: feeData.status || BUDGET_STATUS.ACTIVE,
        createdAt: DateConverterUtils.convertToTimestamp(new Date()),
        updatedAt: DateConverterUtils.convertToTimestamp(new Date())
      };
      
      await this.retryOperation(() => setDoc(entryRef, budgetEntry));
      
      return {
        ...budgetEntry,
        date: DateConverterUtils.convertToDate(budgetEntry.date),
        createdAt: DateConverterUtils.convertToDate(budgetEntry.createdAt),
        updatedAt: DateConverterUtils.convertToDate(budgetEntry.updatedAt)
      };
    } catch (error) {
      console.error("Error creating fee revenue:", error);
      throw new Error(`Failed to create fee revenue: ${error.message}`);
    }
  }

  /**
   * Creates a new contribution revenue entry ($70 payments, etc.)
   * @param {Object} contributionData - Contribution revenue data
   * @returns {Promise<Object>} Created contribution revenue entry with ID
   */
  async createContributionRevenue(contributionData) {
    try {
      const entryId = uuidv4();
      const entryRef = doc(this.db, this.collectionName, entryId);
      
      // Create ContributionRevenueEntry instance for validation
      const contributionEntry = new ContributionRevenueEntry(
        entryId,
        contributionData.amount,
        contributionData.date,
        contributionData.description,
        contributionData.adminId,
        contributionData.contributorId,
        contributionData.contributorName,
        contributionData.expectedAmount || 70,
        contributionData.status || BUDGET_STATUS.ACTIVE
      );
      
      // Validate before saving
      contributionEntry.validate();

      const budgetEntry = {
        id: entryId,
        budgetType: BUDGET_TYPES.CONTRIBUTION_REVENUE,
        amount: contributionData.amount,
        date: DateConverterUtils.convertToTimestamp(contributionData.date),
        description: contributionData.description,
        adminId: contributionData.adminId,
        contributorId: contributionData.contributorId,
        contributorName: contributionData.contributorName,
        expectedAmount: contributionData.expectedAmount || 70,
        status: contributionData.status || BUDGET_STATUS.ACTIVE,
        createdAt: DateConverterUtils.convertToTimestamp(new Date()),
        updatedAt: DateConverterUtils.convertToTimestamp(new Date())
      };
      
      await setDoc(entryRef, budgetEntry);
      
      return {
        ...budgetEntry,
        date: DateConverterUtils.convertToDate(budgetEntry.date),
        createdAt: DateConverterUtils.convertToDate(budgetEntry.createdAt),
        updatedAt: DateConverterUtils.convertToDate(budgetEntry.updatedAt)
      };
    } catch (error) {
      console.error("Error creating contribution revenue:", error);
      throw new Error(`Failed to create contribution revenue: ${error.message}`);
    }
  }

  /**
   * Creates a new expense entry (migrated from existing expense system)
   * @param {Object} expenseData - Expense data
   * @returns {Promise<Object>} Created expense entry with ID
   */
  async createExpense(expenseData) {
    try {
      const entryId = uuidv4();
      const entryRef = doc(this.db, this.collectionName, entryId);
      
      // Create ExpenseEntry instance for validation
      const expenseEntry = new ExpenseEntry(
        entryId,
        expenseData.amount,
        expenseData.date,
        expenseData.description,
        expenseData.adminId,
        expenseData.category,
        expenseData.notes,
        expenseData.status || BUDGET_STATUS.ACTIVE
      );
      
      // Validate before saving
      expenseEntry.validate();

      const budgetEntry = {
        id: entryId,
        budgetType: BUDGET_TYPES.EXPENSE,
        amount: expenseData.amount,
        date: DateConverterUtils.convertToTimestamp(expenseData.date),
        description: expenseData.description,
        adminId: expenseData.adminId,
        category: expenseData.category,
        notes: expenseData.notes || '',
        status: expenseData.status || BUDGET_STATUS.ACTIVE,
        createdAt: DateConverterUtils.convertToTimestamp(new Date()),
        updatedAt: DateConverterUtils.convertToTimestamp(new Date())
      };
      
      await setDoc(entryRef, budgetEntry);
      
      return {
        ...budgetEntry,
        date: DateConverterUtils.convertToDate(budgetEntry.date),
        createdAt: DateConverterUtils.convertToDate(budgetEntry.createdAt),
        updatedAt: DateConverterUtils.convertToDate(budgetEntry.updatedAt)
      };
    } catch (error) {
      console.error("Error creating expense:", error);
      throw new Error(`Failed to create expense: ${error.message}`);
    }
  }

  /**
   * Retrieves a budget entry by ID
   * @param {string} entryId - The budget entry ID
   * @returns {Promise<Object|null>} Budget entry data or null if not found
   */
  async getBudgetEntryById(entryId) {
    try {
      const entryRef = doc(this.db, this.collectionName, entryId);
      const docSnap = await getDoc(entryRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          date: DateConverterUtils.convertToDate(data.date),
          createdAt: DateConverterUtils.convertToDate(data.createdAt),
          updatedAt: DateConverterUtils.convertToDate(data.updatedAt)
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching budget entry:", error);
      throw new Error(`Failed to fetch budget entry: ${error.message}`);
    }
  }

  /**
   * Retrieves all budget entries
   * @returns {Promise<Array>} Array of all budget entries
   */
  async getAllBudgetEntries() {
    try {
      const entriesRef = collection(this.db, this.collectionName);
      const q = query(
        entriesRef,
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: DateConverterUtils.convertToDate(data.date),
          createdAt: DateConverterUtils.convertToDate(data.createdAt),
          updatedAt: DateConverterUtils.convertToDate(data.updatedAt)
        };
      });
    } catch (error) {
      console.error("Error fetching all budget entries:", error);
      throw new Error(`Failed to fetch all budget entries: ${error.message}`);
    }
  }

  /**
   * Retrieves budget entries by type (fee_revenue, contribution_revenue, expense)
   * @param {string} budgetType - The budget type to filter by
   * @returns {Promise<Array>} Array of budget entries of the specified type
   */
  async getBudgetEntriesByType(budgetType) {
    try {
      const entriesRef = collection(this.db, this.collectionName);
      const q = query(
        entriesRef,
        where("budgetType", "==", budgetType),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: DateConverterUtils.convertToDate(data.date),
          createdAt: DateConverterUtils.convertToDate(data.createdAt),
          updatedAt: DateConverterUtils.convertToDate(data.updatedAt)
        };
      });
    } catch (error) {
      console.error("Error fetching budget entries by type:", error);
      throw new Error(`Failed to fetch budget entries by type: ${error.message}`);
    }
  }

  /**
   * Retrieves budget entries within a specific date range
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>} Array of budget entries within the date range
   */
  async getBudgetEntriesByDateRange(startDate, endDate) {
    try {
      const entriesRef = collection(this.db, this.collectionName);
      const q = query(
        entriesRef,
        where("date", ">=", DateConverterUtils.convertToTimestamp(startDate)),
        where("date", "<=", DateConverterUtils.convertToTimestamp(endDate)),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: DateConverterUtils.convertToDate(data.date),
          createdAt: DateConverterUtils.convertToDate(data.createdAt),
          updatedAt: DateConverterUtils.convertToDate(data.updatedAt)
        };
      });
    } catch (error) {
      console.error("Error fetching budget entries by date range:", error);
      throw new Error(`Failed to fetch budget entries by date range: ${error.message}`);
    }
  }

  /**
   * Retrieves contributions by specific contributor
   * @param {string} contributorId - The contributor ID
   * @returns {Promise<Array>} Array of contribution entries for the contributor
   */
  async getContributionsByContributor(contributorId) {
    try {
      const entriesRef = collection(this.db, this.collectionName);
      const q = query(
        entriesRef,
        where("budgetType", "==", BUDGET_TYPES.CONTRIBUTION_REVENUE),
        where("contributorId", "==", contributorId),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: DateConverterUtils.convertToDate(data.date),
          createdAt: DateConverterUtils.convertToDate(data.createdAt),
          updatedAt: DateConverterUtils.convertToDate(data.updatedAt)
        };
      });
    } catch (error) {
      console.error("Error fetching contributions by contributor:", error);
      throw new Error(`Failed to fetch contributions by contributor: ${error.message}`);
    }
  }

  /**
   * Updates an existing budget entry
   * @param {string} entryId - The budget entry ID to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateBudgetEntry(entryId, updateData) {
    try {
      const entryRef = doc(this.db, this.collectionName, entryId);
      
      const updatedEntry = {
        ...updateData,
        updatedAt: DateConverterUtils.convertToTimestamp(new Date())
      };
      
      // Convert date if provided
      if (updateData.date) {
        updatedEntry.date = DateConverterUtils.convertToTimestamp(updateData.date);
      }
      
      await setDoc(entryRef, updatedEntry, { merge: true });
    } catch (error) {
      console.error("Error updating budget entry:", error);
      throw new Error(`Failed to update budget entry: ${error.message}`);
    }
  }

  /**
   * Deletes a budget entry from the database
   * @param {string} entryId - The budget entry ID to delete
   * @returns {Promise<void>}
   */
  async deleteBudgetEntry(entryId) {
    try {
      const entryRef = doc(this.db, this.collectionName, entryId);
      await deleteDoc(entryRef);
    } catch (error) {
      console.error("Error deleting budget entry:", error);
      throw new Error(`Failed to delete budget entry: ${error.message}`);
    }
  }
}

export const budgetRepository = new BudgetRepository();