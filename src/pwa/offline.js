// PWA-only boundary. Cache Storage and Game State never meet in this module.
export function createOfflineSupport({ baseUrl, platform = globalThis, onChange = () => {} }) {
  let registration;
  let updateFailure = null;
  let refreshGeneration = 0;
  let snapshot = Object.freeze({ status: 'preparing', ready: false, controlled: false,
    revision: null, waiting: false, installing: false, updateFailure: null });
  const listeners = new Set([onChange]);
  const publish = values => {
    snapshot = Object.freeze({ ...snapshot, ...values });
    for (const listener of listeners) listener(snapshot);
    return snapshot;
  };
  const base = new URL(baseUrl);
  const workerUrl = new URL('sw.js', base).href;
  const container = platform.navigator?.serviceWorker;
  const validScope = platform.location?.origin === base.origin
    && base.pathname.endsWith('/') && platform.location.pathname.startsWith(base.pathname);
  function workerStatus(worker) {
    return new Promise((resolve, reject) => {
      const channel = new platform.MessageChannel();
      const timer = platform.setTimeout(() => { channel.port1.close(); reject(new Error('Worker status timeout')); }, 4000);
      channel.port1.onmessage = event => {
        platform.clearTimeout(timer); channel.port1.close(); resolve(event.data);
      };
      try { worker.postMessage({ type: 'BLACK_AUCTION_RUNTIME_STATUS' }, [channel.port2]); }
      catch (error) { platform.clearTimeout(timer); channel.port1.close(); reject(error); }
    });
  }
  async function refresh() {
    if (!registration) return snapshot;
    const generation = ++refreshGeneration;
    const controlled = container.controller?.scriptURL === workerUrl;
    const active = controlled ? container.controller : registration.active;
    const common = { controlled, waiting: Boolean(registration.waiting), installing: Boolean(registration.installing), updateFailure };
    if (!active || active.state !== 'activated') return publish({ ...common, status: updateFailure ? 'degraded' : 'preparing', ready: false });
    try {
      const report = await workerStatus(active);
      if (generation !== refreshGeneration) return snapshot;
      return publish({ ...common, ...report, status: report.complete ? 'ready' : 'degraded', ready: report.complete === true });
    } catch {
      if (generation !== refreshGeneration) return snapshot;
      return publish({ ...common, status: 'degraded', ready: false });
    }
  }
  const observed = new WeakSet();
  function observeWorker(worker) {
    if (!worker || observed.has(worker)) return;
    observed.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'redundant') updateFailure = 'install-failed';
      void refresh();
    });
  }
  function attach(value) {
    registration = value;
    observeWorker(value.installing); observeWorker(value.waiting); observeWorker(value.active);
    value.addEventListener('updatefound', () => { updateFailure = null; observeWorker(value.installing); void refresh(); });
  }
  const api = {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); listener(snapshot); return () => listeners.delete(listener); },
    refresh,
    async checkForUpdate() {
      if (!registration) return snapshot;
      try { await registration.update(); } catch { updateFailure = 'update-check-failed'; }
      return refresh();
    },
  };
  if (!validScope || !['http:', 'https:'].includes(base.protocol)) { publish({ status: 'out-of-scope', ready: false }); return api; }
  if (!platform.isSecureContext) { publish({ status: 'insecure-context', ready: false }); return api; }
  if (!container) { publish({ status: 'unsupported', ready: false }); return api; }
  container.addEventListener('controllerchange', () => { void refresh(); }); // Observe only; never reload.
  platform.addEventListener('online', () => { void api.checkForUpdate(); });
  platform.addEventListener('pageshow', () => { void refresh(); });
  publish({ status: 'preparing' });
  void (async () => {
    try {
      const existing = await container.getRegistration(base.href);
      if (existing?.scope === base.href && existing.active?.scriptURL === workerUrl) { attach(existing); await refresh(); }
      const value = await container.register(workerUrl, { scope: base.href, type: 'classic', updateViaCache: 'none' });
      if (value.scope !== base.href) throw new Error('Unexpected worker scope');
      if (value !== registration) attach(value);
      await refresh();
    } catch {
      if (registration?.active) { updateFailure = 'update-check-failed'; await refresh(); }
      else publish({ status: 'registration-failed', ready: false });
    }
  })();
  return api;
}

let currentSupport;
export function startOfflineSupport(options) {
  currentSupport ??= createOfflineSupport(options);
  return currentSupport;
}
export function getOfflineSupport() { return currentSupport; }
