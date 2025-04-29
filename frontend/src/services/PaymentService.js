import { paymentRepository } from "../repository/PaymentRepository";
import { studentRepository } from "../repository/StudentRepository";

/**
 * Service for handling payment operations
 * Follows Single Responsibility and Dependency Inversion principles
 */
export default class PaymentService {
  constructor(paymentRepository, studentRepository) {
    this.paymentRepository = paymentRepository;
    this.studentRepository = studentRepository;
  }
  
  /**
   * Deletes a payment and updates the student's balance
   * Used by the PublicDashboard to allow admins to remove incorrect payment entries
   * and properly adjust the student's balance
   * @param {string} paymentId - The payment ID to delete
   * @returns {Promise<Object>} Result containing success status, deleted payment, and updated student
   * @throws {Error} If the payment is not found, student is not found, or deletion fails
   */
  async deletePayment(paymentId) {
    try {
      // Get the payment record first
      const payment = await this.paymentRepository.getPaymentById(paymentId);
      
      if (!payment) {
        throw new Error("Payment not found");
      }
      
      // Get the student
      const student = await this.studentRepository.getStudentById(payment.studentId);
      
      if (!student) {
        throw new Error("Student not found");
      }
      
      // Delete the payment
      await this.paymentRepository.deletePayment(paymentId);
      
      // Add the payment amount back to the student's balance
      // Only if they're not inactive - we don't modify balances for inactive students
      let updatedStudent = student;
      if (student.enrollmentStatus !== 'Inactive' && student.enrollmentStatus !== 'Removed') {
        const currentBalance = student.balance || 0;
        const newBalance = currentBalance + payment.amount;
        updatedStudent = await this.studentRepository.updateStudent(
          payment.studentId,
          { balance: newBalance }
        );
      }
      
      return { 
        success: true, 
        deletedPayment: payment,
        updatedStudent
      };
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
  }

  /**
   * Validates payment data
   * @param {Object} paymentData - The payment data to validate
   * @throws {Error} If payment data is invalid
   */
  validatePayment(paymentData) {
    // Validate amount
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    // Validate payment method
    const validMethods = ["cash", "card"];
    if (!validMethods.includes(paymentData.paymentMethod)) {
      throw new Error(`Invalid payment method. Must be one of: ${validMethods.join(", ")}`);
    }

    // Validate date
    if (paymentData.date) {
      const paymentDate = new Date(paymentData.date);
      if (isNaN(paymentDate.getTime())) {
        throw new Error("Invalid payment date");
      }
    } else {
      throw new Error("Payment date is required");
    }
  }

  /**
   * Records a payment and updates the student's balance
   * @param {Object} paymentData - Payment data with studentId, amount, date, paymentMethod, notes, adminId
   * @returns {Promise<Object>} Object containing payment and updated student
   */
  async recordPayment(paymentData) {
    try {
      // Validate payment data
      this.validatePayment(paymentData);

      // Check if student exists
      const student = await this.studentRepository.getStudentById(paymentData.studentId);
      if (!student) {
        throw new Error("Student not found");
      }

      // Create payment record
      const payment = await this.paymentRepository.createPayment(paymentData);

      // Update student balance
      const currentBalance = student.balance || 0;
      const newBalance = Math.max(0, currentBalance - paymentData.amount);
      const updatedStudent = await this.studentRepository.updateStudent(
        paymentData.studentId,
        { balance: newBalance }
      );

      // Return both the payment and updated student
      return { payment, updatedStudent };
    } catch (error) {
      console.error("Error recording payment:", error);
      throw error;
    }
  }

  /**
   * Gets all payments for a specific student
   * @param {string} studentId - The student's ID
   * @returns {Promise<Object>} Object containing student and their payments
   */
  async getPaymentsByStudent(studentId) {
    try {
      // Get student data
      const student = await this.studentRepository.getStudentById(studentId);
      if (!student) {
        throw new Error("Student not found");
      }

      // Get student's payments
      const payments = await this.paymentRepository.getPaymentsByStudentId(studentId);

      // Return both student and payments
      return { student, payments };
    } catch (error) {
      console.error("Error fetching student payments:", error);
      throw error;
    }
  }

  /**
   * Gets all payments with student names
   * @returns {Promise<Array>} Array of all payment records with student names
   */
  async getAllPayments() {
    try {
      // Get all payments
      const payments = await this.paymentRepository.getAllPayments();
      
      // Get all students to join with payments
      const students = await this.studentRepository.getAllStudents();
      
      // Create a lookup for quick access
      const studentLookup = students.reduce((lookup, student) => {
        lookup[student.id] = student;
        return lookup;
      }, {});
      
      // Add student names to payments
      return payments.map(payment => {
        const student = studentLookup[payment.studentId];
        if (student) {
          return {
            ...payment,
            studentName: `${student.firstName} ${student.lastName}`
          };
        }
        return payment;
      });
    } catch (error) {
      console.error("Error fetching all payments:", error);
      throw error;
    }
  }

  /**
   * Gets payments within a specific date range with student names
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>} Array of payment records within the date range with student names
   */
  async getPaymentsByDateRange(startDate, endDate) {
    try {
      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid date range");
      }
      
      // Get payments in range
      const payments = await this.paymentRepository.getPaymentsByDateRange(start, end);
      
      // Get all students to join with payments
      const students = await this.studentRepository.getAllStudents();
      
      // Create a lookup for quick access
      const studentLookup = students.reduce((lookup, student) => {
        lookup[student.id] = student;
        return lookup;
      }, {});
      
      // Add student names to payments
      return payments.map(payment => {
        const student = studentLookup[payment.studentId];
        if (student) {
          return {
            ...payment,
            studentName: `${student.firstName} ${student.lastName}`
          };
        }
        return payment;
      });
    } catch (error) {
      console.error("Error fetching payments by date range:", error);
      throw error;
    }
  }
}

// Export a default instance using the real repositories
export const paymentService = new PaymentService(paymentRepository, studentRepository);