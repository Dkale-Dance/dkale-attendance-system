import { AttendanceDashboardService } from '../services/AttendanceDashboardService.js';
import { AttendanceService } from '../services/AttendanceService.js';
import { PaymentService } from '../services/PaymentService.js';
import { StudentService } from '../services/StudentService.js';
import { HolidayService } from '../services/HolidayService.js';
import { HolidayFeeAdjustmentService } from '../services/HolidayFeeAdjustmentService.js';

/**
 * Manual script to fix holiday adjustment for 5/2/2025
 * This will properly process Andres Naranjo's payment made on that date
 */
export async function fixHolidayAdjustmentForMay2() {
  try {
    console.log('Starting manual holiday adjustment for 5/2/2025...');
    
    // Initialize services
    const attendanceService = new AttendanceService();
    const paymentService = new PaymentService();
    const studentService = new StudentService();
    const holidayService = new HolidayService();
    const holidayFeeAdjustmentService = new HolidayFeeAdjustmentService(studentService);
    
    const attendanceDashboardService = new AttendanceDashboardService(
      attendanceService,
      paymentService,
      studentService,
      holidayService,
      holidayFeeAdjustmentService
    );
    
    // The target date
    const holidayDate = new Date(2025, 4, 2); // May 2, 2025 (month is 0-indexed)
    
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
        'Manual Holiday - May 2, 2025',
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

// Function to be called from browser console
window.fixHolidayAdjustment = fixHolidayAdjustmentForMay2;