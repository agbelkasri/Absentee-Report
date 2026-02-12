const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function today() {
  return formatISO(new Date());
}

export function formatISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
}

export function formatMonthYear(year, month) {
  return `${MONTHS[month]} ${year}`;
}

export function getMonthName(month) {
  return MONTHS[month];
}

export function getMonthShort(month) {
  return MONTHS_SHORT[month];
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export function getDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return DAYS[d.getDay()];
}

export function getDayOfWeekShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return DAYS_SHORT[d.getDay()];
}

export function getDayOfWeekIndex(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDay();
}

export function getMonthRange(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  return { start, end };
}

export function addMonths(year, month, delta) {
  let m = month + delta;
  let y = year;
  while (m > 11) { m -= 12; y++; }
  while (m < 0) { m += 12; y--; }
  return { year: y, month: m };
}

export function addDays(dateStr, delta) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return formatISO(d);
}

export function isSameDay(a, b) {
  return a === b;
}

export function isToday(dateStr) {
  return dateStr === today();
}

export function isWeekend(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function getWorkingDaysInMonth(year, month) {
  const days = getDaysInMonth(year, month);
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (!isWeekend(dateStr)) count++;
  }
  return count;
}

export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month: month - 1, day };
}

export { DAYS_SHORT };
