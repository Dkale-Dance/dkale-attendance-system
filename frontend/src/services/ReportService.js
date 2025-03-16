import { reportRepository } from "../repository/ReportRepository";
import { studentRepository } from "../repository/StudentRepository";
import { attendanceRepository } from "../repository/AttendanceRepository";
import { attendanceService } from "../services/AttendanceService";
import { sortByName } from "../utils/sorting";

export default class ReportService {
  constructor(reportRepository, studentRepository, attendanceRepository, attendanceService) {
    this.reportRepository = reportRepository;
    this.studentRepository = studentRepository;
    this.attendanceRepository = attendanceRepository;
    this.attendanceService = attendanceService;
  }

  /**
   * Generate financial report for a specific month
   * @param {Date} monthDate - Any date within the month to report on
   * @returns {Promise<Object>} Financial report with total fees charged, payments, and outstanding balance
   */
  async generateMonthlyFinancialReport(monthDate) {
    try {
      // Get fees charged for the month (from attendance records)
      const monthlyAttendance = await this.reportRepository.getMonthlyFeesCharged(monthDate);
      
      // Get payments received for the month
      const monthlyPayments = await this.reportRepository.getMonthlyPayments(monthDate);
      
      // Get all students for reference
      const students = await this.studentRepository.getAllStudents();
      const studentMap = students.reduce((map, student) => {
        map[student.id] = student;
        return map;
      }, {});
      
      // Calculate total fees charged for the month (from attendance attributes and status)
      let totalFeesCharged = 0;
      
      // Process attendance records to calculate fees
      for (const attendanceDay of monthlyAttendance) {
        const attendanceData = attendanceDay.data;
        
        // Process each student's attendance for this day
        for (const [, attendance] of Object.entries(attendanceData)) {
          // Use the attendance service to calculate the fee based on status and attributes
          const fee = this.attendanceService.calculateAttendanceFee(
            attendance.status, 
            attendance.attributes || {}
          );
          
          totalFeesCharged += fee;
        }
      }
      
      // Calculate total payments received for the month
      const totalPaymentsReceived = monthlyPayments.reduce(
        (total, payment) => total + (payment.amount || 0), 
        0
      );
      
      // Outstanding balance is the difference between fees charged and payments received
      const outstandingBalance = totalFeesCharged - totalPaymentsReceived;

      // Format month name for the report title
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const reportDate = new Date(monthDate);
      const monthName = months[reportDate.getMonth()];
      const year = reportDate.getFullYear();
      
      return {
        title: `Financial Report: ${monthName} ${year}`,
        period: {
          month: reportDate.getMonth(),
          year: reportDate.getFullYear(),
          displayName: `${monthName} ${year}`
        },
        summary: {
          totalFeesCharged,
          totalPaymentsReceived,
          outstandingBalance
        },
        details: {
          feesBreakdown: this.calculateFeesBreakdown(monthlyAttendance, students),
          paymentBreakdown: this.calculatePaymentBreakdown(monthlyPayments, studentMap)
        },
        rawData: {
          attendance: monthlyAttendance,
          payments: monthlyPayments
        }
      };
    } catch (error) {
      console.error("Error generating monthly financial report:", error);
      throw new Error(`Failed to generate monthly financial report: ${error.message}`);
    }
  }

