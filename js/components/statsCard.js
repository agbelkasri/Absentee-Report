export function renderStatCard({ label, value, trend, trendDirection, icon }) {
  const trendClass = trendDirection === 'up' ? 'stat-card__trend--up'
    : trendDirection === 'down' ? 'stat-card__trend--down'
    : 'stat-card__trend--neutral';

  const trendArrow = trendDirection === 'up' ? '&#9650;'
    : trendDirection === 'down' ? '&#9660;'
    : '';

  const trendHtml = trend != null
    ? `<span class="stat-card__trend ${trendClass}">${trendArrow} ${trend}</span>`
    : '';

  return `
    <div class="stat-card">
      <span class="stat-card__label">${label}</span>
      <span class="stat-card__value">${value}</span>
      ${trendHtml}
    </div>
  `;
}

export function renderStatGrid(stats) {
  return `
    <div class="stat-grid">
      ${stats.map(s => renderStatCard(s)).join('')}
    </div>
  `;
}
