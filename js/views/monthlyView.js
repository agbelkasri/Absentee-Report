import Store from '../store.js';
import { renderStatGrid } from '../components/statsCard.js';
import { renderCalendar } from '../components/calendar.js';
import { renderBarChart, renderDonutChart, renderLineChart, COLORS } from '../components/charts.js';
import { showDetailModal } from '../components/modal.js';
import { exportToCSV } from '../utils/csv.js';
import {
  formatMonthYear, formatDisplay, getDaysInMonth, addMonths,
  getWorkingDaysInMonth, getMonthShort, getDayOfWeekIndex, DAYS_SHORT
} from '../utils/date.js';

const REASON_LABELS = {
  vacation: 'Vacation', sick: 'Sick', personal: 'Personal',
  family_emergency: 'Family Emergency', jury_duty: 'Jury Duty',
  bereavement: 'Bereavement', other: 'Other'
};

const REASON_COLORS = {
  vacation: '#2563eb', sick: '#ef4444', personal: '#f59e0b',
  family_emergency: '#8b5cf6', jury_duty: '#06b6d4',
  bereavement: '#64748b', other: '#ec4899'
};

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let storeListener = null;

function getPlantFilter() {
  const el = document.getElementById('global-plant-filter');
  return el ? el.value : 'all';
}

