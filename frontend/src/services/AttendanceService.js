import { attendanceRepository } from "../repository/AttendanceRepository";
import { studentRepository } from "../repository/StudentRepository";

export default class AttendanceService {
  constructor(attendanceRepository, studentRepository) {
    this.attendanceRepository = attendanceRepository;
    this.studentRepository = studentRepository;
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
    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid attendance status. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Mark attendance for a single student
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'excused')
   * @returns {Promise<void>}
   */
  async markAttendance(date, studentId, status) {
    this.validateStatus(status);
    return this.attendanceRepository.updateAttendance(date, studentId, status);
  }

  /**
   * Mark attendance for multiple students
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - Attendance status ('present', 'absent', 'late', 'excused')
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
   * Get students eligible for attendance tracking (Enrolled or Pending Payment)
   * @returns {Promise<Array>} Array of student objects
   */
  async getEligibleStudents() {
    try {
      // Get students with Enrolled status
      const enrolledStudents = await this.studentRepository.getStudentsByStatus('Enrolled');
      
      // Get students with Pending Payment status
      const pendingPaymentStudents = await this.studentRepository.getStudentsByStatus('Pending Payment');
      
      // Combine the two sets of students
      return [...enrolledStudents, ...pendingPaymentStudents];
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
export const attendanceService = new AttendanceService(attendanceRepository, studentRepository);