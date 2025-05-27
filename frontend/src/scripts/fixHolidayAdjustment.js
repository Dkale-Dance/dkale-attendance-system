import { AttendanceDashboardService } from '../services/AttendanceDashboardService.js';
import { AttendanceService } from '../services/AttendanceService.js';
import { PaymentService } from '../services/PaymentService.js';
import { StudentService } from '../services/StudentService.js';
import { HolidayService } from '../services/HolidayService.js';
import { HolidayFeeAdjustmentService } from '../services/HolidayFeeAdjustmentService.js';

/**
 * Manual script to fix holiday adjustment
 * This will properly process payments made on holiday dates
 * 
 * @param {Date} targetDate - The holiday date to process
 * @param {Object} services - Optional dependency injection object
 * @param {Object} services.attendanceService - Attendance service instance
 * @param {Object} services.paymentService - Payment service instance
 * @param {Object} services.studentService - Student service instance
 * @param {Object} services.holidayService - Holiday service instance
 * @param {Object} services.holidayFeeAdjustmentService - Holiday fee adjustment service instance
 */
export async function fixHolidayAdjustment(
  targetDate = new Date(2025, 4, 2), // Default to May 2, 2025
  services = {}
) {
  try {
    const dateString = targetDate.toLocaleDateString();
    console.log(`Starting manual holiday adjustment for ${dateString}...`);
    
    // Initialize services with dependency injection support
    const attendanceService = services.attendanceService || new AttendanceService();
    const paymentService = services.paymentService || new PaymentService();
    const studentService = services.studentService || new StudentService();
    const holidayService = services.holidayService || new HolidayService();
    const holidayFeeAdjustmentService = services.holidayFeeAdjustmentService || 
      new HolidayFeeAdjustmentService(studentService);
    
    const attendanceDashboardService = new AttendanceDashboardService(
      holidayService,
      attendanceService,
      holidayFeeAdjustmentService,
      studentService,
      paymentService
    );
    
    // The target date
    const holidayDate = targetDate;
    
    console.log('Analyzing holiday impact for', holidayDate.toLocaleDateString());
    
    // First, analyze the impact
    const impact = await attendanceDashboardService.analyzeHolidayChangeImpact(holidayDate);
    console.log('Holiday impact analysis:', impact);
    
    // Check for payment impact
    const paymentImpact = await attendanceDashboardService.analyzeHolidayPaymentImpact(holidayDate);
    console.log('Payment impact analysis:', paymentImpact);
    
    // If there are payments to adjust, process them
    if (paymentImpact && paymentImpact.length > 0) {
      console.log(`Found ${paymentImpact.length} payments to adjust`);
      
      // Process the holiday change with confirmation
      const result = await attendanceDashboardService.processHolidayChange(
        holidayDate,
        `Manual Holiday - ${dateString}`,
        true // confirmed = true
      );
      
      console.log('Holiday adjustment result:', result);
      
      // Check Andres Naranjo's balance specifically
      console.log('Checking updated balances...');
      const students = await studentService.getAllStudents();
      const andres = students.find(s => 
        (s.firstName + ' ' + s.lastName).toLowerCase().includes('andres naranjo') ||
        s.name?.toLowerCase().includes('andres naranjo')
      );
      
      if (andres) {
        console.log(`Andres Naranjo (${andres.id}) updated balance:`, andres.balance);
        
        // Get holiday credits
        const holidayCredits = await studentService.getHolidayCredits(andres.id);
        console.log('Holiday credits:', holidayCredits);
      } else {
        console.log('Could not find Andres Naranjo in student list');
      }
      
    } else {
      console.log('No payments found on this date to adjust');
    }
    
    console.log('Manual holiday adjustment completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Error during manual holiday adjustment:', error);
    return { success: false, error: error.message };
  }
}

// Legacy function for backward compatibility
export const fixHolidayAdjustmentForMay2 = () => fixHolidayAdjustment();

// Function to be called from browser console (only in browser environment)
if (typeof window !== 'undefined') {
  window.fixHolidayAdjustment = fixHolidayAdjustment;
  window.fixHolidayAdjustmentForMay2 = fixHolidayAdjustmentForMay2;
}