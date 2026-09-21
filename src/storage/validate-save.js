import { CANONICAL_BIDS, getLot, INITIAL_FUNDS, PLAYER_DEFINITIONS } from '../game/data.js';
import { assertState, priorityAt } from '../game/state.js';
import { assertPlayers, assertRecord, requireCondition } from '../game/validation.js';

const ids = PLAYER_DEFINITIONS.map(({ id }) => id);
const valueKeys = ['funds', 'prestige', 'heat', 'patron'];
const playerKeys = ['id', 'role', 'characterId', 'name', ...valueKeys];
const check = (condition) => requireCondition(condition, 'Inconsistent saved state');
function keys(value, expected) {
  assertRecord(value, 'Saved record');
  check(Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key)));
}
function sameFields(a, b, fields) { check(fields.every((key) => a[key] === b[key])); }
function idList(value, expected = ids) {
  check(Array.isArray(value) && value.length === expected.length
    && value.every((id, index) => id === expected[index]));
}
function values(value) {
  keys(value, valueKeys);
  check(Number.isSafeInteger(value.funds) && value.funds >= 0 && value.funds <= INITIAL_FUNDS);
  check(Number.isSafeInteger(value.prestige));
  check(Number.isSafeInteger(value.heat) && value.heat >= 0);
  check(typeof value.patron === 'boolean');
}

// Validate shape, identity and consistency of recorded snapshots only. Never
// resolve an auction, apply a card, rank scores, or infer elimination here.
function roundResult(result, state) {
  keys(result, ['round', 'lot', 'auctionType', 'bids', 'priorityOrder', 'winnerId',
    'victimId', 'payments', 'appliedEffects', 'playerChanges']);
  const lot = getLot(state.deckOrder[result.round - 1]);
  keys(result.lot, Object.keys(lot));
  sameFields(result.lot, lot, Object.keys(lot));
  check(result.auctionType === lot.auctionType);
  idList(result.priorityOrder, priorityAt(state.startingPriority, result.round - 1));
  check(lot.auctionType === 'normal'
    ? ids.includes(result.winnerId) && result.victimId === null
    : ids.includes(result.victimId) && result.winnerId === null);
  const recipient = result.winnerId ?? result.victimId;
  keys(result.bids, ids);
  keys(result.payments, ids);
  check(Array.isArray(result.playerChanges) && result.playerChanges.length === ids.length);
  result.playerChanges.forEach((change, index) => {
    keys(change, ['playerId', 'before', 'after', 'delta', 'patronAcquired']);
    const id = ids[index];
    check(change.playerId === id);
    values(change.before);
    values(change.after);
    sameFields(change.after, state.players[index], valueKeys);
    keys(change.delta, ['funds', 'prestige', 'heat']);
    for (const key of ['funds', 'prestige', 'heat']) {
      check(Number.isSafeInteger(change.delta[key]));
      check(change.before[key] + change.delta[key] === change.after[key]);
    }
    check(typeof change.patronAcquired === 'boolean');
    check(change.patronAcquired === (!change.before.patron && change.after.patron));
    // Bids refer to the recorded BEFORE funds, never the post-payment balance.
    check(CANONICAL_BIDS.includes(result.bids[id]) && result.bids[id] <= change.before.funds);
    check(Number.isSafeInteger(result.payments[id]) && result.payments[id] >= 0
      && result.payments[id] <= change.before.funds);
    check(change.delta.funds === -result.payments[id]);
  });
  assertPlayers(result.playerChanges.map((change, index) => ({ ...PLAYER_DEFINITIONS[index], ...change.before })));
  check(Array.isArray(result.appliedEffects) && result.appliedEffects.length === 1);
  for (const effect of result.appliedEffects) {
    keys(effect, ['playerId', 'specialEffect', 'prestigeDelta', 'heatDelta', 'patronGranted']);
    check(effect.playerId === recipient && effect.specialEffect === lot.specialEffect);
    const change = result.playerChanges.find(({ playerId }) => playerId === effect.playerId);
    check(effect.prestigeDelta === change.delta.prestige && effect.heatDelta === change.delta.heat
      && effect.patronGranted === change.patronAcquired);
  }
}

function finalResult(result, state) {
  keys(result, ['outcome', 'winnerIds', 'players']);
  assertPlayers(result.players);
  check(['winners', 'all_eliminated'].includes(result.outcome));
  check(Array.isArray(result.winnerIds) && new Set(result.winnerIds).size === result.winnerIds.length
    && result.winnerIds.every((id) => ids.includes(id)));
  result.players.forEach((player, index) => {
    keys(player, [...playerKeys, 'finalScore', 'eliminated', 'eliminationReason', 'winner']);
    sameFields(player, state.players[index], playerKeys);
    check(typeof player.eliminated === 'boolean' && typeof player.winner === 'boolean');
    check(['none', 'bust', 'bankroll'].includes(player.eliminationReason));
    check(player.eliminated === (player.eliminationReason !== 'none'));
    check(player.eliminated ? player.finalScore === null && !player.winner : Number.isSafeInteger(player.finalScore));
    check(player.winner === result.winnerIds.includes(player.id));
  });
  check(result.outcome === 'all_eliminated'
    ? result.winnerIds.length === 0 && result.players.every(({ eliminated }) => eliminated)
    : result.winnerIds.length > 0);
}

export function validateSave(state) {
  keys(state, ['schemaVersion', 'difficulty', 'status', 'phase', 'round', 'deckOrder', 'currentLotId',
    'startingPriority', 'priorityOrder', 'players', 'latestRoundResult', 'finalResult']);
  // Reuse preconditions for schema, deck permutation, phase/round and priority;
  // complete the persistence contract below, beyond assertState's scope.
  assertState(state);
  state.players.forEach((player) => keys(player, playerKeys));
  if (state.latestRoundResult !== null) roundResult(state.latestRoundResult, state);
  if (state.finalResult !== null) finalResult(state.finalResult, state);
  return state;
}
