import { INSTALL_GATE_ENABLED } from '../config.js';
import { readDisplayMode } from './display-mode.js';

// UX policy only. Display detection and gate enablement are independent.
export function evaluateLaunchPolicy({ standalone, gateEnabled }) {
  return { gateEnabled, gameAllowed: !gateEnabled || standalone === true };
}

export function startPwaShell({ platform = globalThis, gateEnabled = INSTALL_GATE_ENABLED,
  startGame, showInstallRequired }) {
  const display = readDisplayMode(platform);
  const policy = evaluateLaunchPolicy({ standalone: display.standalone, gateEnabled });
  const state = Object.freeze({ ...display, ...policy });
  if (state.gameAllowed) startGame();
  else showInstallRequired();
  // No foreground/pageshow handler remounts the game or changes its current view.
  return state;
}
