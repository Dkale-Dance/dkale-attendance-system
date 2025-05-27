import { holidayService } from './HolidayService';
import { attendanceService } from './AttendanceService';
import { studentService } from './StudentService';

export default class HolidayFeeAdjustmentService {
  constructor(
    holidayServiceInstance = holidayService,
    attendanceServiceInstance = attendanceService,
    studentServiceInstance = studentService
  ) {
    this.holidayService = holidayServiceInstance;
    this.attendanceService = attendanceServiceInstance;
    this.studentService = studentServiceInstance;
  }

  calculateHolidayFeeAdjustment(status, attributes, date) {
    const isHoliday = this.holidayService.isHoliday(date);
    const originalFee = this.attendanceService.calculateAttendanceFee(status, attributes);
    
    if (isHoliday) {
      return {
        isHoliday: true,
        originalFee,
        adjustedFee: 0,
        adjustment: -originalFee,
        holidayName: this.holidayService.getHolidayName(date)
      };
    }
    
    return {
      isHoliday: false,
      originalFee,
      adjustedFee: originalFee,
      adjustment: 0
    };
  }

  async processHolidayAdjustment(studentId, date, status, attributes = {}) {
    try {
      const adjustmentCalculation = this.calculateHolidayFeeAdjustment(status, attributes, date);
      
      let updatedStudent = null;
      let balanceAdjusted = false;
      
      if (adjustmentCalculation.adjustment < 0) {
        const adjustmentAmount = Math.abs(adjustmentCalculation.adjustment);
        
        // Record the holiday fee adjustment as a credit in student's record
        await this.studentService.addHolidayCredit(studentId, {
          amount: adjustmentAmount,
          date: date,
          holidayName: adjustmentCalculation.holidayName,
          originalStatus: status,
          originalAttributes: attributes,
          reason: `Holiday fee adjustment for ${adjustmentCalculation.holidayName}`
        });
        
        // Reduce the student's balance (giving them credit)
        updatedStudent = await this.studentService.reduceBalance(studentId, adjustmentAmount);
        balanceAdjusted = true;
      }
      
      return {
        studentId,
        date,
        adjustmentCalculation,
        balanceAdjusted,
        updatedStudent
      };
    } catch (error) {
      console.error(`Error processing holiday adjustment for student ${studentId}:`, error);
      throw new Error(`Failed to process holiday adjustment: ${error.message}`);
    }
  }

  async scanAndAdjustHolidayFees(attendanceRecords) {
    const results = [];
    
    for (const record of attendanceRecords) {
      try {
        const result = await this.processHolidayAdjustment(
          record.studentId,
          record.date,
          record.status,
          record.attributes || {}
        );
        results.push(result);
      } catch (error) {
        console.error(`Error processing record for student ${record.studentId}:`, error);
        results.push({
          studentId: record.studentId,
          date: record.date,
          error: error.message,
          balanceAdjusted: false,
          updatedStudent: null
        });
      }
    }
    
    return results;
  }

  async getHolidayCreditsForStudent(studentId) {
    try {
      return await this.studentService.getHolidayCredits(studentId);
    } catch (error) {
      console.error(`Error fetching holiday credits for student ${studentId}:`, error);
      throw new Error(`Failed to fetch holiday credits: ${error.message}`);
    }
  }

  async getHolidayCreditsReport() {
    try {
      return await this.studentService.getAllHolidayCredits();
    } catch (error) {
      console.error('Error generating holiday credits report:', error);
      throw new Error(`Failed to generate holiday credits report: ${error.message}`);
    }
  }

  async applyHolidayCredit(studentId, creditAmount) {
    try {
      // Input validation
      if (!studentId) {
        throw new Error('Student ID is required');
      }
      if (!creditAmount || creditAmount <= 0) {
        throw new Error('Credit amount must be positive');
      }

      const student = await this.studentService.getStudentById(studentId);
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }

      const holidayCredits = await this.getHolidayCreditsForStudent(studentId);
      
      // Recalculate available credit considering used amounts
      const totalAvailableCredit = holidayCredits
        .filter(credit => !credit.used)
        .reduce((sum, credit) => sum + (credit.amount - (credit.usedAmount || 0)), 0);
      
      if (creditAmount > totalAvailableCredit) {
        throw new Error(
          `Cannot apply credit of $${creditAmount.toFixed(2)} for ${student.firstName} ${student.lastName}. ` +
          `Available holiday credit: $${totalAvailableCredit.toFixed(2)}`
        );
      }

      // Apply the credit by reducing balance
      const updatedStudent = await this.studentService.reduceBalance(studentId, creditAmount);
      
      // Mark credits as used
      await this.studentService.markHolidayCreditsAsUsed(studentId, creditAmount);
      
      // Recalculate remaining credit after usage
      const updatedHolidayCredits = await this.getHolidayCreditsForStudent(studentId);
      const remainingCredit = updatedHolidayCredits
        .filter(credit => !credit.used)
        .reduce((sum, credit) => sum + (credit.amount - (credit.usedAmount || 0)), 0);
      
      return {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        appliedAmount: creditAmount,
        remainingCredit,
        updatedStudent
      };
    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      console.error(`Error applying holiday credit for student ${studentId}:`, error);
      throw new Error(`Failed to apply holiday credit: ${errorMessage}`);
    }
  }
}

export const holidayFeeAdjustmentService = new HolidayFeeAdjustmentService();