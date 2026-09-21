import { mountInstallView } from './pwa/install-view.js';
import { startOfflineSupport } from './pwa/offline.js';
import { bootstrapApplication } from './application.js';
import { startPwaShell } from './pwa/shell.js';

let offlineSupport;
// BEGIN PWA OFFLINE BOOTSTRAP
offlineSupport = startOfflineSupport({ baseUrl: new URL('../', import.meta.url).href, onChange: state => {
  Object.assign(document.documentElement.dataset, {
    pwaOfflineStatus: state.status, pwaOfflineReady: String(state.ready),
    pwaController: String(state.controlled), pwaRevision: state.revision ?? '',
    pwaWaiting: String(state.waiting),
  });
} });
// END PWA OFFLINE BOOTSTRAP

const root = document.querySelector('#app');
const shell = startPwaShell({
  startGame: () => bootstrapApplication(root),
  showInstallRequired: () => mountInstallView(root, { offlineSupport }),
});

// Passive launch observations, independent of Gate OFF. No normal UI or save.
Object.assign(document.documentElement.dataset, {
  pwaDisplayMode: shell.mode,
  pwaDetectionSource: shell.source,
  pwaGateEnabled: String(shell.gateEnabled),
  pwaGameAllowed: String(shell.gameAllowed),
});
