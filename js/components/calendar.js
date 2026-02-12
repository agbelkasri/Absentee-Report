import { getDaysInMonth, getFirstDayOfMonth, isToday, DAYS_SHORT } from '../utils/date.js';

export function renderCalendar(container, year, month, absencesByDay, onDayClick) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const mm = String(month + 1).padStart(2, '0');

  let html = '<div class="calendar-grid">';

  // Day headers
  DAYS_SHORT.forEach(day => {
    html += `<div class="calendar-header">${day}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-cell calendar-cell--empty"></div>';
  }

  // Find max count for heat scaling
  let maxCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const count = absencesByDay[d] || 0;
    if (count > maxCount) maxCount = count;
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${mm}-${String(d).padStart(2, '0')}`;
    const count = absencesByDay[d] || 0;

    // Heat level: 0-5
    let heat = 0;
    if (count > 0 && maxCount > 0) {
      heat = Math.min(5, Math.ceil((count / maxCount) * 5));
    }

    const todayClass = isToday(dateStr) ? 'calendar-cell--today' : '';
    const countClass = count >= 5 ? 'calendar-cell__count--danger' : '';

    html += `
      <div class="calendar-cell calendar-cell--heat-${heat} ${todayClass}" data-date="${dateStr}" title="${count} absence${count !== 1 ? 's' : ''}">
        <span class="calendar-cell__day">${d}</span>
        ${count > 0 ? `<span class="calendar-cell__count ${countClass}">${count}</span>` : ''}
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  // Click handlers
  container.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      if (onDayClick) onDayClick(date);
    });
  });
}
