export class ScheduleParser {
  /**
   * Evaluates a complex text schedule string against a given date (defaults to today)
   * to determine if a reminder should be triggered.
   * 
   * Handles:
   * - Days of week: "sat", "Friday", "sun"
   * - Specific dates every month: "05 AND 20", "25", "1,2"
   * - Explicit Day/Month: "15/7", "31-May"
   */
  static isTodayInSchedule(scheduleStr: string, date: Date = new Date()): boolean {
    if (!scheduleStr || typeof scheduleStr !== 'string') return false;
    
    const str = scheduleStr.toLowerCase().trim();
    
    const dayOfWeekStr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
    const currentDay = date.getDate();
    const currentMonth = date.getMonth() + 1; // 1-12
    
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    // 1. Day of week check
    const dayRegexes = [
      /sun(day)?/, /mon(day)?/, /tue(sday)?/, /wed(nesday)?/, /thu(r(sday)?)?/, /fri(day)?/, /sat(urday)?/
    ];
    if (dayRegexes[date.getDay()].test(str)) {
      return true;
    }

    // 2. Specific Day/Month check (e.g. 15/7 or 31-May)
    const dateMonthRegex = /(\d{1,2})\s*[\/\-]\s*(\d{1,2}|[a-z]{3,})/gi;
    let match;
    let foundDateMonthFormat = false;
    
    while ((match = dateMonthRegex.exec(str)) !== null) {
      foundDateMonthFormat = true;
      const dayPart = parseInt(match[1], 10);
      const monthPartStr = match[2];
      
      let monthPart = parseInt(monthPartStr, 10);
      if (isNaN(monthPart)) {
        // Find month index if string is e.g. "may"
        monthPart = monthNames.findIndex(m => monthPartStr.toLowerCase().startsWith(m)) + 1;
      }
      
      if (dayPart === currentDay && monthPart === currentMonth) {
        return true; // Match found!
      }
    }
    
    // If it was explicitly a DD/MM format and didn't match, we don't automatically fail it 
    // because it might be mixed like "15/7 or sat". We continue.

    // 3. Simple Number Extraction (e.g. "05 AND 20", "25", "1,2")
    // We only rely on this if no explicit DD/MM was found, to prevent "15/7" triggering on the 7th day of a different month
    const numbers = str.match(/\d+/g);
    if (!foundDateMonthFormat && numbers && numbers.length > 0) {
      const parsedNumbers = numbers.map(n => parseInt(n, 10));
      if (parsedNumbers.includes(currentDay)) {
        return true;
      }
    }
    
    return false;
  }
}