function render(container) {
  const plantId = getPlantFilter();
  const absences = Store.getAbsencesForMonth(currentYear, currentMonth, plantId);
  const prevMonth = addMonths(currentYear, currentMonth, -1);
  const prevAbsences = Store.getAbsencesForMonth(prevMonth.year, prevMonth.month, plantId);

  // Stats
  const total = absences.length;
  const planned = absences.filter(a => a.type === 'planned').length;
  const unplanned = absences.filter(a => a.type === 'unplanned').length;
  const plannedPct = total > 0 ? Math.round((planned / total) * 100) : 0;
  const workingDays = getWorkingDaysInMonth(currentYear, currentMonth);
  const avgPerDay = workingDays > 0 ? (total / workingDays).toFixed(1) : '0';

  // Peak day
  const dayCounts = {};
  absences.forEach(a => {
    const day = parseInt(a.date.split('-')[2]);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  let peakDay = '-';
  let peakCount = 0;
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > peakCount) { peakDay = day; peakCount = count; }
  });
  const mm = String(currentMonth + 1).padStart(2, '0');
  const peakDateStr = peakCount > 0 ? `${getMonthShort(currentMonth)} ${peakDay} (${peakCount})` : '-';

  // Most common reason
  const reasonCounts = {};
  absences.forEach(a => {
    reasonCounts[a.reason] = (reasonCounts[a.reason] || 0) + 1;
  });
  let topReason = '-';
  let topReasonCount = 0;
  Object.entries(reasonCounts).forEach(([reason, count]) => {
    if (count > topReasonCount) { topReason = reason; topReasonCount = count; }
  });

  // Month over month
  const prevTotal = prevAbsences.length;
  let momChange = '-';
  let momDirection = 'neutral';
  if (prevTotal > 0) {
    const pct = Math.round(((total - prevTotal) / prevTotal) * 100);
    momChange = `${pct > 0 ? '+' : ''}${pct}% vs last month`;
    momDirection = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';
  } else if (total > 0) {
    momChange = 'No prior data';
  }

  container.innerHTML = `
    <div class="report-header">
      <h2 class="report-header__title">Monthly Report</h2>
      <div class="report-header__controls">
        <div class="date-nav">
          <button class="date-nav__btn" id="prev-month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span class="date-nav__label" id="month-label">${formatMonthYear(currentYear, currentMonth)}</span>
          <button class="date-nav__btn" id="next-month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <button class="btn btn--outline btn--sm" id="btn-export">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>
    </div>

    ${renderStatGrid([
      { label: 'Total Absences', value: total, trend: momChange, trendDirection: momDirection },
      { label: 'Planned', value: planned },
      { label: 'Unplanned', value: unplanned },
      { label: 'Avg / Working Day', value: avgPerDay },
      { label: 'Peak Day', value: peakDateStr },
      { label: 'Top Reason', value: REASON_LABELS[topReason] || topReason }
    ])}

    <div class="card mb-lg">
      <div class="card__header">
        <span class="card__title">Absence Calendar</span>
        <span class="text-sm text-muted">Click a day for details</span>
      </div>
      <div class="card__body" id="calendar-container"></div>
    </div>

    <div class="card mb-lg">
      <div class="card__header">
        <span class="card__title">Planned vs Unplanned</span>
      </div>
      <div class="card__body">
        <div class="progress-ring-wrapper">
          <canvas id="type-donut" width="180" height="180"></canvas>
          <div class="progress-ring__legend">
            <div class="legend-item">
              <span class="legend-dot legend-dot--planned"></span>
              <span>Planned: ${planned} (${plannedPct}%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot legend-dot--unplanned"></span>
              <span>Unplanned: ${unplanned} (${total > 0 ? 100 - plannedPct : 0}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card chart-card">
        <div class="card__header">
          <span class="card__title">Daily Absences</span>
        </div>
        <div class="card__body chart-container">
          <canvas id="daily-bar-chart"></canvas>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card__header">
          <span class="card__title">By Reason</span>
        </div>
        <div class="card__body" style="display: flex; justify-content: center; align-items: center; flex-direction: column; gap: var(--space-base);">
          <canvas id="reason-donut" width="180" height="180"></canvas>
          <div id="reason-legend" style="display: flex; flex-wrap: wrap; gap: var(--space-sm) var(--space-base); justify-content: center;"></div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card chart-card">
        <div class="card__header">
          <span class="card__title">Day of Week Distribution</span>
        </div>
        <div class="card__body">
          <div id="dow-chart" class="dow-chart"></div>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card__header">
          <span class="card__title">By Plant</span>
        </div>
        <div class="card__body">
          <div id="plant-bars"></div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card chart-card">
        <div class="card__header">
          <span class="card__title">6-Month Trend</span>
        </div>
        <div class="card__body chart-container">
          <canvas id="trend-line-chart"></canvas>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card__header">
          <span class="card__title">Top Absentees</span>
        </div>
        <div class="card__body">
          <div id="top-absentees"></div>
        </div>
      </div>
    </div>
  `;

  // Bind navigation
  container.querySelector('#prev-month').addEventListener('click', () => {
    const prev = addMonths(currentYear, currentMonth, -1);
    currentYear = prev.year;
    currentMonth = prev.month;
    render(container);
  });

  container.querySelector('#next-month').addEventListener('click', () => {
    const next = addMonths(currentYear, currentMonth, 1);
    currentYear = next.year;
    currentMonth = next.month;
    render(container);
  });

  container.querySelector('#btn-export').addEventListener('click', () => {
    const filename = `absences-${currentYear}-${mm}.csv`;
    exportToCSV(absences, Store.getPlants(), filename);
  });

  // Render calendar
  const calendarContainer = container.querySelector('#calendar-container');
  renderCalendar(calendarContainer, currentYear, currentMonth, dayCounts, (dateStr) => {
    const dayAbsences = absences.filter(a => a.date === dateStr);
    if (dayAbsences.length === 0) return;

    const bodyHtml = `
      <div style="margin-top: var(--space-sm);">
        ${dayAbsences.map(a => `
          <div style="padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-border);">
            <strong>${escapeHtml(a.employeeName)}</strong>
            <span class="badge badge--${a.type}" style="margin-left: var(--space-sm);">${a.type === 'planned' ? 'Planned' : 'Unplanned'}</span>
            <div class="text-sm text-muted" style="margin-top: 2px;">
              ${REASON_LABELS[a.reason] || a.reason} &middot; ${Store.getPlantName(a.plantId)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    showDetailModal({ title: `Absences on ${formatDisplay(dateStr)}`, bodyHtml });
  });

  // Render donut charts
  renderDonutChart(container.querySelector('#type-donut'), [
    { value: planned, color: COLORS.planned },
    { value: unplanned, color: COLORS.unplanned }
  ], { size: 180, lineWidth: 28, centerText: String(total) });

  // Reason donut
  const reasonSegments = Object.entries(reasonCounts).map(([reason, count]) => ({
    label: REASON_LABELS[reason] || reason,
    value: count,
    color: REASON_COLORS[reason] || '#94a3b8'
  }));
  renderDonutChart(container.querySelector('#reason-donut'), reasonSegments, {
    size: 180, lineWidth: 28, centerText: String(total)
  });

  // Reason legend
  const legendContainer = container.querySelector('#reason-legend');
  legendContainer.innerHTML = reasonSegments.map(s =>
    `<div class="legend-item"><span class="legend-dot" style="background:${s.color}"></span><span class="text-xs">${s.label}: ${s.value}</span></div>`
  ).join('');

  // Daily bar chart
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const barData = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${mm}-${String(d).padStart(2, '0')}`;
    const dayAbs = absences.filter(a => a.date === dateStr);
    const p = dayAbs.filter(a => a.type === 'planned').length;
    const u = dayAbs.filter(a => a.type === 'unplanned').length;
    barData.push({
      label: d % 5 === 1 || d === daysInMonth ? String(d) : '',
      segments: [
        { value: p, color: COLORS.planned },
        { value: u, color: COLORS.unplanned }
      ]
    });
  }
  const barCanvas = container.querySelector('#daily-bar-chart');
  renderBarChart(barCanvas, barData, {
    stacked: true,
    showValues: false,
    height: 200
  });

  // Day of week chart
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  absences.forEach(a => {
    const idx = getDayOfWeekIndex(a.date);
    dowCounts[idx]++;
  });
  const maxDow = Math.max(...dowCounts, 1);
  const peakDow = dowCounts.indexOf(Math.max(...dowCounts));
  const dowContainer = container.querySelector('#dow-chart');
  dowContainer.innerHTML = DAYS_SHORT.map((day, i) => `
    <div class="dow-bar-wrapper">
      <span class="dow-value">${dowCounts[i]}</span>
      <div class="dow-bar ${i === peakDow && dowCounts[i] > 0 ? 'dow-bar--highlight' : ''}" style="height: ${(dowCounts[i] / maxDow) * 100}%"></div>
      <span class="dow-label">${day}</span>
    </div>
  `).join('');

  // Plant bars
  const plantCounts = {};
  absences.forEach(a => {
    plantCounts[a.plantId] = (plantCounts[a.plantId] || 0) + 1;
  });
  const plants = Store.getPlants();
  const maxPlantCount = Math.max(...Object.values(plantCounts), 1);
  const plantBarsContainer = container.querySelector('#plant-bars');

  if (Object.keys(plantCounts).length === 0) {
    plantBarsContainer.innerHTML = '<div class="text-sm text-muted text-center">No data</div>';
  } else {
    plantBarsContainer.innerHTML = `<div class="h-bar-chart">${
      plants
        .filter(p => plantCounts[p.id])
        .sort((a, b) => (plantCounts[b.id] || 0) - (plantCounts[a.id] || 0))
        .map(p => {
          const count = plantCounts[p.id] || 0;
          const pct = (count / maxPlantCount) * 100;
          return `
            <div class="h-bar-row">
              <span class="h-bar-label">${escapeHtml(p.name)}</span>
              <div class="h-bar-track">
                <div class="h-bar-fill h-bar-fill--planned" style="width: ${pct}%">${count}</div>
              </div>
            </div>
          `;
        }).join('')
    }</div>`;
  }

  // 6-month trend line chart
  const trendLabels = [];
  const trendPlanned = [];
  const trendUnplanned = [];
  for (let i = 5; i >= 0; i--) {
    const m = addMonths(currentYear, currentMonth, -i);
    trendLabels.push(getMonthShort(m.month));
    const mAbs = Store.getAbsencesForMonth(m.year, m.month, plantId);
    trendPlanned.push(mAbs.filter(a => a.type === 'planned').length);
    trendUnplanned.push(mAbs.filter(a => a.type === 'unplanned').length);
  }
  const trendCanvas = container.querySelector('#trend-line-chart');
  renderLineChart(trendCanvas, [
    { data: trendPlanned, color: COLORS.planned, fill: true, fillColor: COLORS.planned + '15' },
    { data: trendUnplanned, color: COLORS.unplanned, fill: true, fillColor: COLORS.unplanned + '15' }
  ], { labels: trendLabels, height: 200 });

  // Top absentees
  const empCounts = {};
  absences.forEach(a => {
    empCounts[a.employeeName] = (empCounts[a.employeeName] || 0) + 1;
  });
  const topEmps = Object.entries(empCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topContainer = container.querySelector('#top-absentees');
  if (topEmps.length === 0) {
    topContainer.innerHTML = '<div class="text-sm text-muted text-center">No data</div>';
  } else {
    topContainer.innerHTML = `<div class="top-list">${
      topEmps.map(([name, count], i) => `
        <div class="top-list-item">
          <span class="top-list-item__rank">${i + 1}.</span>
          <span class="top-list-item__name">${escapeHtml(name)}</span>
          <span class="top-list-item__value">${count} absence${count > 1 ? 's' : ''}</span>
        </div>
      `).join('')
    }</div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const monthlyView = {
  mount(container) {
    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth();
    render(container);

    storeListener = () => render(container);
    document.addEventListener('store:changed', storeListener);

    const plantFilter = document.getElementById('global-plant-filter');
    if (plantFilter) {
      plantFilter._monthlyHandler = () => render(container);
      plantFilter.addEventListener('change', plantFilter._monthlyHandler);
    }
  },

  unmount() {
    if (storeListener) {
      document.removeEventListener('store:changed', storeListener);
      storeListener = null;
    }
    const plantFilter = document.getElementById('global-plant-filter');
    if (plantFilter && plantFilter._monthlyHandler) {
      plantFilter.removeEventListener('change', plantFilter._monthlyHandler);
      delete plantFilter._monthlyHandler;
    }
  }
};

export default monthlyView;
