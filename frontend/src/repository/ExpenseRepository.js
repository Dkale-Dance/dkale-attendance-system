import { getFirestore, doc, setDoc, getDoc, deleteDoc, Timestamp, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import app from "../lib/firebase/config/config";
import { DateConverterUtils } from "../utils/DateConverterUtils";

export class ExpenseRepository {
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
      this.db = {};
    }
    this.collectionName = "expenses";
  }

  /**
   * Creates a new expense record
   * @param {Object} expenseData - Expense data with category, description, amount, date, adminId, notes
   * @returns {Promise<Object>} Created expense record with ID
   */
  async createExpense(expenseData) {
    try {
      const expenseId = uuidv4();
      const expenseRef = doc(this.db, this.collectionName, expenseId);
      
      const expense = {
        ...expenseData,
        date: DateConverterUtils.convertToTimestamp(expenseData.date),
        createdAt: Timestamp.fromDate(new Date())
      };
      
      await setDoc(expenseRef, expense);
      
      return {
        id: expenseId,
        ...expense
      };
    } catch (error) {
      console.error("Error creating expense:", error);
      throw new Error(`Failed to create expense: ${error.message}`);
    }
  }

  /**
   * Retrieves an expense by ID
   * @param {string} expenseId - The expense ID
   * @returns {Promise<Object|null>} Expense data or null if not found
   */
  async getExpenseById(expenseId) {
    try {
      const expenseRef = doc(this.db, this.collectionName, expenseId);
      const docSnap = await getDoc(expenseRef);
      
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching expense:", error);
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }
  }

  /**
   * Retrieves all expenses
   * @returns {Promise<Array>} Array of all expense records
   */
  async getAllExpenses() {
    try {
      const expensesRef = collection(this.db, this.collectionName);
      const q = query(
        expensesRef,
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: doc.id,
          date: DateConverterUtils.convertToDate(data.date)
        };
      });
    } catch (error) {
      console.error("Error fetching all expenses:", error);
      throw new Error(`Failed to fetch all expenses: ${error.message}`);
    }
  }

  /**
   * Retrieves expenses within a specific date range
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>} Array of expense records within the date range
   */
  async getExpensesByDateRange(startDate, endDate) {
    try {
      const expensesRef = collection(this.db, this.collectionName);
      const q = query(
        expensesRef,
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
          date: DateConverterUtils.convertToDate(data.date)
        };
      });
    } catch (error) {
      console.error("Error fetching expenses by date range:", error);
      throw new Error(`Failed to fetch expenses by date range: ${error.message}`);
    }
  }

  /**
   * Retrieves expenses by category
   * @param {string} category - The expense category
   * @returns {Promise<Array>} Array of expense records for the category
   */
  async getExpensesByCategory(category) {
    try {
      const expensesRef = collection(this.db, this.collectionName);
      const q = query(
        expensesRef,
        where("category", "==", category),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: doc.id,
          date: DateConverterUtils.convertToDate(data.date)
        };
      });
    } catch (error) {
      console.error("Error fetching expenses by category:", error);
      throw new Error(`Failed to fetch expenses by category: ${error.message}`);
    }
  }

  /**
   * Updates an existing expense record
   * @param {string} expenseId - The expense ID to update
   * @param {Object} updateData - Updated expense data
   * @returns {Promise<Object>} Updated expense record
   * @throws {Error} If update fails
   */
  async updateExpense(expenseId, updateData) {
    try {
      const expenseRef = doc(this.db, this.collectionName, expenseId);
      
      // Prepare update data with proper date conversion and filter undefined fields
      const updatePayload = {
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      // Only include defined fields from updateData
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          updatePayload[key] = updateData[key];
        }
      });
      
      // Convert date if provided
      if (updatePayload.date) {
        updatePayload.date = DateConverterUtils.convertToTimestamp(updatePayload.date);
      }
      
      await setDoc(expenseRef, updatePayload, { merge: true });
      
      // Return the updated expense
      const updatedDoc = await getDoc(expenseRef);
      if (updatedDoc.exists()) {
        const data = updatedDoc.data();
        return {
          ...data,
          id: updatedDoc.id,
          date: DateConverterUtils.convertToDate(data.date)
        };
      }
      
      throw new Error('Updated expense not found');
    } catch (error) {
      console.error("Error updating expense:", error);
      throw new Error(`Failed to update expense: ${error.message}`);
    }
  }

  /**
   * Deletes an expense record from the database
   * @param {string} expenseId - The expense ID to delete
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails
   */
  async deleteExpense(expenseId) {
    try {
      const expenseRef = doc(this.db, this.collectionName, expenseId);
      await deleteDoc(expenseRef);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw new Error(`Failed to delete expense: ${error.message}`);
    }
  }
}

export const expenseRepository = new ExpenseRepository();