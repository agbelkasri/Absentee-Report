export function showModal({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, danger = false }) {
  const container = document.getElementById('modal-container');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">${title}</h3>
      <button class="btn btn--icon modal__close" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal__body">${body}</div>
    <div class="modal__footer">
      <button class="btn btn--ghost modal__cancel">${cancelLabel}</button>
      <button class="btn ${danger ? 'btn--danger' : 'btn--primary'} modal__confirm">${confirmLabel}</button>
    </div>
  `;

  backdrop.appendChild(modal);
  container.appendChild(backdrop);

  function close() {
    backdrop.remove();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  modal.querySelector('.modal__close').addEventListener('click', close);
  modal.querySelector('.modal__cancel').addEventListener('click', close);
  modal.querySelector('.modal__confirm').addEventListener('click', () => {
    if (onConfirm) onConfirm();
    close();
  });

  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onEsc);
    }
  });

  // Focus trap
  modal.querySelector('.modal__confirm').focus();
}

export function showDetailModal({ title, bodyHtml }) {
  const container = document.getElementById('modal-container');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">${title}</h3>
      <button class="btn btn--icon modal__close" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal__body">${bodyHtml}</div>
    <div class="modal__footer">
      <button class="btn btn--ghost modal__close-btn">Close</button>
    </div>
  `;

  backdrop.appendChild(modal);
  container.appendChild(backdrop);

  function close() {
    backdrop.remove();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  modal.querySelectorAll('.modal__close, .modal__close-btn').forEach(btn => {
    btn.addEventListener('click', close);
  });

  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onEsc);
    }
  });
}