  /**
   * Break down fees charged by attendance status
   * @param {Array} monthlyAttendance - Array of attendance records
   * @param {Array} students - Array of student objects
   * @returns {Object} Breakdown of fees by status
   */
  calculateFeesBreakdown(monthlyAttendance, students) {
    const breakdown = {
      byStatus: {
        absent: 0,
        present: 0,
        medicalAbsence: 0,
        holiday: 0
      },
      byAttribute: {
        late: 0,
        noShoes: 0,
        notInUniform: 0
      },
      byStudent: {}
    };
    
    // Initialize student fee totals
    students.forEach(student => {
      breakdown.byStudent[student.id] = {
        studentName: `${student.firstName} ${student.lastName}`,
        total: 0,
        statusBreakdown: {
          absent: 0,
          present: 0,
          medicalAbsence: 0,
          holiday: 0
        },
        attributeBreakdown: {
          late: 0,
          noShoes: 0,
          notInUniform: 0
        }
      };
    });
    
    // Process each attendance day
    for (const attendanceDay of monthlyAttendance) {
      const attendanceData = attendanceDay.data;
      
      // Process each student's attendance
      for (const [studentId, attendance] of Object.entries(attendanceData)) {
        const status = attendance.status;
        const attributes = attendance.attributes || {};
        
        // Calculate fee using the attendance service
        const fee = this.attendanceService.calculateAttendanceFee(status, attributes);
        
        // Add to status totals
        if (status === 'absent') {
          breakdown.byStatus.absent += fee;
          if (breakdown.byStudent[studentId]) {
            breakdown.byStudent[studentId].total += fee;
            breakdown.byStudent[studentId].statusBreakdown.absent += fee;
          }
        } else if (status === 'present') {
          breakdown.byStatus.present += fee;
          if (breakdown.byStudent[studentId]) {
            breakdown.byStudent[studentId].total += fee;
            breakdown.byStudent[studentId].statusBreakdown.present += fee;
          }
          
          // Add attribute fees
          if (attributes.late) {
            breakdown.byAttribute.late += 1;
            if (breakdown.byStudent[studentId]) {
              breakdown.byStudent[studentId].attributeBreakdown.late += 1;
            }
          }
          
          if (attributes.noShoes) {
            breakdown.byAttribute.noShoes += 1;
            if (breakdown.byStudent[studentId]) {
              breakdown.byStudent[studentId].attributeBreakdown.noShoes += 1;
            }
          }
          
          if (attributes.notInUniform) {
            breakdown.byAttribute.notInUniform += 1;
            if (breakdown.byStudent[studentId]) {
              breakdown.byStudent[studentId].attributeBreakdown.notInUniform += 1;
            }
          }
        }
        // No fees for medicalAbsence or holiday
      }
    }
    
    return breakdown;
  }

  /**
   * Break down payments by payment method and student
   * @param {Array} monthlyPayments - Array of payment records
   * @param {Object} studentMap - Map of student IDs to student objects
   * @returns {Object} Breakdown of payments
   */
  calculatePaymentBreakdown(monthlyPayments, studentMap) {
    const breakdown = {
      byMethod: {
        cash: 0,
        card: 0
      },
      byStudent: {}
    };
    
    // Process each payment
    for (const payment of monthlyPayments) {
      const method = payment.paymentMethod;
      const amount = payment.amount || 0;
      const paymentStudentId = payment.studentId;
      
      // Add to method totals
      if (method === 'cash') {
        breakdown.byMethod.cash += amount;
      } else if (method === 'card') {
        breakdown.byMethod.card += amount;
      }
      
      // Add to student totals
      if (!breakdown.byStudent[paymentStudentId]) {
        const student = studentMap[paymentStudentId];
        breakdown.byStudent[paymentStudentId] = {
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          total: 0
        };
      }
      
      breakdown.byStudent[paymentStudentId].total += amount;
    }
    
    return breakdown;
  }

