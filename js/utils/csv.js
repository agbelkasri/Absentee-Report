export function exportToCSV(absences, plants, filename = 'absences.csv') {
  const plantMap = {};
  plants.forEach(p => { plantMap[p.id] = p.name; });

  const reasonLabels = {
    vacation: 'Vacation', sick: 'Sick', personal: 'Personal',
    family_emergency: 'Family Emergency', jury_duty: 'Jury Duty',
    bereavement: 'Bereavement', other: 'Other'
  };

  const durationLabels = {
    full: 'Full Day', half_am: 'Half Day (AM)', half_pm: 'Half Day (PM)', custom: 'Custom'
  };

  const headers = ['Date', 'Employee', 'Plant', 'Type', 'Reason', 'Duration', 'Hours', 'Notes'];
  const rows = absences.map(a => [
    a.date,
    a.employeeName,
    plantMap[a.plantId] || a.plantId,
    a.type === 'planned' ? 'Planned' : 'Unplanned',
    reasonLabels[a.reason] || a.reason,
    durationLabels[a.duration] || a.duration,
    a.durationHours,
    `"${(a.notes || '').replace(/"/g, '""')}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
