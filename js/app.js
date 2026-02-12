import Store from './store.js';
import Router from './router.js';
import { renderNav } from './components/nav.js';
import submitView from './views/submitView.js';
import dailyView from './views/dailyView.js';
import monthlyView from './views/monthlyView.js';
import { generateId } from './utils/id.js';

function populatePlantFilter() {
  const select = document.getElementById('global-plant-filter');
  const plants = Store.getPlants();
  const currentVal = select.value;

  select.innerHTML = `<option value="all">All Plants</option>` +
    plants.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  if (currentVal && [...select.options].some(o => o.value === currentVal)) {
    select.value = currentVal;
  }
}

function seedDemoData() {
  const plants = Store.getPlants();
  const plantIds = plants.map(p => p.id);
  const names = [
    'Alice Johnson', 'Bob Williams', 'Carol Davis', 'David Martinez',
    'Emily Chen', 'Frank Wilson', 'Grace Lee', 'Henry Brown',
    'Isabella Taylor', 'Jack Anderson', 'Karen Thomas', 'Leo Jackson',
    'Maria Garcia', 'Nathan White', 'Olivia Harris', 'Patrick Clark'
  ];
  const reasons = ['vacation', 'sick', 'personal', 'family_emergency', 'jury_duty', 'bereavement', 'other'];
  const types = ['planned', 'planned', 'planned', 'unplanned', 'unplanned'];
  const laborTypes = ['direct', 'direct', 'direct', 'indirect', 'indirect'];
  const shifts = ['1st', '1st', '1st', '2nd', '2nd'];
  const durations = ['full', 'full', 'full', 'half_am', 'half_pm'];

  const absences = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Generate data for the last 6 months
  for (let m = 5; m >= 0; m--) {
    let yr = currentYear;
    let mo = currentMonth - m;
    while (mo < 0) { mo += 12; yr--; }

    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    // Generate 15-40 absences per month
    const count = 15 + Math.floor(Math.random() * 26);

    for (let i = 0; i < count; i++) {
      const day = 1 + Math.floor(Math.random() * daysInMonth);
      const mm = String(mo + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const date = `${yr}-${mm}-${dd}`;
      const type = types[Math.floor(Math.random() * types.length)];
      const reason = type === 'planned'
        ? ['vacation', 'personal', 'jury_duty'][Math.floor(Math.random() * 3)]
        : ['sick', 'family_emergency', 'personal', 'other'][Math.floor(Math.random() * 4)];
      const duration = durations[Math.floor(Math.random() * durations.length)];

      absences.push({
        id: generateId(),
        employeeName: names[Math.floor(Math.random() * names.length)],
        plantId: plantIds[Math.floor(Math.random() * plantIds.length)],
        date,
        type,
        laborType: laborTypes[Math.floor(Math.random() * laborTypes.length)],
        shift: shifts[Math.floor(Math.random() * shifts.length)],
        reason,
        duration,
        durationHours: duration === 'full' ? 8 : 4,
        notes: '',
        createdAt: new Date(date + 'T08:00:00').toISOString(),
        updatedAt: new Date(date + 'T08:00:00').toISOString()
      });
    }
  }

  Store.seedDemoData(absences);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize store
  Store.init();

  // Populate plant filter
  populatePlantFilter();

  // Listen for store changes to update plant filter
  document.addEventListener('store:changed', populatePlantFilter);

  // Render navigation
  const navContainer = document.getElementById('app-nav');
  renderNav(navContainer);

  // Initialize router
  const appContainer = document.getElementById('app');
  Router.init(appContainer, {
    '#submit': submitView,
    '#daily': dailyView,
    '#monthly': monthlyView
  });

  // Seed demo data if empty or if data is missing new fields (laborType/shift)
  const needsReseed = Store.isEmpty() || (() => {
    const sample = Store.getAbsences({})[0];
    return sample && !sample.laborType;
  })();
  if (needsReseed) {
    seedDemoData();
  }
});
