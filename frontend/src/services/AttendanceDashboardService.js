import { holidayService } from './HolidayService';
import { attendanceService } from './AttendanceService';
import { holidayFeeAdjustmentService } from './HolidayFeeAdjustmentService';
import { studentService } from './StudentService';
import { paymentService } from './PaymentService';

export default class AttendanceDashboardService {
  constructor(
    holidayServiceInstance = holidayService,
    attendanceServiceInstance = attendanceService,
    holidayFeeAdjustmentServiceInstance = holidayFeeAdjustmentService,
    studentServiceInstance = studentService,
    paymentServiceInstance = paymentService
  ) {
    this.holidayService = holidayServiceInstance;
    this.attendanceService = attendanceServiceInstance;
    this.holidayFeeAdjustmentService = holidayFeeAdjustmentServiceInstance;
    this.studentService = studentServiceInstance;
    this.paymentService = paymentServiceInstance;
  }

  async analyzeHolidayPaymentImpact(date) {
    try {
      const dateString = date.toLocaleDateString();
      
      // Get payments made on this date
      const paymentsOnDate = await this._getPaymentsOnDate(date);
      console.log('Payments made ON date:', paymentsOnDate.length);
      
      // Get payments with notes referencing this date
      const paymentsForDate = await this._getPaymentsForDate(date, paymentsOnDate);
      console.log(`Found ${paymentsOnDate.length} payments made on ${dateString} and ${paymentsForDate.length} payments for ${dateString}`);
      
      const combinedPayments = [...paymentsOnDate, ...paymentsForDate];
      console.log('Combined payments:', combinedPayments.map(p => ({ 
        studentName: p.studentName, 
        studentId: p.studentId, 
        amount: p.amount, 
        paymentId: p.id 
      })));
      
      if (combinedPayments.length === 0) {
        return { hasPaymentImpact: false, affectedPayments: [], totalPaymentAdjustment: 0 };
      }

      const affectedPayments = combinedPayments.map(payment => ({
        paymentId: payment.id,
        studentId: payment.studentId,
        studentName: payment.studentName,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        notes: payment.notes,
        creditAmount: payment.amount
      }));

      const totalPaymentAdjustment = affectedPayments.reduce((sum, p) => sum + p.creditAmount, 0);

      return { hasPaymentImpact: true, affectedPayments, totalPaymentAdjustment };
    } catch (error) {
      console.error('Error analyzing holiday payment impact:', error);
      throw new Error(`Failed to analyze holiday payment impact: ${error.message}`);
    }
  }

