import { createGameEngine } from './game/engine.js';
import { mountGame } from './ui/app.js';

// Standard Engine/RNG/NPC. The controller alone loads save data and enters Menu.
export function bootstrapApplication(root) {
  return mountGame(root, { engine: createGameEngine() });
}
