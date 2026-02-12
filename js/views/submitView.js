import Store from '../store.js';
import { showToast } from '../components/toast.js';
import { today } from '../utils/date.js';

const REASONS = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'sick', label: 'Sick' },
  { value: 'personal', label: 'Personal' },
  { value: 'family_emergency', label: 'Family Emergency' },
  { value: 'jury_duty', label: 'Jury Duty' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'other', label: 'Other' }
];

const DURATIONS = [
  { value: 'full', label: 'Full Day (8 hrs)', hours: 8 },
  { value: 'half_am', label: 'Half Day - Morning (4 hrs)', hours: 4 },
  { value: 'half_pm', label: 'Half Day - Afternoon (4 hrs)', hours: 4 },
  { value: 'custom', label: 'Custom Hours', hours: 0 }
];

let editId = null;

function getHoursForDuration(duration, customHours) {
  if (duration === 'custom') return parseFloat(customHours) || 0;
  const d = DURATIONS.find(dur => dur.value === duration);
  return d ? d.hours : 8;
}

const submitView = {
  mount(container, params = {}) {
    editId = params.edit || null;
    const existing = editId ? Store.getAbsenceById(editId) : null;
    const plants = Store.getPlants();
    const isEdit = !!existing;

    container.innerHTML = `
      <div class="report-header">
        <h2 class="report-header__title">${isEdit ? 'Edit Absence' : 'Submit Absence'}</h2>
      </div>

      <div class="absence-form card">
        <div class="card__body">
          <div class="absence-form__row">
            <div class="form-group">
              <label class="form-label form-label--required" for="abs-employee">Employee Name</label>
              <input type="text" id="abs-employee" class="form-input" placeholder="Enter employee name"
                value="${existing ? existing.employeeName : ''}" autocomplete="off">
              <span class="form-error" id="err-employee"></span>
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="abs-plant">Plant</label>
              <select id="abs-plant" class="form-select">
                ${plants.map(p => `<option value="${p.id}" ${existing && existing.plantId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="absence-form__row">
            <div class="form-group">
              <label class="form-label form-label--required" for="abs-date">Date</label>
              <input type="date" id="abs-date" class="form-input" value="${existing ? existing.date : today()}">
            </div>
            <div class="form-group">
              <label class="form-label form-label--required">Type</label>
              <div class="radio-group" style="margin-top: 4px;">
                <label class="radio-option">
                  <input type="radio" name="abs-type" value="planned" ${!existing || existing.type === 'planned' ? 'checked' : ''}>
                  Planned
                </label>
                <label class="radio-option">
                  <input type="radio" name="abs-type" value="unplanned" ${existing && existing.type === 'unplanned' ? 'checked' : ''}>
                  Unplanned
                </label>
              </div>
            </div>
          </div>

          <div class="absence-form__row">
            <div class="form-group">
              <label class="form-label form-label--required" for="abs-reason">Reason</label>
              <select id="abs-reason" class="form-select">
                ${REASONS.map(r => `<option value="${r.value}" ${existing && existing.reason === r.value ? 'selected' : ''}>${r.label}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label form-label--required" for="abs-duration">Duration</label>
              <select id="abs-duration" class="form-select">
                ${DURATIONS.map(d => `<option value="${d.value}" ${existing && existing.duration === d.value ? 'selected' : ''}>${d.label}</option>`).join('')}
              </select>
              <div class="duration-custom-wrapper ${existing && existing.duration === 'custom' ? 'visible' : ''}" id="custom-hours-wrapper">
                <input type="number" id="abs-custom-hours" class="form-input" placeholder="0" min="0.5" max="12" step="0.5"
                  value="${existing && existing.duration === 'custom' ? existing.durationHours : ''}">
                <span>hours</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="abs-notes">Notes</label>
            <textarea id="abs-notes" class="form-textarea" placeholder="Optional notes about the absence...">${existing ? existing.notes || '' : ''}</textarea>
          </div>

          <div class="absence-form__actions">
            ${isEdit ? '<button type="button" class="btn btn--ghost" id="btn-cancel">Cancel</button>' : ''}
            <button type="button" class="btn btn--primary" id="btn-submit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              ${isEdit ? 'Update Absence' : 'Submit Absence'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Duration toggle
    const durationSelect = container.querySelector('#abs-duration');
    const customWrapper = container.querySelector('#custom-hours-wrapper');
    durationSelect.addEventListener('change', () => {
      customWrapper.classList.toggle('visible', durationSelect.value === 'custom');
    });

    // Submit handler
    container.querySelector('#btn-submit').addEventListener('click', () => {
      this.handleSubmit(container);
    });

    // Cancel handler
    const cancelBtn = container.querySelector('#btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        window.location.hash = '#daily';
      });
    }

    // Enter key on employee name
    container.querySelector('#abs-employee').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSubmit(container);
    });
  },

  handleSubmit(container) {
    const employee = container.querySelector('#abs-employee').value.trim();
    const plantId = container.querySelector('#abs-plant').value;
    const date = container.querySelector('#abs-date').value;
    const type = container.querySelector('input[name="abs-type"]:checked')?.value;
    const reason = container.querySelector('#abs-reason').value;
    const duration = container.querySelector('#abs-duration').value;
    const customHours = container.querySelector('#abs-custom-hours').value;
    const notes = container.querySelector('#abs-notes').value;

    // Validate
    const errEl = container.querySelector('#err-employee');
    if (!employee) {
      errEl.textContent = 'Employee name is required';
      container.querySelector('#abs-employee').classList.add('form-input--error');
      container.querySelector('#abs-employee').focus();
      return;
    }
    errEl.textContent = '';
    container.querySelector('#abs-employee').classList.remove('form-input--error');

    if (!date) {
      showToast('Please select a date', 'error');
      return;
    }

    if (duration === 'custom' && (!customHours || parseFloat(customHours) <= 0)) {
      showToast('Please enter custom hours', 'error');
      return;
    }

    const record = {
      employeeName: employee,
      plantId,
      date,
      type,
      reason,
      duration,
      durationHours: getHoursForDuration(duration, customHours),
      notes
    };

    if (editId) {
      Store.updateAbsence(editId, record);
      showToast('Absence updated successfully', 'success');
      window.location.hash = '#daily';
    } else {
      Store.addAbsence(record);
      showToast('Absence submitted successfully', 'success');
      // Reset form
      container.querySelector('#abs-employee').value = '';
      container.querySelector('#abs-date').value = today();
      container.querySelector('#abs-notes').value = '';
      container.querySelector('#abs-duration').value = 'full';
      container.querySelector('#custom-hours-wrapper').classList.remove('visible');
      container.querySelector('#abs-employee').focus();
    }
  },

  unmount() {
    editId = null;
  }
};

export default submitView;