  async _getPaymentsOnDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await this.paymentService.getPaymentsByDateRange(startOfDay, endOfDay);
  }

  async _getPaymentsForDate(date, excludePayments = []) {
    const dateFormats = this._generateDateFormats(date);
    console.log('Searching for payments with these date formats:', dateFormats);
    
    const allPayments = await this.paymentService.getAllPayments();
    console.log(`Total payments in database: ${allPayments.length}`);
    
    return allPayments.filter(payment => {
      if (!payment.notes || excludePayments.find(p => p.id === payment.id)) {
        return false;
      }
      
      // Create flexible pattern matching for payment notes
      const paymentPatterns = dateFormats.flatMap(dateFormat => [
        `Payment for ${dateFormat}`,
        `payment for ${dateFormat}`,
        `Payment for ${dateFormat} -`,
        `payment for ${dateFormat} -`,
        `${dateFormat} payment`,
        `${dateFormat} Payment`,
        `fee for ${dateFormat}`,
        `Fee for ${dateFormat}`
      ]);
      
      const matchesAnyFormat = paymentPatterns.some(pattern => 
        payment.notes.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (matchesAnyFormat) {
        console.log(`Found matching payment: ${payment.studentName} (ID: ${payment.studentId}) - "${payment.notes}" (Payment ID: ${payment.id})`);
      }
      
      return matchesAnyFormat;
    });
  }

  _generateDateFormats(date) {
    return [
      date.toLocaleDateString(),
      date.toLocaleDateString('en-US'),
      `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
      `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
    ];
  }

  async analyzeHolidayChangeImpact(date, newHolidayName = 'Manual Holiday') {
    try {
      // Get current attendance data for the date
      const attendanceData = await this.attendanceService.getAttendanceByDate(date);
      const eligibleStudents = await this.attendanceService.getEligibleStudents();
      
      // Analyze payment impact
      const paymentImpact = await this.analyzeHolidayPaymentImpact(date);
      
      // Filter students who have attendance on this date
      const studentsWithAttendance = eligibleStudents.filter(student => 
        attendanceData[student.id]
      );

      // Calculate fee adjustments for each student
      const affectedStudents = [];
      let totalAttendanceAdjustment = 0;

      for (const student of studentsWithAttendance) {
        const attendance = attendanceData[student.id];
        
        // Calculate current fee (without holiday consideration)
        const currentFee = this.attendanceService.calculateAttendanceFee(
          attendance.status,
          attendance.attributes || {}
        );

        // Calculate new fee (with holiday consideration - should be 0)
        const newFee = 0; // No fees on holidays

        const adjustment = newFee - currentFee;

        if (adjustment !== 0) {
          affectedStudents.push({
            studentId: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            currentStatus: attendance.status,
            currentAttributes: attendance.attributes || {},
            currentFee: currentFee,
            newFee: newFee,
            adjustment: adjustment,
            creditAmount: Math.abs(adjustment),
            type: 'attendance'
          });
          totalAttendanceAdjustment += Math.abs(adjustment);
        }
      }

      const totalAdjustment = totalAttendanceAdjustment + paymentImpact.totalPaymentAdjustment;
      const hasImpact = affectedStudents.length > 0 || paymentImpact.hasPaymentImpact;

      // Combine attendance and payment affected students
      const allAffectedStudents = [...affectedStudents];
      
      // Add payment-affected students
      for (const payment of paymentImpact.affectedPayments) {
        allAffectedStudents.push({
          studentId: payment.studentId,
          firstName: payment.studentName?.split(' ')[0] || 'Unknown',
          lastName: payment.studentName?.split(' ').slice(1).join(' ') || '',
          paymentId: payment.paymentId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          notes: payment.notes,
          creditAmount: payment.creditAmount,
          type: 'payment'
        });
      }

      if (!hasImpact) {
        return {
          hasImpact: false,
          affectedStudents: [],
          totalAdjustment: 0,
          message: `No attendance records or payments found for ${date.toLocaleDateString()}. Safe to mark as holiday.`
        };
      }

      return {
        hasImpact: true,
        affectedStudents: allAffectedStudents,
        totalAdjustment,
        totalAttendanceAdjustment,
        totalPaymentAdjustment: paymentImpact.totalPaymentAdjustment,
        date,
        newHolidayName,
        message: `Warning: ${allAffectedStudents.length} students will receive holiday credits totaling $${totalAdjustment}` +
                (totalAttendanceAdjustment > 0 ? ` (Attendance fees: $${totalAttendanceAdjustment})` : '') +
                (paymentImpact.totalPaymentAdjustment > 0 ? ` (Payments: $${paymentImpact.totalPaymentAdjustment})` : '')
      };
    } catch (error) {
      console.error('Error analyzing holiday change impact:', error);
      throw new Error(`Failed to analyze holiday impact: ${error.message}`);
    }
  }

  async processHolidayPaymentAdjustments(date, newHolidayName) {
    try {
      const paymentImpact = await this.analyzeHolidayPaymentImpact(date);
      
      if (!paymentImpact.hasPaymentImpact) {
        return { paymentAdjustments: [], totalPaymentCredits: 0 };
      }

      const paymentAdjustments = [];
      let totalPaymentCredits = 0;

      for (const payment of paymentImpact.affectedPayments) {
        console.log(`Processing payment: ${payment.studentName} (ID: ${payment.studentId}) - $${payment.amount} - Payment ID: ${payment.paymentId}`);
        
        try {
          const shouldProcess = await this._shouldProcessPaymentCredit(payment, date);
          
          if (!shouldProcess.process) {
            console.log(`Skipping payment ${payment.paymentId} - ${shouldProcess.reason}`);
            paymentAdjustments.push({
              studentId: payment.studentId,
              studentName: payment.studentName,
              paymentId: payment.paymentId,
              amount: payment.amount,
              creditAmount: 0,
              balanceAdjusted: false,
              skipped: true,
              reason: shouldProcess.reason
            });
            continue;
          }

          if (shouldProcess.reprocessing) {
            console.log(`Reprocessing holiday credit for payment ${payment.paymentId} - student balance was reset`);
          }

          // Add holiday credit and adjust balance
          await this._applyHolidayPaymentCredit(payment, date, newHolidayName);
          
          paymentAdjustments.push({
            studentId: payment.studentId,
            studentName: payment.studentName,
            paymentId: payment.paymentId,
            amount: payment.amount,
            creditAmount: payment.creditAmount,
            balanceAdjusted: true
          });

          totalPaymentCredits += payment.creditAmount;
        } catch (error) {
          console.error(`Error processing payment adjustment for student ${payment.studentId}:`, error);
          paymentAdjustments.push({
            studentId: payment.studentId,
            paymentId: payment.paymentId,
            error: error.message,
            balanceAdjusted: false
          });
        }
      }

      return { paymentAdjustments, totalPaymentCredits };
    } catch (error) {
      console.error('Error processing holiday payment adjustments:', error);
      throw new Error(`Failed to process holiday payment adjustments: ${error.message}`);
    }
  }

  async _shouldProcessPaymentCredit(payment, date) {
    try {
      const existingCredits = await this.studentService.getHolidayCredits(payment.studentId);
      const currentStudent = await this.studentService.getStudentById(payment.studentId);
      const hasZeroBalance = (currentStudent.balance || 0) === 0;
      
      const alreadyProcessed = existingCredits.some(credit => {
        const creditDate = this._normalizeDate(credit.date);
        return creditDate && 
               credit.paymentId === payment.paymentId && 
               creditDate.toDateString() === date.toDateString();
      });
      
      if (!alreadyProcessed) {
        return { process: true, reprocessing: false };
      }
      
      if (hasZeroBalance) {
        return { process: true, reprocessing: true };
      }
      
      return { 
        process: false, 
        reason: 'Already processed and balance not reset' 
      };
    } catch (error) {
      console.warn(`Could not check existing credits for student ${payment.studentId}:`, error.message);
      return { process: true, reprocessing: false };
    }
  }

  async _applyHolidayPaymentCredit(payment, date, holidayName) {
    await this.studentService.addHolidayCredit(payment.studentId, {
      amount: payment.creditAmount,
      date: date,
      holidayName: holidayName,
      paymentId: payment.paymentId,
      paymentMethod: payment.paymentMethod,
      originalNotes: payment.notes,
      reason: `Holiday payment adjustment for ${holidayName} - Payment made on holiday`
    });

    console.log(`Applying $${payment.creditAmount} credit to ${payment.studentName}`);
    const updatedStudent = await this.studentService.reduceBalance(
      payment.studentId, 
      payment.creditAmount
    );
    console.log(`${payment.studentName} new balance: $${updatedStudent.balance}`);
  }

  _normalizeDate(date) {
    if (!date) return null;
    
    if (typeof date.toDate === 'function') {
      return date.toDate(); // Firestore Timestamp
    }
    if (date instanceof Date) {
      return date; // Regular Date
    }
    if (typeof date === 'string') {
      return new Date(date); // String date
    }
    return null;
  }

  async processHolidayChange(date, newHolidayName = 'Manual Holiday', confirmed = false) {
    try {
      if (!confirmed) {
        throw new Error('Holiday change must be explicitly confirmed');
      }

      // Add the date as a holiday
      const normalizedDate = new Date(date);
      this.holidayService.addSpecificHoliday(
        normalizedDate.getFullYear(),
        normalizedDate.getMonth(),
        normalizedDate.getDate(),
        newHolidayName
      );

      // Get attendance data for processing
      const attendanceData = await this.attendanceService.getAttendanceByDate(date);
      const eligibleStudents = await this.attendanceService.getEligibleStudents();
      
      // Build attendance records for processing
      const attendanceRecords = [];
      for (const student of eligibleStudents) {
        if (attendanceData[student.id]) {
          attendanceRecords.push({
            studentId: student.id,
            date: normalizedDate,
            status: attendanceData[student.id].status,
            attributes: attendanceData[student.id].attributes || {}
          });
        }
      }

      // Process holiday fee adjustments (attendance)
      const adjustmentResults = await this.holidayFeeAdjustmentService.scanAndAdjustHolidayFees(
        attendanceRecords
      );

      // Process holiday payment adjustments
      const paymentResults = await this.processHolidayPaymentAdjustments(date, newHolidayName);

      // Update all attendance statuses to 'holiday' for this date
      const studentIds = attendanceRecords.map(r => r.studentId);
      if (studentIds.length > 0) {
        await this.attendanceService.bulkMarkAttendance(date, studentIds, 'holiday');
      }

      // Calculate summary
      const successfulAttendanceAdjustments = adjustmentResults.filter(r => r.balanceAdjusted);
      const totalAttendanceCredits = successfulAttendanceAdjustments.reduce(
        (sum, r) => sum + Math.abs(r.adjustmentCalculation.adjustment),
        0
      );

      const successfulPaymentAdjustments = paymentResults.paymentAdjustments.filter(r => r.balanceAdjusted);
      const totalPaymentCredits = paymentResults.totalPaymentCredits;

      const totalCreditsIssued = totalAttendanceCredits + totalPaymentCredits;
      const totalAffectedStudents = successfulAttendanceAdjustments.length + successfulPaymentAdjustments.length;

      return {
        success: true,
        holidayAdded: true,
        attendanceUpdated: studentIds.length,
        adjustmentResults,
        paymentAdjustments: paymentResults.paymentAdjustments,
        totalCreditsIssued,
        totalAttendanceCredits,
        totalPaymentCredits,
        affectedStudents: totalAffectedStudents,
        message: `Successfully marked ${date.toLocaleDateString()} as ${newHolidayName}. ` +
                `Updated ${studentIds.length} attendance records to 'holiday' status. ` +
                `Issued $${totalCreditsIssued} in holiday credits to ${totalAffectedStudents} students` +
                (totalAttendanceCredits > 0 ? ` (Attendance: $${totalAttendanceCredits})` : '') +
                (totalPaymentCredits > 0 ? ` (Payments: $${totalPaymentCredits})` : '') + '.'
      };
    } catch (error) {
      console.error('Error processing holiday change:', error);
      throw new Error(`Failed to process holiday change: ${error.message}`);
    }
  }

  async getHolidayWarning(date) {
    try {
      const impact = await this.analyzeHolidayChangeImpact(date);
      
      if (!impact.hasImpact) {
        return {
          showWarning: false,
          message: impact.message
        };
      }

      const studentNames = impact.affectedStudents.map(s => `${s.firstName} ${s.lastName}`);
      
      // Separate attendance and payment details
      const attendanceStudents = impact.affectedStudents.filter(s => s.type === 'attendance');
      const paymentStudents = impact.affectedStudents.filter(s => s.type === 'payment');
      
      const attendanceDetails = attendanceStudents.map(s => 
        `${s.firstName} ${s.lastName}: $${s.creditAmount} credit (was ${s.currentStatus}${
          Object.keys(s.currentAttributes || {}).length > 0 
            ? ` with ${Object.keys(s.currentAttributes).join(', ')}` 
            : ''
        })`
      );

      const paymentDetails = paymentStudents.map(s => 
        `${s.firstName} ${s.lastName}: $${s.creditAmount} credit (payment ${s.paymentMethod}${
          s.notes ? ` - ${s.notes}` : ''
        })`
      );

      const allDetails = [...attendanceDetails, ...paymentDetails];

      return {
        showWarning: true,
        affectedStudentCount: impact.affectedStudents.length,
        totalCredits: impact.totalAdjustment,
        totalAttendanceCredits: impact.totalAttendanceAdjustment || 0,
        totalPaymentCredits: impact.totalPaymentAdjustment || 0,
        studentNames,
        feeDetails: allDetails,
        attendanceDetails,
        paymentDetails,
        message: `Warning: Changing ${date.toLocaleDateString()} to a holiday will:\n\n` +
                `• Update attendance records to 'holiday' status\n` +
                `• Issue $${impact.totalAdjustment} in holiday credits` +
                (impact.totalAttendanceAdjustment > 0 && impact.totalPaymentAdjustment > 0 
                  ? ` (Attendance: $${impact.totalAttendanceAdjustment}, Payments: $${impact.totalPaymentAdjustment})` 
                  : '') + '\n\n' +
                `Affected students:\n${allDetails.join('\n')}\n\n` +
                `Do you want to proceed?`
      };
    } catch (error) {
      console.error('Error getting holiday warning:', error);
      return {
        showWarning: true,
        message: `Error analyzing impact: ${error.message}`,
        error: true
      };
    }
  }

  /**
   * Retroactively process a date as a holiday - useful for fixing cases where
   * holiday status was set via dropdown instead of proper holiday processing
   */
  async retroactivelyProcessHoliday(date, holidayName = 'Retroactive Holiday') {
    try {
      console.log(`Processing retroactive holiday for ${date.toLocaleDateString()}`);
      
      // First check if this date already has the holiday in HolidayService
      const isAlreadyHoliday = this.holidayService.isHoliday(date);
      if (!isAlreadyHoliday) {
        // Add the date as a holiday
        this.holidayService.addSpecificHoliday(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          holidayName
        );
        console.log(`Added ${date.toLocaleDateString()} as holiday: ${holidayName}`);
      }
      
      // Process holiday payment adjustments for existing payments on this date
      const paymentResults = await this.processHolidayPaymentAdjustments(date, holidayName);
      console.log('Payment adjustment results:', paymentResults);
      
      return {
        success: true,
        date: date.toLocaleDateString(),
        holidayName,
        paymentAdjustments: paymentResults.paymentAdjustments,
        totalCreditsIssued: paymentResults.totalPaymentCredits
      };
      
    } catch (error) {
      console.error('Error processing retroactive holiday:', error);
      throw new Error(`Failed to process retroactive holiday: ${error.message}`);
    }
  }
}

export const attendanceDashboardService = new AttendanceDashboardService(
  holidayService,
  attendanceService,
  holidayFeeAdjustmentService,
  studentService,
  paymentService
);