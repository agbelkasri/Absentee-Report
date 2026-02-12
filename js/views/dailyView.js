import Store from '../store.js';
import { renderStatGrid } from '../components/statsCard.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { today, formatDisplay, addDays, isToday } from '../utils/date.js';

const REASON_LABELS = {
  vacation: 'Vacation', sick: 'Sick', personal: 'Personal',
  family_emergency: 'Family Emergency', jury_duty: 'Jury Duty',
  bereavement: 'Bereavement', other: 'Other'
};

const DURATION_LABELS = {
  full: 'Full Day', half_am: 'Half (AM)', half_pm: 'Half (PM)', custom: 'Custom'
};

let currentDate = today();
let sortCol = 'employeeName';
let sortDir = 'asc';
let storeListener = null;

function getPlantFilter() {
  const el = document.getElementById('global-plant-filter');
  return el ? el.value : 'all';
}

function render(container) {
  const plantId = getPlantFilter();
  const absences = Store.getAbsencesForDate(currentDate, plantId);

  const totalCount = absences.length;
  const plannedCount = absences.filter(a => a.type === 'planned').length;
  const unplannedCount = absences.filter(a => a.type === 'unplanned').length;
  const unplannedRate = totalCount > 0 ? Math.round((unplannedCount / totalCount) * 100) : 0;
  const plants = [...new Set(absences.map(a => a.plantId))].length;

  // Sort absences
  const sorted = [...absences].sort((a, b) => {
    let aVal = a[sortCol] || '';
    let bVal = b[sortCol] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const dateLabel = isToday(currentDate) ? `Today - ${formatDisplay(currentDate)}` : formatDisplay(currentDate);

  container.innerHTML = `
    <div class="report-header">
      <h2 class="report-header__title">Daily Report</h2>
      <div class="report-header__controls">
        <div class="date-nav">
          <button class="date-nav__btn" id="prev-day" aria-label="Previous day">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <input type="date" class="date-nav__input" id="date-picker" value="${currentDate}">
          <button class="date-nav__btn" id="next-day" aria-label="Next day">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <button class="btn btn--ghost btn--sm" id="btn-today" ${isToday(currentDate) ? 'disabled' : ''}>Today</button>
      </div>
    </div>

    ${renderStatGrid([
      { label: 'Total Absences', value: totalCount },
      { label: 'Planned', value: plannedCount },
      { label: 'Unplanned', value: unplannedCount },
      { label: 'Unplanned Rate', value: totalCount > 0 ? `${unplannedRate}%` : '-' },
      { label: 'Plants Affected', value: plants }
    ])}

    ${totalCount === 0 ? renderEmpty() : renderTable(sorted)}
  `;

  // Bind events
  container.querySelector('#prev-day').addEventListener('click', () => {
    currentDate = addDays(currentDate, -1);
    render(container);
  });

  container.querySelector('#next-day').addEventListener('click', () => {
    currentDate = addDays(currentDate, 1);
    render(container);
  });

  container.querySelector('#date-picker').addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = e.target.value;
      render(container);
    }
  });

  container.querySelector('#btn-today').addEventListener('click', () => {
    currentDate = today();
    render(container);
  });

  // Sort headers
  container.querySelectorAll('.data-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortCol === col) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortCol = col;
        sortDir = 'asc';
      }
      render(container);
    });
  });

  // Delete/Edit buttons
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const absence = Store.getAbsenceById(id);
      showModal({
        title: 'Delete Absence',
        body: `<p>Are you sure you want to delete the absence record for <strong>${absence.employeeName}</strong> on <strong>${formatDisplay(absence.date)}</strong>?</p>`,
        confirmLabel: 'Delete',
        danger: true,
        onConfirm: () => {
          Store.deleteAbsence(id);
          showToast('Absence deleted', 'info');
        }
      });
    });
  });

  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `#submit?edit=${btn.dataset.id}`;
    });
  });
}

function renderEmpty() {
  return `
    <div class="card">
      <div class="empty-state">
        <svg class="empty-state__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3 class="empty-state__title">No absences recorded</h3>
        <p class="empty-state__description">There are no absences logged for ${formatDisplay(currentDate)}. Submit a new absence to get started.</p>
        <button class="btn btn--primary" onclick="window.location.hash='#submit'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Submit Absence
        </button>
      </div>
    </div>
  `;
}

function sortIcon(col) {
  if (sortCol !== col) return '<span class="sort-icon">&#8693;</span>';
  return sortDir === 'asc'
    ? '<span class="sort-icon">&#9650;</span>'
    : '<span class="sort-icon">&#9660;</span>';
}

function renderTable(absences) {
  return `
    <div class="card">
      <div class="card__header">
        <span class="card__title">Absence Details</span>
        <span class="text-sm text-muted">${absences.length} record${absences.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th data-sort="employeeName" class="${sortCol === 'employeeName' ? 'sorted' : ''}">Employee ${sortIcon('employeeName')}</th>
              <th data-sort="plantId" class="${sortCol === 'plantId' ? 'sorted' : ''}">Plant ${sortIcon('plantId')}</th>
              <th data-sort="type" class="${sortCol === 'type' ? 'sorted' : ''}">Type ${sortIcon('type')}</th>
              <th data-sort="laborType" class="${sortCol === 'laborType' ? 'sorted' : ''}">Labor ${sortIcon('laborType')}</th>
              <th data-sort="shift" class="${sortCol === 'shift' ? 'sorted' : ''}">Shift ${sortIcon('shift')}</th>
              <th data-sort="reason" class="${sortCol === 'reason' ? 'sorted' : ''}">Reason ${sortIcon('reason')}</th>
              <th>Duration</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${absences.map(a => `
              <tr>
                <td><strong>${escapeHtml(a.employeeName)}</strong></td>
                <td>${escapeHtml(Store.getPlantName(a.plantId))}</td>
                <td><span class="badge badge--${a.type}">${a.type === 'planned' ? 'Planned' : 'Unplanned'}</span></td>
                <td><span class="badge badge--${a.laborType || 'direct'}">${(a.laborType || 'direct') === 'direct' ? 'Direct' : 'Indirect'}</span></td>
                <td><span class="badge badge--${a.shift || '1st'}">${(a.shift || '1st') === '1st' ? '1st' : '2nd'}</span></td>
                <td>${REASON_LABELS[a.reason] || a.reason}</td>
                <td>${DURATION_LABELS[a.duration] || a.duration}${a.duration === 'custom' ? ` (${a.durationHours}h)` : ''}</td>
                <td>
                  <div class="actions-cell">
                    <button class="btn btn--ghost btn--sm btn-edit" data-id="${a.id}" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn btn--ghost btn--sm btn-delete" data-id="${a.id}" title="Delete" style="color: var(--color-danger)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const dailyView = {
  mount(container) {
    currentDate = today();
    render(container);

    storeListener = () => render(container);
    document.addEventListener('store:changed', storeListener);

    // Listen for global plant filter changes
    const plantFilter = document.getElementById('global-plant-filter');
    if (plantFilter) {
      plantFilter._dailyHandler = () => render(container);
      plantFilter.addEventListener('change', plantFilter._dailyHandler);
    }
  },

  unmount() {
    if (storeListener) {
      document.removeEventListener('store:changed', storeListener);
      storeListener = null;
    }
    const plantFilter = document.getElementById('global-plant-filter');
    if (plantFilter && plantFilter._dailyHandler) {
      plantFilter.removeEventListener('change', plantFilter._dailyHandler);
      delete plantFilter._dailyHandler;
    }
  }
};

export default dailyView;
