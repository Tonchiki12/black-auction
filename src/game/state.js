import {
  DIFFICULTIES, INITIAL_FUNDS, INITIAL_HEAT, INITIAL_PRESTIGE, LOTS, PLAYER_COUNT,
  PLAYER_DEFINITIONS, ROUND_COUNT, SCHEMA_VERSION,
} from './data.js';
import { drawRandom, shuffle } from './rng.js';
import { assertPlayers, assertPriority, assertRecord, deepFreeze, requireCondition } from './validation.js';

export function priorityAt(startingPriority, rotations) {
  return PLAYER_DEFINITIONS.map((_, index) =>
    PLAYER_DEFINITIONS[(startingPriority + rotations + index) % PLAYER_COUNT].id);
}

export function createInitialState(rng, difficulty = 'normal') {
  // Reject invalid settings before shuffle or starting-priority RNG is consumed.
  requireCondition(DIFFICULTIES.includes(difficulty), 'Invalid difficulty');
  const deckOrder = shuffle(LOTS.map((lot) => lot.id), rng);
  const startingPriority = Math.floor(drawRandom(rng) * PLAYER_COUNT);
  return deepFreeze({
    schemaVersion: SCHEMA_VERSION,
    difficulty,
    status: 'in_progress',
    phase: 'awaiting_bid',
    round: 1,
    deckOrder,
    currentLotId: deckOrder[0],
    startingPriority,
    priorityOrder: priorityAt(startingPriority, 0),
    players: PLAYER_DEFINITIONS.map((definition) => ({
      ...definition, funds: INITIAL_FUNDS, prestige: INITIAL_PRESTIGE, heat: INITIAL_HEAT, patron: false,
    })),
    latestRoundResult: null,
    finalResult: null,
  });
}

// Engine preconditions, not a persistence/migration or tamper-proof save format.
export function assertState(state) {
  assertRecord(state, 'State');
  requireCondition(state.schemaVersion === SCHEMA_VERSION, 'Unsupported schemaVersion');
  requireCondition(DIFFICULTIES.includes(state.difficulty), 'Invalid difficulty');
  assertPlayers(state.players);
  requireCondition(Number.isInteger(state.round) && state.round >= 1
    && state.round <= ROUND_COUNT, 'Invalid round');
  requireCondition(Array.isArray(state.deckOrder) && state.deckOrder.length === ROUND_COUNT
    && new Set(state.deckOrder).size === ROUND_COUNT
    && state.deckOrder.every((id) => LOTS.some((lot) => lot.id === id)), 'Invalid deck permutation');
  requireCondition(state.currentLotId === state.deckOrder[state.round - 1], 'Current lot does not match round');
  requireCondition(Number.isInteger(state.startingPriority) && state.startingPriority >= 0
    && state.startingPriority < PLAYER_COUNT, 'Invalid starting priority');
  requireCondition(['awaiting_bid', 'resolved', 'finished'].includes(state.phase), 'Invalid phase');
  const finished = state.phase === 'finished';
  requireCondition(state.status === (finished ? 'finished' : 'in_progress'), 'Invalid game status');
  requireCondition(!finished || state.round === ROUND_COUNT, 'Cannot finish before round 13');
  assertPriority(state.priorityOrder, state.players);
  const rotations = finished ? state.round : state.round - 1;
  requireCondition(state.priorityOrder.every((id, index) =>
    id === priorityAt(state.startingPriority, rotations)[index]), 'Priority does not match round');
  const resolvedRound = state.phase === 'awaiting_bid' ? state.round - 1 : state.round;
  if (resolvedRound === 0) {
    requireCondition(state.latestRoundResult === null, 'Unexpected round result');
  } else {
    assertRecord(state.latestRoundResult, 'Round result');
    requireCondition(state.latestRoundResult.round === resolvedRound
      && state.latestRoundResult.lot?.id === state.deckOrder[resolvedRound - 1], 'Round result does not match progress');
  }
  if (finished) assertRecord(state.finalResult, 'Final result');
  else requireCondition(state.finalResult === null, 'Premature final result');
}
