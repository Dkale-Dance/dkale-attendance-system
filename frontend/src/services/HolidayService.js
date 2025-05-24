import { parseDateString } from '../utils/DateUtils';

export default class HolidayService {
  constructor() {
    this.fixedHolidays = [
      { month: 0, day: 1, name: "New Year's Day" },
      { month: 6, day: 4, name: 'Independence Day' },
      { month: 10, day: 11, name: 'Veterans Day' },
      { month: 11, day: 25, name: 'Christmas Day' }
    ];
    
    // Specific year holidays (can be added manually by admin)
    this.specificYearHolidays = [];
  }

  normalizeDate(date) {
    if (!date) return null;
    
    if (typeof date === 'string') {
      const parsed = parseDateString(date);
      if (!parsed) return null;
      return parsed;
    }
    
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return null;
      return date;
    }
    
    return null;
  }

  getNthWeekdayOfMonth(year, month, weekday, n) {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysToAdd = (weekday - firstWeekday + 7) % 7;
    const firstOccurrence = 1 + daysToAdd;
    const targetDate = firstOccurrence + (n - 1) * 7;
    return new Date(year, month, targetDate);
  }

  getLastWeekdayOfMonth(year, month, weekday) {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const daysToSubtract = (lastWeekday - weekday + 7) % 7;
    const targetDate = lastDay.getDate() - daysToSubtract;
    return new Date(year, month, targetDate);
  }

  getMovingHolidays(year) {
    return [
      {
        date: this.getNthWeekdayOfMonth(year, 0, 1, 3),
        name: 'Martin Luther King Jr. Day'
      },
      {
        date: this.getNthWeekdayOfMonth(year, 1, 1, 3),
        name: 'Presidents Day'
      },
      {
        date: this.getLastWeekdayOfMonth(year, 4, 1),
        name: 'Memorial Day'
      },
      {
        date: this.getNthWeekdayOfMonth(year, 8, 1, 1),
        name: 'Labor Day'
      },
      {
        date: this.getNthWeekdayOfMonth(year, 9, 1, 2),
        name: 'Columbus Day'
      },
      {
        date: this.getNthWeekdayOfMonth(year, 10, 4, 4),
        name: 'Thanksgiving'
      }
    ];
  }

  isHoliday(date) {
    const normalizedDate = this.normalizeDate(date);
    if (!normalizedDate) return false;

    const year = normalizedDate.getFullYear();
    const month = normalizedDate.getMonth();
    const day = normalizedDate.getDate();

    // Check fixed holidays (yearly)
    for (const holiday of this.fixedHolidays) {
      if (holiday.month === month && holiday.day === day) {
        return true;
      }
    }

    // Check specific year holidays
    for (const holiday of this.specificYearHolidays) {
      if (holiday.year === year && holiday.month === month && holiday.day === day) {
        return true;
      }
    }

    // Check moving holidays
    const movingHolidays = this.getMovingHolidays(year);
    for (const holiday of movingHolidays) {
      const holidayDate = holiday.date;
      if (holidayDate.getMonth() === month && holidayDate.getDate() === day) {
        return true;
      }
    }

    return false;
  }

  getHolidayName(date) {
    const normalizedDate = this.normalizeDate(date);
    if (!normalizedDate) return null;

    const year = normalizedDate.getFullYear();
    const month = normalizedDate.getMonth();
    const day = normalizedDate.getDate();

    // Check fixed holidays (yearly)
    for (const holiday of this.fixedHolidays) {
      if (holiday.month === month && holiday.day === day) {
        return holiday.name;
      }
    }

    // Check specific year holidays
    for (const holiday of this.specificYearHolidays) {
      if (holiday.year === year && holiday.month === month && holiday.day === day) {
        return holiday.name;
      }
    }

    // Check moving holidays
    const movingHolidays = this.getMovingHolidays(year);
    for (const holiday of movingHolidays) {
      const holidayDate = holiday.date;
      if (holidayDate.getMonth() === month && holidayDate.getDate() === day) {
        return holiday.name;
      }
    }

    return null;
  }

  shouldChargeFees(date) {
    return !this.isHoliday(date);
  }

  addSpecificHoliday(year, month, day, name) {
    const existingIndex = this.specificYearHolidays.findIndex(
      h => h.year === year && h.month === month && h.day === day
    );
    
    if (existingIndex >= 0) {
      this.specificYearHolidays[existingIndex].name = name;
    } else {
      this.specificYearHolidays.push({ year, month, day, name });
    }
  }

  removeSpecificHoliday(year, month, day) {
    this.specificYearHolidays = this.specificYearHolidays.filter(
      h => !(h.year === year && h.month === month && h.day === day)
    );
  }

  getSpecificHolidays() {
    return [...this.specificYearHolidays];
  }
}

export const holidayService = new HolidayService();