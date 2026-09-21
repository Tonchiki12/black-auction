import { chooseNpcBid as defaultChooseNpcBid } from './ai.js';
import { getLot, ROUND_COUNT } from './data.js';
import { defaultRng } from './rng.js';
import { resolveAuction, resolveFinal } from './rules.js';
import { assertState, createInitialState, priorityAt } from './state.js';
import {
  assertBid, assertRecord, copyPlayer, deepFreeze, getPlayer, legalBidsFor, requireCondition,
} from './validation.js';

function requirePhase(state, phase) {
  assertState(state);
  if (state.phase !== phase) throw new Error(`Expected phase ${phase}, got ${state.phase}`);
}

// Explicit allowlist: no state spread, deck, previous results, or current bids.
function decisionContext(state, playerId) {
  const player = getPlayer(state.players, playerId);
  requireCondition(player.role === 'npc', 'Decision context requires an NPC');
  return deepFreeze({
    playerId,
    personality: player.characterId,
    difficulty: state.difficulty,
    currentLot: { ...getLot(state.currentLotId) },
    round: state.round,
    remainingRounds: ROUND_COUNT - state.round,
    priorityOrder: [...state.priorityOrder],
    players: state.players.map(copyPlayer),
    legalBids: legalBidsFor(player),
  });
}

/** Immutable commands. Keep the returned State as the sole authoritative value.
 * RNG and an optional synchronous NPC policy are services, never stored in State.
 */
export function createGameEngine({ rng = defaultRng, chooseNpcBid = defaultChooseNpcBid } = {}) {
  requireCondition(typeof rng === 'function', 'RNG must be a function');
  requireCondition(typeof chooseNpcBid === 'function', 'NPC policy must be a function');
  return Object.freeze({
    createGame(options = {}) {
      assertRecord(options, 'Game options');
      return createInitialState(rng, options.difficulty);
    },

    getLegalBids(state, playerId) {
      requirePhase(state, 'awaiting_bid');
      return legalBidsFor(getPlayer(state.players, playerId));
    },

    getDecisionContext(state, playerId) {
      requirePhase(state, 'awaiting_bid');
      return decisionContext(state, playerId);
    },

    submitBid(state, command) {
      requirePhase(state, 'awaiting_bid');
      assertRecord(command, 'Bid command');
      const human = getPlayer(state.players, command.playerId);
      requireCondition(human.role === 'human', 'Only the Human may submit a bid command');
      assertBid(human, command.amount);
      // Snapshot every NPC's public input before evaluating any of their bids.
      const contexts = state.players.filter((player) => player.role === 'npc')
        .map((player) => decisionContext(state, player.id));
      const bids = { [human.id]: command.amount };
      for (const context of contexts) {
        const bid = chooseNpcBid(context, rng);
        assertBid(getPlayer(state.players, context.playerId), bid);
        bids[context.playerId] = bid;
      }
      const { players, roundResult } = resolveAuction({
        players: state.players, lotId: state.currentLotId, bids,
        priorityOrder: state.priorityOrder, round: state.round,
      });
      return deepFreeze({
        ...state, deckOrder: [...state.deckOrder], priorityOrder: [...state.priorityOrder],
        phase: 'resolved', players, latestRoundResult: roundResult,
      });
    },

    advanceRound(state) {
      requirePhase(state, 'resolved');
      // Also rotate at the end of round 13; the result retains priority used.
      const priorityOrder = priorityAt(state.startingPriority, state.round);
      const copy = {
        ...state, deckOrder: [...state.deckOrder], players: state.players.map(copyPlayer),
        latestRoundResult: JSON.parse(JSON.stringify(state.latestRoundResult)), priorityOrder,
      };
      if (state.round === ROUND_COUNT) {
        return deepFreeze({ ...copy, phase: 'finished', status: 'finished', finalResult: resolveFinal(state.players) });
      }
      return deepFreeze({
        ...copy, round: state.round + 1, phase: 'awaiting_bid', currentLotId: state.deckOrder[state.round],
      });
    },
  });
}
