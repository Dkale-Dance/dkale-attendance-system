import { reportRepository } from "../repository/ReportRepository";
import { studentRepository } from "../repository/StudentRepository";
import { attendanceRepository } from "../repository/AttendanceRepository";
import { attendanceService } from "../services/AttendanceService";
import { sortByName } from "../utils/sorting";

// Utility function to format currency values
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

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
   * Generate detailed financial report for a specific month with comprehensive breakdown
   * @param {Date} monthDate - Any date within the month to report on
   * @returns {Promise<Object>} Detailed financial report with fee categorization and student breakdown
   */
  async generateDetailedMonthlyFinancialReport(monthDate) {
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
      
      // Initialize counters and breakdowns
      let totalFeesCharged = 0;
      let feesCollected = 0;
      let pendingFees = 0;
      let feesInPaymentProcess = 0;
      
      // Fee type breakdown
      const feeBreakdown = {
        byType: {
          absence: 0,
          late: 0,
          noShoes: 0,
          notInUniform: 0
        }
      };
      
      // Student details with fees charged and payments
      const studentDetails = [];
      const studentFees = {};
      const studentPayments = {};
      
      // Calculate fees for each student
      if (monthlyAttendance && Array.isArray(monthlyAttendance)) {
        for (const attendanceDay of monthlyAttendance) {
          if (!attendanceDay || !attendanceDay.data) continue;
          
          const attendanceData = attendanceDay.data;
          
          for (const [studentId, attendance] of Object.entries(attendanceData)) {
          const status = attendance.status;
          const attributes = attendance.attributes || {};
          
          // Calculate fee
          const fee = this.attendanceService.calculateAttendanceFee(status, attributes);
          totalFeesCharged += fee;
          
          // Initialize student fee record if needed
          if (!studentFees[studentId]) {
            studentFees[studentId] = {
              totalFee: 0,
              feeBreakdown: {
                absence: 0,
                late: 0,
                noShoes: 0,
                notInUniform: 0
              }
            };
          }
          
          // Add to student's total fee
          studentFees[studentId].totalFee += fee;
          
          // Add to fee type breakdowns
          if (status === 'absent') {
            feeBreakdown.byType.absence += fee;
            studentFees[studentId].feeBreakdown.absence += fee;
          }
          
          if (attributes.late) {
            feeBreakdown.byType.late += 1;
            studentFees[studentId].feeBreakdown.late += 1;
          }
          
          if (attributes.noShoes) {
            feeBreakdown.byType.noShoes += 1;
            studentFees[studentId].feeBreakdown.noShoes += 1;
          }
          
          if (attributes.notInUniform) {
            feeBreakdown.byType.notInUniform += 1;
            studentFees[studentId].feeBreakdown.notInUniform += 1;
          }
        }
      }
      }
      
      // Calculate payments for each student
      const totalPaymentsReceived = monthlyPayments && Array.isArray(monthlyPayments) ?
        monthlyPayments.reduce((total, payment) => {
          const studentId = payment.studentId;
          const amount = payment.amount || 0;
        
        // Initialize student payment record if needed
        if (!studentPayments[studentId]) {
          studentPayments[studentId] = 0;
        }
        
        // Add to student's total payment
        studentPayments[studentId] += amount;
        
        return total + amount;
      }, 0) : 0;
      
      // Combine fee and payment data for each student
      for (const studentId of new Set([...Object.keys(studentFees), ...Object.keys(studentPayments)])) {
        const student = studentMap[studentId];
        if (!student) continue; // Skip if student not found
        
        const feesCharged = studentFees[studentId]?.totalFee || 0;
        const paymentsMade = studentPayments[studentId] || 0;
        
        // Determine payment status
        let paymentStatus = 'none';
        if (feesCharged > 0) {
          if (paymentsMade >= feesCharged) {
            paymentStatus = 'paid';
            feesCollected += feesCharged;
          } else if (paymentsMade > 0) {
            paymentStatus = 'partial';
            feesCollected += paymentsMade;
            feesInPaymentProcess += (feesCharged - paymentsMade);
          } else {
            paymentStatus = 'pending';
            pendingFees += feesCharged;
          }
        }
        
        studentDetails.push({
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          feesCharged,
          paymentsMade,
          balance: feesCharged - paymentsMade,
          paymentStatus,
          feeBreakdown: studentFees[studentId]?.feeBreakdown || {
            absence: 0,
            late: 0,
            noShoes: 0,
            notInUniform: 0
          }
        });
      }
      
      // Sort students by name
      studentDetails.sort((a, b) => a.name.localeCompare(b.name));
      
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
          feesCollected,
          pendingFees,
          feesInPaymentProcess
        },
        feeBreakdown,
        studentDetails,
        rawData: {
          attendance: monthlyAttendance,
          payments: monthlyPayments
        }
      };
    } catch (error) {
      console.error("Error generating detailed monthly financial report:", error);
      throw new Error(`Failed to generate detailed monthly financial report: ${error.message}`);
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
   * Generate comprehensive cumulative financial report with optional date range filter
   * @param {Object} options - Options for report generation
   * @param {Date} options.startDate - Start date for the report (optional)
   * @param {Date} options.endDate - End date for the report (optional)
   * @returns {Promise<Object>} Comprehensive cumulative financial report
   */
  async generateCumulativeFinancialReport(options = {}) {
    try {
      // Set date range (default to current year if not provided)
      const now = new Date();
      const startDate = options.startDate || new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
      const endDate = options.endDate || new Date(now.getFullYear(), 11, 31); // Dec 31 of current year
      
      // Helper function to format month date - used in other methods
      // const getMonthDate = (year, month) => new Date(year, month, 15);
      
      // Get all months in the date range
      const months = [];
      let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      while (currentDate <= endDate) {
        months.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Get monthly reports for each month in the range
      const monthlyReports = [];
      for (const monthDate of months) {
        const monthlyReport = await this.generateDetailedMonthlyFinancialReport(monthDate);
        monthlyReports.push(monthlyReport);
      }
      
      // Get all payments in the date range for YTD calculations
      const payments = await this.reportRepository.getPaymentsByDateRange(startDate, endDate);
      const totalPaymentsInRange = payments && Array.isArray(payments) ? 
        payments.reduce((total, payment) => total + (payment.amount || 0), 0) : 0;
      
      // Calculate totals across all months
      const totals = {
        totalFeesCharged: monthlyReports.reduce((sum, report) => sum + report.summary.totalFeesCharged, 0),
        totalPaymentsReceived: monthlyReports.reduce((sum, report) => sum + report.summary.totalPaymentsReceived, 0),
        feesCollected: monthlyReports.reduce((sum, report) => sum + report.summary.feesCollected, 0),
        pendingFees: monthlyReports.reduce((sum, report) => sum + report.summary.pendingFees, 0),
        feesInPaymentProcess: monthlyReports.reduce((sum, report) => sum + report.summary.feesInPaymentProcess, 0)
      };
      
      // Calculate fee breakdown totals
      const feeBreakdown = {
        absence: monthlyReports.reduce((sum, report) => sum + report.feeBreakdown.byType.absence, 0),
        late: monthlyReports.reduce((sum, report) => sum + report.feeBreakdown.byType.late, 0),
        noShoes: monthlyReports.reduce((sum, report) => sum + report.feeBreakdown.byType.noShoes, 0),
        notInUniform: monthlyReports.reduce((sum, report) => sum + report.feeBreakdown.byType.notInUniform, 0)
      };
      
      // Create year-to-date summary
      const yearToDate = {
        year: startDate.getFullYear(),
        totalFeesCharged: totals.totalFeesCharged,
        totalPaymentsReceived: totalPaymentsInRange, // Use all payments in range for accuracy
        collectionRate: totals.totalFeesCharged > 0 
          ? (totals.feesCollected / totals.totalFeesCharged) * 100 
          : 0
      };
      
      // Create report title based on date range
      let title;
      if (months.length === 1) {
        title = `Cumulative Financial Report: ${monthlyReports[0].period.displayName}`;
      } else {
        const startMonth = new Date(startDate).toLocaleString('default', { month: 'long' });
        const endMonth = new Date(endDate).toLocaleString('default', { month: 'long' });
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        
        if (startYear === endYear) {
          title = `Cumulative Financial Report: ${startMonth} ${startYear} - ${endMonth} ${endYear}`;
        } else {
          title = `Cumulative Financial Report: ${startMonth} ${startYear} - ${endMonth} ${endYear}`;
        }
      }
      
      return {
        title,
        dateRange: {
          startDate,
          endDate
        },
        monthlyReports,
        totals,
        feeBreakdown,
        yearToDate,
        summary: totals // Add summary field to match test expectations
      };
    } catch (error) {
      console.error("Error generating comprehensive cumulative financial report:", error);
      throw new Error(`Failed to generate comprehensive cumulative financial report: ${error.message}`);
    }
  }
  
  /**
   * Format financial report data for export in various formats
   * @param {Date} monthDate - Date within the month to export
   * @param {string} format - Export format ('pdf', 'csv', or 'excel')
   * @returns {Promise<Object>} Formatted data for export
   */
  async formatReportForExport(monthDate, format) {
    try {
      // Get the report data
      const report = await this.generateDetailedMonthlyFinancialReport(monthDate);
      
      if (format === 'pdf') {
        // Format data for PDF export
        return {
          title: report.title,
          format: 'pdf',
          data: {
            summary: report.summary,
            feeBreakdown: report.feeBreakdown,
            studentDetails: report.studentDetails
          }
        };
      } else if (format === 'csv' || format === 'excel') {
        // Format data for CSV/Excel export
        // Create headers and rows for tabular format
        const headers = [
          'Student Name', 
          'Email', 
          'Fees Charged', 
          'Payments Made', 
          'Balance', 
          'Payment Status',
          'Absence Fees',
          'Late Fees',
          'No Shoes Fees',
          'Not In Uniform Fees'
        ];
        
        const rows = report.studentDetails.map(student => [
          student.name,
          student.email,
          student.feesCharged,
          student.paymentsMade,
          student.balance,
          student.paymentStatus,
          student.feeBreakdown ? student.feeBreakdown.absence : 0,
          student.feeBreakdown ? student.feeBreakdown.late : 0,
          student.feeBreakdown ? student.feeBreakdown.noShoes : 0,
          student.feeBreakdown ? student.feeBreakdown.notInUniform : 0
        ]);
        
        // Add summary row
        rows.push([
          'TOTAL',
          '',
          report.summary.totalFeesCharged,
          report.summary.totalPaymentsReceived,
          report.summary.pendingFees + report.summary.feesInPaymentProcess,
          '',
          report.feeBreakdown.byType.absence,
          report.feeBreakdown.byType.late,
          report.feeBreakdown.byType.noShoes,
          report.feeBreakdown.byType.notInUniform
        ]);
        
        return {
          title: report.title,
          format: format,
          data: {
            headers,
            rows
          }
        };
      }
      
      throw new Error(`Unsupported export format: ${format}`);
    } catch (error) {
      console.error(`Error formatting report for export (${format}):`, error);
      throw new Error(`Failed to format report for export: ${error.message}`);
    }
  }
  
  /**
   * Get data formatted for visualization charts and graphs
   * @param {Object} dateRange - Date range for visualization
   * @param {Date} dateRange.startDate - Start date
   * @param {Date} dateRange.endDate - End date
   * @returns {Promise<Object>} Data formatted for various chart types
   */
  async getDataForVisualization(dateRange = {}) {
    try {
      // Get cumulative report for the date range
      const report = await this.generateCumulativeFinancialReport(dateRange);
      
      // Format data for month-to-month trend chart
      const trends = {
        labels: report.monthlyReports.map(month => month.period.displayName),
        feesCharged: report.monthlyReports.map(month => month.summary.totalFeesCharged),
        paymentsReceived: report.monthlyReports.map(month => month.summary.totalPaymentsReceived)
      };
      
      // Format data for payment status distribution pie chart
      const distribution = {
        labels: ['Collected', 'Pending', 'In Process'],
        data: [
          report.totals.feesCollected,
          report.totals.pendingFees,
          report.totals.feesInPaymentProcess
        ]
      };
      
      // Format data for fee type breakdown bar chart
      const feeBreakdown = {
        labels: ['Absence', 'Late', 'No Shoes', 'Not in Uniform'],
        data: [
          report.feeBreakdown ? report.feeBreakdown.absence : 0,
          report.feeBreakdown ? report.feeBreakdown.late : 0,
          report.feeBreakdown ? report.feeBreakdown.noShoes : 0,
          report.feeBreakdown ? report.feeBreakdown.notInUniform : 0
        ]
      };
      
      // Calculate collection rate percentage over time
      const collectionRate = {
        labels: report.monthlyReports.map(month => month.period.displayName),
        data: report.monthlyReports.map(month => {
          const total = month.summary.totalFeesCharged;
          return total > 0 
            ? Math.round((month.summary.feesCollected / total) * 100) 
            : 0;
        })
      };
      
      return {
        trends,
        distribution,
        feeBreakdown,
        collectionRate
      };
    } catch (error) {
      console.error("Error getting data for visualization:", error);
      throw new Error(`Failed to get data for visualization: ${error.message}`);
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