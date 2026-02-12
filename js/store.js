import { generateId } from './utils/id.js';

const KEYS = {
  plants: 'absentee_plants',
  absences: 'absentee_absences'
};

const DEFAULT_PLANTS = [
  { id: 'plant-001', name: 'EAP' },
  { id: 'plant-002', name: 'GAP' },
  { id: 'plant-003', name: 'SLP' }
];

function load(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

function notify() {
  document.dispatchEvent(new CustomEvent('store:changed'));
}

const Store = {
  init() {
    // Always update plants to match defaults
    save(KEYS.plants, DEFAULT_PLANTS);
    if (!load(KEYS.absences)) {
      save(KEYS.absences, []);
    }
  },

  // Plants
  getPlants() {
    return load(KEYS.plants) || [];
  },

  getPlantById(id) {
    return this.getPlants().find(p => p.id === id);
  },

  getPlantName(id) {
    const plant = this.getPlantById(id);
    return plant ? plant.name : 'Unknown';
  },

  addPlant(name) {
    const plants = this.getPlants();
    const plant = { id: 'plant-' + generateId(), name: name.trim() };
    plants.push(plant);
    save(KEYS.plants, plants);
    notify();
    return plant;
  },

  removePlant(id) {
    const plants = this.getPlants().filter(p => p.id !== id);
    save(KEYS.plants, plants);
    notify();
  },

  // Absences
  getAbsences(filters = {}) {
    let absences = load(KEYS.absences) || [];

    if (filters.plantId && filters.plantId !== 'all') {
      absences = absences.filter(a => a.plantId === filters.plantId);
    }
    if (filters.dateFrom) {
      absences = absences.filter(a => a.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      absences = absences.filter(a => a.date <= filters.dateTo);
    }
    if (filters.type) {
      absences = absences.filter(a => a.type === filters.type);
    }
    if (filters.date) {
      absences = absences.filter(a => a.date === filters.date);
    }

    return absences;
  },

  getAbsenceById(id) {
    const absences = load(KEYS.absences) || [];
    return absences.find(a => a.id === id);
  },

  addAbsence(record) {
    const absences = load(KEYS.absences) || [];
    const now = new Date().toISOString();
    const absence = {
      id: generateId(),
      employeeName: record.employeeName.trim(),
      plantId: record.plantId,
      date: record.date,
      type: record.type,
      reason: record.reason,
      duration: record.duration,
      durationHours: record.durationHours || (record.duration === 'full' ? 8 : 4),
      notes: (record.notes || '').trim(),
      createdAt: now,
      updatedAt: now
    };
    absences.push(absence);
    save(KEYS.absences, absences);
    notify();
    return absence;
  },

  updateAbsence(id, updates) {
    const absences = load(KEYS.absences) || [];
    const index = absences.findIndex(a => a.id === id);
    if (index === -1) return null;
    absences[index] = {
      ...absences[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    save(KEYS.absences, absences);
    notify();
    return absences[index];
  },

  deleteAbsence(id) {
    const absences = (load(KEYS.absences) || []).filter(a => a.id !== id);
    save(KEYS.absences, absences);
    notify();
  },

  getAbsencesForDate(dateStr, plantId) {
    return this.getAbsences({ date: dateStr, plantId });
  },

  getAbsencesForMonth(year, month, plantId) {
    const mm = String(month + 1).padStart(2, '0');
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return this.getAbsences({
      dateFrom: `${year}-${mm}-01`,
      dateTo: `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`,
      plantId
    });
  },

  // Bulk operations
  clearAllAbsences() {
    save(KEYS.absences, []);
    notify();
  },

  seedDemoData(absences) {
    save(KEYS.absences, absences);
    notify();
  },

  isEmpty() {
    return (load(KEYS.absences) || []).length === 0;
  }
};

export default Store;
