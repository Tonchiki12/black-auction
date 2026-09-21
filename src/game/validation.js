import { CANONICAL_BIDS, INITIAL_FUNDS, PLAYER_COUNT, PLAYER_DEFINITIONS } from './data.js';

export function requireCondition(condition, message) {
  if (!condition) throw new TypeError(message);
}

export function assertRecord(value, label) {
  requireCondition(value !== null && typeof value === 'object'
    && Object.getPrototypeOf(value) === Object.prototype, `${label} must be a plain object`);
}

export function assertPlayers(players) {
  requireCondition(Array.isArray(players) && players.length === PLAYER_COUNT, 'Expected four players');
  players.forEach((player, index) => {
    assertRecord(player, 'Player');
    const definition = PLAYER_DEFINITIONS[index];
    for (const key of ['id', 'role', 'characterId', 'name']) {
      requireCondition(player[key] === definition[key], `Invalid player ${key} at seat ${index}`);
    }
    requireCondition(Number.isSafeInteger(player.funds) && player.funds >= 0
      && player.funds <= INITIAL_FUNDS, 'Invalid player funds');
    requireCondition(Number.isSafeInteger(player.prestige), 'Invalid player prestige');
    requireCondition(Number.isSafeInteger(player.heat) && player.heat >= 0, 'Invalid player heat');
    requireCondition(typeof player.patron === 'boolean', 'Invalid patron ownership');
  });
  requireCondition(players.filter((player) => player.patron).length <= 1, 'Only one patron exists');
}

export function getPlayer(players, playerId) {
  const player = players.find((entry) => entry.id === playerId);
  if (!player) throw new RangeError(`Unknown player: ${playerId}`);
  return player;
}

export function assertPriority(priorityOrder, players) {
  requireCondition(Array.isArray(priorityOrder) && priorityOrder.length === PLAYER_COUNT
    && new Set(priorityOrder).size === PLAYER_COUNT
    && priorityOrder.every((id) => players.some((player) => player.id === id)), 'Invalid priority order');
}

export function legalBidsFor(player) {
  requireCondition(Number.isSafeInteger(player.funds) && player.funds >= 0, 'Invalid player funds');
  return CANONICAL_BIDS.filter((bid) => bid <= player.funds);
}

export function assertBid(player, amount) {
  if (!CANONICAL_BIDS.includes(amount) || amount > player.funds) {
    throw new RangeError(`Illegal bid for ${player.id}: ${amount}`);
  }
}

export function assertBids(bids, players) {
  assertRecord(bids, 'Bids');
  requireCondition(Object.keys(bids).length === PLAYER_COUNT
    && players.every((player) => Object.hasOwn(bids, player.id)), 'Bids must name all four players exactly once');
  players.forEach((player) => assertBid(player, bids[player.id]));
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function playerValues(player) {
  return { funds: player.funds, prestige: player.prestige, heat: player.heat, patron: player.patron };
}

export function copyPlayer(player) {
  return {
    id: player.id, role: player.role, characterId: player.characterId, name: player.name,
    ...playerValues(player),
  };
}
