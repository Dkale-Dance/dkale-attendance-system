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
        danceRole: "Lead", // Default to Lead role
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
      
      // Ensure balance is never negative
      const frozenBalance = Math.max(0, balanceInfo.calculatedBalance);

      // Update student status and store frozen fee information
      return this.studentRepository.updateStudent(studentId, { 
        enrollmentStatus: newStatus,
        frozenFeesTotal: balanceInfo.totalFeesCharged,
        frozenBalance: frozenBalance,
        frozenAt: new Date().toISOString()
      });
    }

    // Standard update for all other statuses
    return this.studentRepository.updateStudent(studentId, { enrollmentStatus: newStatus });
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
    // Allow negative balances to represent student credits (e.g., holiday credits)
    const newBalance = currentBalance - amount;
    
    return this.studentRepository.updateStudent(studentId, { balance: newBalance });
  }

  async addHolidayCredit(studentId, creditData) {
    const student = await this.studentRepository.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const existingCredits = student.holidayCredits || [];
    const newCredit = {
      id: Date.now().toString(),
      ...creditData,
      createdAt: new Date().toISOString(),
      used: false,
      usedAmount: 0
    };

    const updatedCredits = [...existingCredits, newCredit];
    return this.studentRepository.updateStudent(studentId, { holidayCredits: updatedCredits });
  }

  async getHolidayCredits(studentId) {
    const student = await this.studentRepository.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    return student.holidayCredits || [];
  }

  async getAllHolidayCredits() {
    try {
      const students = await this.getAllStudents();
      const studentsWithCredits = students
        .filter(student => student.holidayCredits && student.holidayCredits.length > 0)
        .map(student => ({
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          holidayCredits: student.holidayCredits,
          totalAvailableCredit: student.holidayCredits
            .filter(credit => !credit.used)
            .reduce((sum, credit) => sum + credit.amount, 0)
        }));

      return studentsWithCredits;
    } catch (error) {
      console.error("Error getting all holiday credits:", error);
      throw new Error(`Failed to get holiday credits: ${error.message}`);
    }
  }

  async markHolidayCreditsAsUsed(studentId, amountToUse) {
    const student = await this.studentRepository.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const holidayCredits = student.holidayCredits || [];
    let remainingToUse = amountToUse;
    
    const updatedCredits = holidayCredits.map(credit => {
      if (remainingToUse > 0 && !credit.used) {
        const availableAmount = credit.amount - credit.usedAmount;
        const amountToDeduct = Math.min(remainingToUse, availableAmount);
        
        remainingToUse -= amountToDeduct;
        
        return {
          ...credit,
          usedAmount: credit.usedAmount + amountToDeduct,
          used: (credit.usedAmount + amountToDeduct) >= credit.amount,
          lastUsedAt: new Date().toISOString()
        };
      }
      return credit;
    });

    if (remainingToUse > 0) {
      throw new Error(`Insufficient holiday credits. Attempted to use $${amountToUse}, but only had enough for $${amountToUse - remainingToUse}`);
    }

    return this.studentRepository.updateStudent(studentId, { holidayCredits: updatedCredits });
  }
}

// Export a default instance using the real repository
export const studentService = new StudentService(studentRepository);