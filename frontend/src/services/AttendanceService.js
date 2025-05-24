import { attendanceRepository } from "../repository/AttendanceRepository";
import { studentRepository } from "../repository/StudentRepository";
import { studentService } from "../services/StudentService";
import { holidayService } from "../services/HolidayService";
import { sortStudentsByFirstName } from "../utils/sorting";

export default class AttendanceService {
  constructor(attendanceRepository, studentRepository, studentServiceInstance = studentService, holidayServiceInstance = holidayService) {
    this.attendanceRepository = attendanceRepository;
    this.studentRepository = studentRepository;
    this.studentService = studentServiceInstance;
    this.holidayService = holidayServiceInstance;
  }
  
  /**
   * Removes a fee record and adjusts the student's balance accordingly
   * Used by the PublicDashboard to allow admins to delete fee entries and update balances
   * @param {Date} date - The date of the fee/attendance record to remove
   * @param {string} studentId - The student's ID
   * @returns {Promise<Object>} Result containing status, previous record details, and balance adjustment
   */
  async removeFeeRecord(date, studentId) {
    try {
      // This is essentially the same as removeAttendanceWithFeeAdjustment
      // but with a different name for clarity in the fee-related context
      return this.removeAttendanceWithFeeAdjustment(date, studentId);
    } catch (error) {
      console.error("Error removing fee record:", error);
      throw new Error(`Failed to remove fee record: ${error.message}`);
    }
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
   * Calculate the fee for attendance status and attributes, considering holidays
   * On holidays, no fees should be charged regardless of status/attributes
   * @param {string} status - Attendance status (present, absent, medicalAbsence, holiday)
   * @param {Object} attributes - Fee attributes (late, noShoes, notInUniform)
   * @param {Date} date - The date to check for holiday status
   * @returns {number} Fee amount in dollars (0 if holiday)
   */
  calculateAttendanceFeeWithHolidays(status, attributes, date) {
    // Check if the date is a holiday first
    if (this.holidayService.isHoliday(date)) {
      return 0;
    }
    
    // Otherwise, calculate fee normally
    return this.calculateAttendanceFee(status, attributes);
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
   * Calculate the fee difference between two attendance states
   * @param {string} oldStatus - Previous attendance status
   * @param {Object} oldAttributes - Previous attendance attributes
   * @param {string} newStatus - New attendance status
   * @param {Object} newAttributes - New attendance attributes
   * @param {Date} date - Date to check for holiday status
   * @returns {number} - Fee difference (positive means fee increase, negative means fee decrease)
   */
  calculateFeeDifference(oldStatus, oldAttributes, newStatus, newAttributes, date = null) {
    if (date) {
      // Use holiday-aware calculation if date is provided
      const oldFee = this.calculateAttendanceFeeWithHolidays(oldStatus, oldAttributes || {}, date);
      const newFee = this.calculateAttendanceFeeWithHolidays(newStatus, newAttributes || {}, date);
      return newFee - oldFee;
    } else {
      // Fallback to original calculation for backward compatibility
      const oldFee = this.calculateAttendanceFee(oldStatus, oldAttributes || {});
      const newFee = this.calculateAttendanceFee(newStatus, newAttributes || {});
      return newFee - oldFee;
    }
  }

  /**
   * Update attendance and apply fee to student balance in a single operation
   * DEPRECATED: Use updateAttendanceWithFeeAdjustment instead which properly handles fee adjustments
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - Attendance status
   * @param {Object} attributes - Attendance attributes
   * @returns {Promise<void>}
   */
  async updateAttendanceWithFee(date, studentId, status, attributes) {
    console.warn('updateAttendanceWithFee is deprecated. Use updateAttendanceWithFeeAdjustment instead.');
    // This method is now just a wrapper around updateAttendanceWithFeeAdjustment to ensure proper fee adjustments
    return this.updateAttendanceWithFeeAdjustment(date, studentId, status, attributes);
  }

  /**
   * Update attendance with fee adjustment based on previous attendance status
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @param {string} status - New attendance status
   * @param {Object} attributes - New attendance attributes
   * @returns {Promise<void>}
   */
  async updateAttendanceWithFeeAdjustment(date, studentId, status, attributes = {}) {
    this.validateStatus(status);
    
    try {
      // Get the previous attendance record to calculate fee difference
      const previousRecord = await this.attendanceRepository.getAttendanceRecord(date, studentId);
      
      // Normalize attributes to always be an object
      const normalizedAttributes = attributes || {};
      
      // Update attendance record first to ensure data consistency
      await this.attendanceRepository.updateAttendanceWithAttributes(date, studentId, status, normalizedAttributes);
      
      // If there was no previous record, just apply the new fee (if any) considering holidays
      if (!previousRecord) {
        const newFee = this.calculateAttendanceFeeWithHolidays(status, normalizedAttributes, date);
        if (newFee > 0) {
          await this.studentService.addBalance(studentId, newFee);
        }
        return;
      }
      
      // Ensure previous record attributes are properly initialized
      const previousAttributes = previousRecord.attributes || {};
      
      // Get previous status for fee calculation
      const previousStatus = previousRecord.status;
      
      // Calculate fee difference between old and new status (including holiday consideration)
      const feeDifference = this.calculateFeeDifference(
        previousStatus,
        previousAttributes,
        status,
        normalizedAttributes,
        date
      );
      
      // Apply fee adjustment to student balance
      if (feeDifference > 0) {
        // Fee increased, add to balance
        await this.studentService.addBalance(studentId, feeDifference);
      } else if (feeDifference < 0) {
        // Fee decreased, reduce from balance
        const amountToReduce = Math.abs(feeDifference);
        await this.studentService.reduceBalance(studentId, amountToReduce);
      }
      
      // Return the adjustment amount for reference
      return {
        previousStatus,
        newStatus: status,
        feeDifference
      };
    } catch (error) {
      console.error("Error updating attendance with fee adjustment:", error);
      throw new Error(`Failed to update attendance with fee adjustment: ${error.message}`);
    }
  }

  /**
   * Update attendance with fee for multiple students
   * DEPRECATED: Use bulkUpdateAttendanceWithFeeAdjustment instead which properly handles fee adjustments
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - Attendance status
   * @param {Object} attributes - Attendance attributes
   * @returns {Promise<void>}
   */
  async bulkUpdateAttendanceWithFee(date, studentIds, status, attributes) {
    console.warn('bulkUpdateAttendanceWithFee is deprecated. Use bulkUpdateAttendanceWithFeeAdjustment instead.');
    // This method is now just a wrapper around bulkUpdateAttendanceWithFeeAdjustment
    return this.bulkUpdateAttendanceWithFeeAdjustment(date, studentIds, status, attributes);
  }
  
  /**
   * Update attendance with fee adjustment for multiple students
   * @param {Date} date - The date of attendance
   * @param {string[]} studentIds - Array of student IDs
   * @param {string} status - New attendance status
   * @param {Object} attributes - New attendance attributes
   * @returns {Promise<Array>} Array of adjustment results
   */
  async bulkUpdateAttendanceWithFeeAdjustment(date, studentIds, status, attributes = {}) {
    this.validateStatus(status);
    
    if (!studentIds || studentIds.length === 0) {
      throw new Error('No students selected');
    }
    
    try {
      // Normalize attributes to always be an object
      const normalizedAttributes = attributes || {};
      
      // Update attendance records first in bulk for efficiency
      await this.attendanceRepository.bulkUpdateAttendanceWithAttributes(date, studentIds, status, normalizedAttributes);
      
      // Process fee adjustments for each student individually and collect results
      const adjustmentResults = [];
      
      for (const studentId of studentIds) {
        try {
          // Get previous attendance record
          const previousRecord = await this.attendanceRepository.getAttendanceRecord(date, studentId);
          
          // If no previous record, just apply new fee if applicable (considering holidays)
          if (!previousRecord) {
            const newFee = this.calculateAttendanceFeeWithHolidays(status, normalizedAttributes, date);
            if (newFee > 0) {
              await this.studentService.addBalance(studentId, newFee);
              adjustmentResults.push({
                studentId,
                previousStatus: null,
                newStatus: status, 
                feeDifference: newFee
              });
            }
            continue;
          }
          
          // Get previous status and ensure attributes are initialized
          const previousStatus = previousRecord.status;
          const previousAttributes = previousRecord.attributes || {};
          
          // Calculate fee difference (including holiday consideration)
          const feeDifference = this.calculateFeeDifference(
            previousStatus,
            previousAttributes,
            status,
            normalizedAttributes,
            date
          );
          
          // Apply fee adjustment
          if (feeDifference > 0) {
            await this.studentService.addBalance(studentId, feeDifference);
          } else if (feeDifference < 0) {
            const amountToReduce = Math.abs(feeDifference);
            await this.studentService.reduceBalance(studentId, amountToReduce);
          }
          
          // Record the adjustment
          adjustmentResults.push({
            studentId,
            previousStatus,
            newStatus: status,
            feeDifference
          });
        } catch (error) {
          console.error(`Error processing student ${studentId}:`, error);
          adjustmentResults.push({
            studentId,
            error: error.message
          });
          // Continue with next student instead of failing the entire operation
        }
      }
      
      return adjustmentResults;
    } catch (error) {
      console.error("Error in bulk update with fee adjustment:", error);
      throw new Error(`Failed to perform bulk update with fee adjustment: ${error.message}`);
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

  /**
   * Removes a student's attendance record for a specific date and adjusts their balance if needed
   * @param {Date} date - The date of attendance
   * @param {string} studentId - The student's ID
   * @returns {Promise<Object>} The removed record and adjustment information
   */
  async removeAttendanceWithFeeAdjustment(date, studentId) {
    try {
      // Get the previous attendance record to calculate fee difference
      const previousRecord = await this.attendanceRepository.getAttendanceRecord(date, studentId);
      
      // If there was no previous record, nothing to do
      if (!previousRecord) {
        return { removed: false, reason: 'No attendance record found' };
      }
      
      // Get previous status and attributes for fee calculation
      const previousStatus = previousRecord.status;
      const previousAttributes = previousRecord.attributes || {};
      
      // Remove the attendance record
      const removedRecord = await this.attendanceRepository.removeAttendance(date, studentId);
      
      // Calculate the fee that was previously applied (considering holidays)
      const previousFee = this.calculateAttendanceFeeWithHolidays(previousStatus, previousAttributes, date);
      
      // If there was a fee, we need to reduce the student's balance
      if (previousFee > 0) {
        await this.studentService.reduceBalance(studentId, previousFee);
      }
      
      // Return information about the removed record and adjustment
      return {
        removed: true,
        previousStatus,
        previousAttributes,
        feeAdjustment: -previousFee, // Negative because we're reducing their balance
        removedRecord
      };
    } catch (error) {
      console.error("Error removing attendance with fee adjustment:", error);
      throw new Error(`Failed to remove attendance with fee adjustment: ${error.message}`);
    }
  }
}

// Export a default instance
export const attendanceService = new AttendanceService(attendanceRepository, studentRepository, studentService, holidayService);