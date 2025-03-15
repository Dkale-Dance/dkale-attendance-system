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

    // Additional validations can be added here
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
   * Gets all payments
   * @returns {Promise<Array>} Array of all payment records
   */
  async getAllPayments() {
    try {
      return this.paymentRepository.getAllPayments();
    } catch (error) {
      console.error("Error fetching all payments:", error);
      throw error;
    }
  }

  /**
   * Gets payments within a specific date range
   * @param {Date} startDate - Start date for the range
   * @param {Date} endDate - End date for the range
   * @returns {Promise<Array>} Array of payment records within the date range
   */
  async getPaymentsByDateRange(startDate, endDate) {
    try {
      return this.paymentRepository.getPaymentsByDateRange(startDate, endDate);
    } catch (error) {
      console.error("Error fetching payments by date range:", error);
      throw error;
    }
  }
}

// Export a default instance using the real repositories
export const paymentService = new PaymentService(paymentRepository, studentRepository);