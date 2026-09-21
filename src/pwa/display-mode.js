// This is a launch-state observation, not an installation-history or UA guess.
// Platform injection keeps the browser API boundary testable without pretending
// that an emulated value is real Home Screen acceptance.
export function readDisplayMode(platform = globalThis) {
  const mediaStandalone = platform.matchMedia?.('(display-mode: standalone)').matches === true;
  const legacyStandalone = platform.navigator?.standalone === true;
  const standalone = mediaStandalone || legacyStandalone;
  return {
    standalone,
    mode: standalone ? 'standalone' : 'browser',
    source: mediaStandalone ? 'display-mode' : legacyStandalone ? 'navigator.standalone' : 'browser',
  };
}
