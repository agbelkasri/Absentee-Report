const Router = {
  routes: {},
  currentView: null,
  container: null,

  init(container, routes) {
    this.container = container;
    this.routes = routes;

    window.addEventListener('hashchange', () => this.resolve());

    if (!window.location.hash) {
      window.location.hash = '#daily';
    } else {
      this.resolve();
    }
  },

  resolve() {
    const hash = window.location.hash || '#daily';
    const [route, queryStr] = hash.split('?');
    const params = {};

    if (queryStr) {
      queryStr.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }

    const view = this.routes[route];
    if (!view) {
      window.location.hash = '#daily';
      return;
    }

    if (this.currentView && this.currentView.unmount) {
      this.currentView.unmount();
    }

    this.container.innerHTML = '';
    this.currentView = view;
    view.mount(this.container, params);

    // Update nav active state
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('nav-tab--active', tab.dataset.route === route);
    });
  },

  navigate(hash) {
    window.location.hash = hash;
  }
};

export default Router;
