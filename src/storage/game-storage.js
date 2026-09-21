import { deepFreeze } from '../game/validation.js';
import { validateSave } from './validate-save.js';

export const SAVE_KEY = 'black-market-auction.game-state';

// Access lazily: even reading window.localStorage can throw. This module has no
// DOM or Engine commands and never removes keys, repairs data, or migrates it.
export function createGameStorage({ getStorage = () => globalThis.localStorage } = {}) {
  return {
    load() {
      let json;
      try { json = getStorage().getItem(SAVE_KEY); }
      catch { return { kind: 'unavailable' }; }
      if (json === null) return { kind: 'empty' };
      try {
        return { kind: 'loaded', state: deepFreeze(validateSave(JSON.parse(json))) };
      } catch { return { kind: 'invalid' }; }
    },
    save(state) {
      try {
        getStorage().setItem(SAVE_KEY, JSON.stringify(state));
        return { ok: true };
      } catch { return { ok: false }; }
    },
  };
}
