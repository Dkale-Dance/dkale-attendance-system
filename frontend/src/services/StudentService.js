// StudentService.js - FIXED version
import { studentRepository } from "../repository/StudentRepository";
import { sortStudentsByFirstName } from "../utils/sorting";

export default class StudentService {
  constructor(studentRepository) {
    this.studentRepository = studentRepository;
  }

  async getStudentById(studentId) {
    return this.studentRepository.getStudentById(studentId);
  }

  async updateStudent(studentId, updateData) {
    return this.studentRepository.updateStudent(studentId, updateData);
  }

  async initializeStudentProfile(userId, initialData = {}) {
    try {
      // Set initial student data when a user with role "student" is created
      const studentData = {
        enrollmentStatus: "Pending Payment",
        balance: 0,
        role: "student", // Always ensure role is explicitly set
        ...initialData
      };

      // Use the repository's setStudentData method instead of updateStudent
      // This ensures the document is created even if it doesn't exist
      return this.studentRepository.setStudentData(userId, studentData);
    } catch (error) {
      console.error("Error initializing student profile:", error);
      throw new Error(`Failed to initialize student profile: ${error.message}`);
    }
  }

  async changeEnrollmentStatus(studentId, newStatus) {
    // Validate status
    const validStatuses = ["Enrolled", "Inactive", "Pending Payment", "Removed"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`);
    }

    // Special handling for setting to Inactive status - freeze fees
    if (newStatus === "Inactive") {
      const student = await this.getStudentById(studentId);
      if (!student) {
        throw new Error("Student not found");
      }

      // Get accurate balance calculation
      const { reportService } = await import("./ReportService");
      const balanceInfo = await reportService.calculateStudentBalance(studentId);

      // Update student status and store frozen fee information
      return this.studentRepository.updateStudent(studentId, { 
        enrollmentStatus: newStatus,
        frozenFeesTotal: balanceInfo.totalFeesCharged,
        frozenBalance: balanceInfo.calculatedBalance,
        frozenAt: new Date().toISOString()
      });
    }

    // Standard update for all other statuses
    return this.studentRepository.updateStudent(studentId, { enrollmentStatus: newStatus });
  }
  
  /**
   * Clears the balance for a student (primarily used for inactive students)
   * @param {string} studentId - The ID of the student
   * @param {string} reason - The reason for clearing the balance
   * @returns {Promise<Object>} Updated student data
   */
  async clearStudentBalance(studentId, reason) {
    const student = await this.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }
    
    // Create an audit record of the balance clearing
    const balanceBeforeClearing = student.balance || 0;
    const clearingData = {
      balance: 0,
      balanceHistory: {
        ...(student.balanceHistory || {}),
        cleared: {
          date: new Date().toISOString(),
          previousBalance: balanceBeforeClearing,
          reason: reason || "Administrative action"
        }
      }
    };
    
    // Update the student record
    return this.studentRepository.updateStudent(studentId, clearingData);
  }

  async removeStudent(studentId) {
    return this.studentRepository.removeStudent(studentId);
  }

  async getStudentsByStatus(status) {
    const students = await this.studentRepository.getStudentsByStatus(status);
    return sortStudentsByFirstName(students);
  }

  async getAllStudents() {
    const students = await this.studentRepository.getAllStudents();
    return sortStudentsByFirstName(students);
  }
  
  /**
   * Get all students with their accurately calculated balances
   * @returns {Promise<Array>} Array of students with calculated balance information
   */
  async getAllStudentsWithBalances() {
    try {
      // Import the reportService
      const { reportService } = await import("./ReportService");
      
      // Get all students
      const students = await this.getAllStudents();
      
      // Calculate balances for each student
      const studentsWithBalances = await Promise.all(
        students.map(async (student) => {
          try {
            // Get calculated balance info for this student
            const balanceInfo = await reportService.calculateStudentBalance(student.id);
            
            // Add calculated balance to student object
            return {
              ...student,
              calculatedBalance: balanceInfo.calculatedBalance,
              totalFees: balanceInfo.totalFeesCharged,
              totalPayments: balanceInfo.totalPaymentsMade
            };
          } catch (error) {
            console.error(`Error calculating balance for student ${student.id}:`, error);
            // Return student without calculated balance
            return student;
          }
        })
      );
      
      return studentsWithBalances;
    } catch (error) {
      console.error("Error getting students with balances:", error);
      throw new Error(`Failed to get students with balances: ${error.message}`);
    }
  }

  async addBalance(studentId, amount) {
    if (amount <= 0) {
      throw new Error("Amount to add must be greater than zero");
    }

    const student = await this.studentRepository.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const currentBalance = student.balance || 0;
    const newBalance = currentBalance + amount;

    return this.studentRepository.updateStudent(studentId, { balance: newBalance });
  }

  async reduceBalance(studentId, amount) {
    if (amount <= 0) {
      throw new Error("Amount to reduce must be greater than zero");
    }

    const student = await this.studentRepository.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const currentBalance = student.balance || 0;
    if (currentBalance < amount) {
      throw new Error("Cannot reduce balance below zero");
    }

    const newBalance = currentBalance - amount;
    return this.studentRepository.updateStudent(studentId, { balance: newBalance });
  }
}

// Export a default instance using the real repository
export const studentService = new StudentService(studentRepository);