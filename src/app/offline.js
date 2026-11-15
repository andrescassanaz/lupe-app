export class OfflineManager extends EventTarget {
  constructor() {
    super();
    this.state = { status: 'preparing', progress: 0, ready: false, update: false, persistent: null, error: '' };
    this.registration = null;
    this.allowReload = () => false;
    this.starting = null;
    this.hasController = Boolean(navigator.serviceWorker?.controller);
    navigator.serviceWorker?.addEventListener('message', event => {
      if (event.data?.type !== 'DOWNLOAD_PROGRESS') return;
      this.set({ status: this.state.ready ? 'updating' : 'preparing', progress: event.data.progress });
    });
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      if (this.hasController && this.allowReload()) { location.reload(); return; }
      this.hasController = true;
      this.verify();
    });
  }
  set(patch) { Object.assign(this.state, patch); this.dispatchEvent(new Event('change')); }

  start() {
    if (this.starting) return this.starting;
    this.starting = this.initialize().finally(() => { this.starting = null; });
    return this.starting;
  }
  async initialize() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      this.set({ status: 'error', error: 'Para guardar los juegos necesitás abrir la app con HTTPS o en localhost.' }); return;
    }
    this.set({ status: this.state.ready ? 'updating' : 'preparing', error: '' });
    try {
      this.registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      this.registration.addEventListener('updatefound', () => this.watch(this.registration.installing));
      if (this.registration.installing) this.watch(this.registration.installing);
      if (this.registration.waiting) this.set({ update: true });
      if (this.registration.active) await this.verify();
      if (!this.registration.installing && !this.registration.active && !this.registration.waiting) {
        this.set({ status: 'error', error: 'No se pudo completar la descarga. Revisá la conexión y el espacio disponible, y reintentá.' });
      }
    } catch {
      this.set({ status: 'error', error: 'No se pudo completar la descarga. Revisá la conexión y el espacio disponible, y reintentá.' });
    }
  }
  watch(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', async () => {
      if (worker.state === 'installed') {
        if (this.registration.active) { this.set({ update: true, status: 'ready' }); await this.verify(); }
      }
      if (worker.state === 'activated') await this.verify();
      if (worker.state === 'redundant') this.set({ status: 'error', error: 'La descarga quedó incompleta. Revisá la conexión y el espacio disponible, y reintentá.' });
    });
  }
  request(worker, type) {
    return new Promise((resolve, reject) => {
      if (!worker) { reject(new Error('No worker')); return; }
      const channel = new MessageChannel();
      const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('Timeout')); }, 15000);
      channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); resolve(event.data); };
      worker.postMessage({ type }, [channel.port2]);
    });
  }
  async verify() {
    try {
      const worker = this.registration?.active || navigator.serviceWorker.controller;
      if (!worker) return;
      const result = await this.request(worker, 'VERIFY');
      this.set({ ready: result.ready, status: result.ready ? 'ready' : 'error', progress: result.ready ? 100 : 0,
        error: result.ready ? '' : 'Faltan recursos guardados. Conectate a internet y tocá Reintentar.' });
      if (result.ready && this.state.persistent === null) await this.requestPersistence();
    } catch { this.set({ ready: false, status: 'error', error: 'No pudimos comprobar la descarga. Tocá Reintentar.' }); }
  }
  async requestPersistence() {
    try {
      if (!navigator.storage?.persist) { this.set({ persistent: 'unsupported' }); return; }
      await navigator.storage.persist();
      this.set({ persistent: await navigator.storage.persisted() });
    } catch { this.set({ persistent: false }); }
  }
  async retry() {
    this.set({ error: '', status: 'preparing' });
    try {
      if (this.registration?.active) {
        const result = await this.request(this.registration.active, 'REPAIR');
        if (!result.ready) throw new Error('Repair failed');
        await this.verify();
        // Check for a newer version without making it a requirement for playing.
        this.registration.update().catch(() => {});
      } else await this.start();
    } catch {
      this.registration?.update().catch(() => {});
      this.set({ status: 'error', error: 'La descarga no terminó. Revisá la conexión y el espacio disponible, y reintentá.' });
    }
    await this.requestPersistence();
  }
  async activateUpdate() {
    if (!this.allowReload() || !this.registration?.waiting) return;
    try {
      const result = await this.request(this.registration.waiting, 'ACTIVATE_UPDATE');
      if (result.blocked) this.set({ error: 'Cerrá las otras pestañas de Lupe para aplicar la actualización.' });
    } catch { this.set({ error: 'La versión nueva sigue pendiente. Podés seguir jugando.' }); }
  }
}
