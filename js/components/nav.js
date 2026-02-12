const TABS = [
  {
    route: '#submit',
    label: 'Submit Absence',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`
  },
  {
    route: '#daily',
    label: 'Daily Report',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="14.01"/></svg>`
  },
  {
    route: '#monthly',
    label: 'Monthly Report',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
  }
];

export function renderNav(container) {
  const inner = document.createElement('div');
  inner.className = 'app-nav__inner';

  TABS.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'nav-tab';
    btn.dataset.route = tab.route;
    btn.innerHTML = `
      <span class="nav-tab__icon">${tab.icon}</span>
      <span>${tab.label}</span>
    `;
    btn.addEventListener('click', () => {
      window.location.hash = tab.route;
    });

    if (window.location.hash === tab.route) {
      btn.classList.add('nav-tab--active');
    }

    inner.appendChild(btn);
  });

  container.appendChild(inner);
}
