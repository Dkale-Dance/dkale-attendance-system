export class DateService {
  static FEE_YEAR_START_MONTH = 7; // August (0-indexed)
  static FEE_YEAR_START_DAY = 13;
  
  static MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  calculateFeeYearStartDate(currentDate = new Date()) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    // If we're before August 13th of the current year, the current fee year started last year
    // If we're on or after August 13th, the current fee year started this year
    if (currentMonth < DateService.FEE_YEAR_START_MONTH || 
        (currentMonth === DateService.FEE_YEAR_START_MONTH && currentDay < DateService.FEE_YEAR_START_DAY)) {
      // Before August 13, so current fee year started last year
      return new Date(currentYear - 1, DateService.FEE_YEAR_START_MONTH, DateService.FEE_YEAR_START_DAY);
    } else {
      // On or after August 13, so current fee year started this year
      return new Date(currentYear, DateService.FEE_YEAR_START_MONTH, DateService.FEE_YEAR_START_DAY);
    }
  }

  getFeeYearEndDate(currentDate = new Date()) {
    const startDate = this.calculateFeeYearStartDate(currentDate);
    const endYear = startDate.getFullYear() + 1;
    
    // End date is August 12th of the following year (day before August 13)
    return new Date(endYear, DateService.FEE_YEAR_START_MONTH, DateService.FEE_YEAR_START_DAY - 1);
  }

  getFeeYearDateRange(currentDate = new Date()) {
    return {
      startDate: this.calculateFeeYearStartDate(currentDate),
      endDate: this.getFeeYearEndDate(currentDate)
    };
  }

  isWithinCurrentFeeYear(testDate, currentDate = new Date()) {
    const { startDate, endDate } = this.getFeeYearDateRange(currentDate);
    return testDate >= startDate && testDate <= endDate;
  }

  getFeeYearPeriodString(currentDate = new Date()) {
    const startDate = this.calculateFeeYearStartDate(currentDate);
    const startYear = startDate.getFullYear();
    
    // Format as "August 2024 - Current" or "August 2025 - Current" based on fee year
    const startMonth = DateService.MONTHS[DateService.FEE_YEAR_START_MONTH];
    return `${startMonth} ${startYear} - Current`;
  }
}

export const dateService = new DateService();