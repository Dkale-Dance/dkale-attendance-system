import { attendanceRepository } from "../repository/AttendanceRepository";
import { studentRepository } from "../repository/StudentRepository";
import { studentService } from "../services/StudentService";
import { sortStudentsByFirstName } from "../utils/sorting";

export default class AttendanceService {
  constructor(attendanceRepository, studentRepository, studentServiceInstance = studentService) {
    this.attendanceRepository = attendanceRepository;
    this.studentRepository = studentRepository;
    this.studentService = studentServiceInstance;
  }

  /**
   * Get raw attendance data for a specific date
   * @param {Date} date - The date to get attendance for
   * @returns {Promise<Object>} Attendance data keyed by student ID
   */
  async getAttendanceByDate(date) {
    return this.attendanceRepository.getAttendanceByDate(date);
  }

  /**
   * Validate attendance status
   * @param {string} status - The status to validate
   * @throws {Error} If status is invalid
   */
  validateStatus(status) {
    const validStatuses = ['present', 'absent', 'medicalAbsence', 'holiday'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid attendance status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Validate that attributes can be applied to the given status
   * @param {string} status - The attendance status
   * @param {Object} attributes - The attributes to validate
   * 
   * Since attributes are now independent of status, we don't need to validate them against the status.
   * All statuses can have attributes.
   */
  validateAttributes(status, attributes) {
    // All statuses can now have attributes
    // No validation needed
  }

  /**
   * Calculate the fee for attendance status and attributes
   * @param {string} status - Attendance status (present, absent, medicalAbsence, holiday)
   * @param {Object} attributes - Fee attributes (late, noShoes, notInUniform)
   * @returns {number} Fee amount in dollars
   */
  calculateAttendanceFee(status, attributes) {
    // For Absent, fixed $5 fee regardless of attributes
    if (status === 'absent') {
      return 5;
    }
    
    // For Medical Absence or Holiday, no fees regardless of attributes
    if (status === 'medicalAbsence' || status === 'holiday') {
      return 0;
    }
    
    // For Present status, accumulate fees from attributes
    let fee = 0;
    
    // Add fee for each attribute
    if (attributes.late) {
      fee += 1;
    }
    
    if (attributes.noShoes) {
      fee += 1;
    }
    
    if (attributes.notInUniform) {
      fee += 1;
    }
    
    return fee;
  }

  /**
   * Mark attendance for a single student
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status
   * @returns {Promise<void>}
   */
  async markAttendance(date, studentId, status) {
    this.validateStatus(status);
    return this.attendanceRepository.updateAttendance(date, studentId, status);
  }

  /**
   * Mark attendance with specific attributes for a student
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status
   * @param {Object} attributes - Attributes like { noShoes: true, notInUniform: true }
   * @returns {Promise<void>}
   */
  async markAttendanceWithAttributes(date, studentId, status, attributes) {
    this.validateStatus(status);
    this.validateAttributes(status, attributes);
    
    // All statuses can have attributes now
    return this.attendanceRepository.updateAttendanceWithAttributes(date, studentId, status, attributes);
  }

  /**
   * Mark attendance for multiple students
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - Attendance status
   * @returns {Promise<void>}
   */
  async bulkMarkAttendance(date, studentIds, status) {
    this.validateStatus(status);
    
    if (!studentIds || studentIds.length === 0) {
      throw new Error('No students selected');
    }
    
    return this.attendanceRepository.bulkUpdateAttendance(date, studentIds, status);
  }

  /**
   * Mark attendance with attributes for multiple students
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - Attendance status
   * @param {Object} attributes - Attributes like { noShoes: true, notInUniform: true }
   * @returns {Promise<void>}
   */
  async bulkMarkAttendanceWithAttributes(date, studentIds, status, attributes) {
    this.validateStatus(status);
    this.validateAttributes(status, attributes);
    
    if (!studentIds || studentIds.length === 0) {
      throw new Error('No students selected');
    }
    
    // All statuses can have attributes now
    return this.attendanceRepository.bulkUpdateAttendanceWithAttributes(date, studentIds, status, attributes);
  }

  /**
   * Update attendance and apply fee to student balance in a single operation
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status
   * @param {Object} attributes - Attendance attributes
   * @returns {Promise<void>}
   */
  async updateAttendanceWithFee(date, studentId, status, attributes) {
    this.validateStatus(status);
    
    // Calculate fee - all statuses can have attributes now
    const fee = this.calculateAttendanceFee(status, attributes);
    
    // Update attendance record
    await this.attendanceRepository.updateAttendanceWithAttributes(date, studentId, status, attributes);
    
    // Apply fee to student balance if applicable
    if (fee > 0) {
      await this.studentService.addBalance(studentId, fee);
    }
  }

  /**
   * Update attendance with fee for multiple students
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - Attendance status
   * @param {Object} attributes - Attendance attributes
   * @returns {Promise<void>}
   */
  async bulkUpdateAttendanceWithFee(date, studentIds, status, attributes) {
    this.validateStatus(status);
    
    if (!studentIds || studentIds.length === 0) {
      throw new Error('No students selected');
    }
    
    // Calculate fee - all statuses can have attributes now
    const fee = this.calculateAttendanceFee(status, attributes);
    
    // Update attendance records
    await this.attendanceRepository.bulkUpdateAttendanceWithAttributes(date, studentIds, status, attributes);
    
    // Apply fee to each student balance if applicable
    if (fee > 0) {
      for (const studentId of studentIds) {
        await this.studentService.addBalance(studentId, fee);
      }
    }
  }

  /**
   * Get students eligible for attendance tracking (Enrolled or Pending Payment)
   * @returns {Promise<Array>} Array of student objects sorted by first name
   */
  async getEligibleStudents() {
    try {
      // Get students with Enrolled status
      const enrolledStudents = await this.studentRepository.getStudentsByStatus('Enrolled');
      
      // Get students with Pending Payment status
      const pendingPaymentStudents = await this.studentRepository.getStudentsByStatus('Pending Payment');
      
      // Combine the two sets of students and sort by first name
      return sortStudentsByFirstName([...enrolledStudents, ...pendingPaymentStudents]);
    } catch (error) {
      console.error("Error fetching eligible students:", error);
      throw new Error(`Failed to fetch eligible students: ${error.message}`);
    }
  }

  /**
   * Get combined data of students with their attendance records for a specific date
   * @param {Date} date - The date to get attendance for
   * @returns {Promise<Array>} Array of student objects with attendance data
   */
  async getAttendanceSummaryWithStudents(date) {
    try {
      // Get all eligible students
      const students = await this.getEligibleStudents();
      
      // Get attendance data for the date
      const attendanceData = await this.getAttendanceByDate(date);
      
      // Merge student and attendance data
      return students.map(student => ({
        ...student,
        attendance: attendanceData[student.id] || null
      }));
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
      throw new Error(`Failed to fetch attendance summary: ${error.message}`);
    }
  }
}

// Export a default instance
export const attendanceService = new AttendanceService(attendanceRepository, studentRepository, studentService);