  /**
   * Generate cumulative financial report for all time
   * @returns {Promise<Object>} Cumulative financial report
   */
  async generateCumulativeFinancialReport() {
    try {
      // Get all students
      const students = await this.studentRepository.getAllStudents();
      
      // Calculate total fees charged (from current student balances + all payments)
      let totalOutstandingBalance = 0;
      
      for (const student of students) {
        totalOutstandingBalance += student.balance || 0;
      }
      
      // Get all payments ever made
      const paymentsRef = await this.reportRepository.getAllStudentsFinancialData();
      
      // Calculate total payments received
      const totalPaymentsReceived = paymentsRef.reduce(
        (total, payment) => total + (payment.amount || 0), 
        0
      );
      
      // Total fees charged = current outstanding balance + all payments made
      const totalFeesCharged = totalOutstandingBalance + totalPaymentsReceived;
      
      // Map students to the format needed and sort by name
      const mappedStudents = students.map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        balance: student.balance || 0,
        email: student.email
      }));
      
      // Sort students by name (which is derived from firstName)
      const sortedStudents = sortByName(mappedStudents);
      
      return {
        title: 'Cumulative Financial Report',
        summary: {
          totalFeesCharged,
          totalPaymentsReceived,
          outstandingBalance: totalOutstandingBalance
        },
        studentBalances: sortedStudents
      };
    } catch (error) {
      console.error("Error generating cumulative financial report:", error);
      throw new Error(`Failed to generate cumulative financial report: ${error.message}`);
    }
  }

  /**
   * Generate attendance report for a specific month
   * @param {Date} monthDate - Any date within the month to report on
   * @returns {Promise<Object>} Attendance report with statistics
   */
  async generateMonthlyAttendanceReport(monthDate) {
    try {
      // Get attendance data for the month
      const monthlyAttendance = await this.reportRepository.getMonthlyAttendance(monthDate);
      
      // Get all students for reference
      const students = await this.studentRepository.getAllStudents();
      
      // Calculate total attendance days in the month
      const totalDays = monthlyAttendance.length;
      
      // Initialize attendance statistics
      const attendanceStats = {
        totalDays,
        presentCount: 0,
        absentCount: 0,
        medicalAbsenceCount: 0,
        holidayCount: 0,
        lateCount: 0,
        noShoesCount: 0,
        notInUniformCount: 0,
        attendanceRate: 0,
        byStudent: {}
      };
      
      // Initialize student attendance records
      students.forEach(student => {
        attendanceStats.byStudent[student.id] = {
          studentName: `${student.firstName} ${student.lastName}`,
          present: 0,
          absent: 0,
          medicalAbsence: 0,
          holiday: 0,
          late: 0,
          noShoes: 0,
          notInUniform: 0,
          attendanceRate: 0
        };
      });
      
      // Count total possible student attendance days
      const totalPossibleAttendanceDays = totalDays * students.length;
      
      // Process each attendance day
      for (const attendanceDay of monthlyAttendance) {
        const records = attendanceDay.records;
        
        // Process each student's attendance for this day
        for (const [studentId, attendance] of Object.entries(records)) {
          const status = attendance.status;
          const attributes = attendance.attributes || {};
          
          // Update overall status counts
          if (status === 'present') {
            attendanceStats.presentCount++;
            if (attendanceStats.byStudent[studentId]) {
              attendanceStats.byStudent[studentId].present++;
            }
          } else if (status === 'absent') {
            attendanceStats.absentCount++;
            if (attendanceStats.byStudent[studentId]) {
              attendanceStats.byStudent[studentId].absent++;
            }
          } else if (status === 'medicalAbsence') {
            attendanceStats.medicalAbsenceCount++;
            if (attendanceStats.byStudent[studentId]) {
              attendanceStats.byStudent[studentId].medicalAbsence++;
            }
          } else if (status === 'holiday') {
            attendanceStats.holidayCount++;
            if (attendanceStats.byStudent[studentId]) {
              attendanceStats.byStudent[studentId].holiday++;
            }
          }
          
          // Update attribute counts
          if (attributes.late) {
            attendanceStats.lateCount++;
            if (attendanceStats.byStudent[studentId]) {
              attendanceStats.byStudent[studentId].late++;
            }
          }
          
          if (attributes.noShoes) {
            attendanceStats.noShoesCount++;
            if (attendanceStats.byStudent[studentId]) {
              attendanceStats.byStudent[studentId].noShoes++;
            }
          }
          
          if (attributes.notInUniform) {
            attendanceStats.notInUniformCount++;
            if (attendanceStats.byStudent[studentId]) {
              attendanceStats.byStudent[studentId].notInUniform++;
            }
          }
        }
      }
      
      // Calculate overall attendance rate if there were any attendance days
      if (totalPossibleAttendanceDays > 0) {
        attendanceStats.attendanceRate = (attendanceStats.presentCount / totalPossibleAttendanceDays) * 100;
      }
      
      // Calculate attendance rate for each student
      for (const studentId in attendanceStats.byStudent) {
        const studentStats = attendanceStats.byStudent[studentId];
        if (totalDays > 0) {
          studentStats.attendanceRate = (studentStats.present / totalDays) * 100;
        }
      }
      
      // Format month name for the report title
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const reportDate = new Date(monthDate);
      const monthName = months[reportDate.getMonth()];
      const year = reportDate.getFullYear();
      
      return {
        title: `Attendance Report: ${monthName} ${year}`,
        period: {
          month: reportDate.getMonth(),
          year: reportDate.getFullYear(),
          displayName: `${monthName} ${year}`
        },
        summary: attendanceStats,
        rawData: {
          attendance: monthlyAttendance
        }
      };
    } catch (error) {
      console.error("Error generating monthly attendance report:", error);
      throw new Error(`Failed to generate monthly attendance report: ${error.message}`);
    }
  }

  /**
   * Get detailed financial information for a specific student
   * @param {string} studentId - The student's ID
   * @returns {Promise<Object>} Detailed student financial data
   */
  async getStudentFinancialDetails(studentId) {
    try {
      // Get student profile
      const student = await this.studentRepository.getStudentById(studentId);
      if (!student) {
        throw new Error("Student not found");
      }
      
      // Get student's payment history
      const paymentHistory = await this.reportRepository.getStudentPaymentHistory(studentId);
      
      // Get student's attendance history (for fee calculations)
      const attendanceHistory = await this.reportRepository.getStudentAttendanceHistory(studentId);
      
      // Calculate fees from attendance
      const feeHistory = attendanceHistory.map(record => {
        const fee = this.attendanceService.calculateAttendanceFee(
          record.record.status,
          record.record.attributes || {}
        );
        
        return {
          date: record.date,
          status: record.record.status,
          attributes: record.record.attributes || {},
          fee
        };
      });
      
      // Calculate total fees charged
      const totalFeesCharged = feeHistory.reduce((total, record) => total + record.fee, 0);
      
      // Calculate total payments made
      const totalPaymentsMade = paymentHistory.reduce(
        (total, payment) => total + (payment.amount || 0), 
        0
      );
      
      return {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          balance: student.balance || 0
        },
        financialSummary: {
          totalFeesCharged,
          totalPaymentsMade,
          currentBalance: student.balance || 0
        },
        paymentHistory,
        feeHistory
      };
    } catch (error) {
      console.error("Error getting student financial details:", error);
      throw new Error(`Failed to get student financial details: ${error.message}`);
    }
  }

  /**
   * Get all students with their financial summary for the public dashboard
   * @returns {Promise<Array>} Array of students with financial data
   */
  async getPublicDashboardData() {
    try {
      // Get all students
      const students = await this.studentRepository.getAllStudents();
      
      // Get student financial summaries
      const studentFinancialSummaries = [];
      
      for (const student of students) {
        // Only include active students
        if (student.enrollmentStatus !== 'Removed') {
          const paymentHistory = await this.reportRepository.getStudentPaymentHistory(student.id);
          
          // Calculate total payments made
          const totalPaymentsMade = paymentHistory.reduce(
            (total, payment) => total + (payment.amount || 0), 
            0
          );
          
          studentFinancialSummaries.push({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            enrollmentStatus: student.enrollmentStatus || 'Unknown',
            financialSummary: {
              totalFees: (student.balance || 0) + totalPaymentsMade,
              totalPayments: totalPaymentsMade,
              currentBalance: student.balance || 0
            }
          });
        }
      }
      
      // Sort the summaries by name (derived from firstName)
      return sortByName(studentFinancialSummaries);
    } catch (error) {
      console.error("Error getting public dashboard data:", error);
      throw new Error(`Failed to get public dashboard data: ${error.message}`);
    }
  }
}

// Export a default instance using the real repositories
export const reportService = new ReportService(
  reportRepository,
  studentRepository,
  attendanceRepository,
  attendanceService
);