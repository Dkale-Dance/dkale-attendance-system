import { getFirestore, doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import app from "../lib/firebase/config/config";

export class PaymentRepository {
  constructor() {
    try {
      this.db = getFirestore(app);
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      // For tests, provide a mock db
      this.db = {};
    }
    this.collectionName = "payments";
  }

  /**
   * Creates a new payment record
   * @param {Object} paymentData - Payment data with studentId, amount, date, paymentMethod, notes, adminId
   * @returns {Promise<Object>} Created payment record with ID
   */
  async createPayment(paymentData) {
    try {
      // Generate a unique ID for the payment
      const paymentId = uuidv4();
      const paymentRef = doc(this.db, this.collectionName, paymentId);
      
      // Ensure date is properly stored (using Firestore Timestamp)
      const payment = {
        ...paymentData,
        date: paymentData.date instanceof Date 
          ? Timestamp.fromDate(paymentData.date) 
          : Timestamp.fromDate(new Date(paymentData.date)),
        createdAt: Timestamp.fromDate(new Date())
      };
      
      // Save the payment record
      await setDoc(paymentRef, payment);
      
      // Return the created payment with ID
      return {
        id: paymentId,
        ...payment
      };
    } catch (error) {
      console.error("Error creating payment:", error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Retrieves a payment by ID
   * @param {string} paymentId - The payment ID
   * @returns {Promise<Object|null>} Payment data or null if not found
   */
  async getPaymentById(paymentId) {
    try {
      const paymentRef = doc(this.db, this.collectionName, paymentId);
      const docSnap = await getDoc(paymentRef);
      
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching payment:", error);
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  /**
   * Retrieves all payments for a specific student
   * @param {string} studentId - The student's ID
   * @returns {Promise<Array>} Array of payment records
   */
  async getPaymentsByStudentId(studentId) {
    try {
      const paymentsRef = collection(this.db, this.collectionName);
      const q = query(
        paymentsRef,
        where("studentId", "==", studentId),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure date is a proper Date object
        let date = data.date;
        if (date && typeof date.toDate === 'function') {
          // Handle Firestore timestamp
          date = date.toDate();
        } else if (date) {
          // Handle string or other formats
          date = new Date(date);
        }
        
        return {
          ...data,
          id: doc.id,
          date: date
        };
      });
    } catch (error) {
      console.error("Error fetching student payments:", error);
      throw new Error(`Failed to fetch student payments: ${error.message}`);
    }
  }

  /**
   * Retrieves all payments
   * @returns {Promise<Array>} Array of all payment records
   */
  async getAllPayments() {
    try {
      const paymentsRef = collection(this.db, this.collectionName);
      const q = query(
        paymentsRef,
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure date is a proper Date object
        let date = data.date;
        if (date && typeof date.toDate === 'function') {
          // Handle Firestore timestamp
          date = date.toDate();
        } else if (date) {
          // Handle string or other formats
          date = new Date(date);
        }
        
        return {
          ...data,
          id: doc.id,
          date: date
        };
      });
    } catch (error) {
      console.error("Error fetching all payments:", error);
      throw new Error(`Failed to fetch all payments: ${error.message}`);
    }
  }

  /**
   * Retrieves payments within a specific date range
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>} Array of payment records within the date range
   */
  async getPaymentsByDateRange(startDate, endDate) {
    try {
      const paymentsRef = collection(this.db, this.collectionName);
      const q = query(
        paymentsRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure date is a proper Date object
        let date = data.date;
        if (date && typeof date.toDate === 'function') {
          // Handle Firestore timestamp
          date = date.toDate();
        } else if (date) {
          // Handle string or other formats
          date = new Date(date);
        }
        
        return {
          ...data,
          id: doc.id,
          date: date
        };
      });
    } catch (error) {
      console.error("Error fetching payments by date range:", error);
      throw new Error(`Failed to fetch payments by date range: ${error.message}`);
    }
  }
}

// Export a default instance
export const paymentRepository = new PaymentRepository();